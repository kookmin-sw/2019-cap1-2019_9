// Muaz Khan         - www.MuazKhan.com
// MIT License       - www.WebRTC-Experiment.com/licence
// Experiments       - github.com/muaz-khan/WebRTC-Experiment

// This library is known as multi-user connectivity wrapper!
// It handles connectivity tasks to make sure two or more users can interconnect!

//변수에 함수 연결
var conference = function(config) {
    //윈도우를 참조하는 셀프 변수
    var self = {
      //유저를 식별하는 토큰 데이터에 랜덤값 할당
        userToken: uniqueToken()
    };

    //채널, 브로드캐스트, 방생성확인, 소켓, 디폴트 소켓 변수 생성
    var channels = '--', isbroadcaster;

    var isGetNewRoom = true;
    var sockets = [];
    var defaultSocket = { };

    // 디폴트소켓 여는 함수
    function openDefaultSocket(callback) {
        // 디폴트 소켓에 index.html 코드 line 118 openSocket 실행
        // config 데이터는 index html 에 있음
        defaultSocket = config.openSocket({
            //line 37
            onmessage: onDefaultSocketResponse,

            //콜백 변수에 소켓 데이터 담긴 함수 넣어 줌
            callback: function(socket) {
                //디폴트 소켓에 소켓 값 할당 - 어디선가 할당 받아오는 듯
                defaultSocket = socket;
                callback();
            }
        });
    }

    //openSocket의 onmessage에 반영될 데이터 line 28
    function onDefaultSocketResponse(response) {
        //넘겨준 reponse데이터에서 유저토큰값과 들고 있는 유저 토큰 값이 같으면 리턴
        if (response.userToken == self.userToken) return;

        //새로운 방이 있고, 룸토큰,브로드캐스터 데이터 있을 시 활성화된 방을 찾는다.
        if (isGetNewRoom && response.roomToken && response.broadcaster) config.onRoomFound(response);

        //새로운 참가자가 있고 방에 입장했고, 브로드캐스터 아이디가 유저 토큰 데이터와 같다면, onNewParticipant line 260
        if (response.newParticipant && self.joinedARoom && self.broadcasterid == response.userToken) onNewParticipant(response.newParticipant);

        //들어온 유저가 나이고, 참가자가 있고, 들어온 유저토큰의 인덱스가 -1일때
        if (response.userToken && response.joinUser == self.userToken && response.participant && channels.indexOf(response.userToken) == -1) {
            //채널 변수에 유저토큰 값 추가
            channels += response.userToken + '--';
            //서브 소켓 오픈
            openSubSocket({
              //제공자가 맞으므로 true, 채널 데이터에 response 채널 데이터 할당
                isofferer: true,
                channel: response.channel || response.userToken
            });
        }

        // to make sure room is unlisted if owner leaves
        //방 닫는 함수 실행
        if (response.left && config.onRoomClosed) {
            config.onRoomClosed(response);
        }
    }

    //서브 소켓 여는 함수
    function openSubSocket(_config) {
      // 데이터가 없다면 리턴
        if (!_config.channel) return;

        //소켓 설정 변수
        var socketConfig = {
          //채널값 할당
            channel: _config.channel,
            //onmessage에 소켓 응답 값 할당
            onmessage: socketResponse,
            //오픈 변수에 함수 할당
            onopen: function() {
                //제공자 이고 피어가 없으면 피어를 시작하는 함수 실행
                if (isofferer && !peer) initPeer();
                //소켓 배열 마지막에 소켓 정보 할당
                sockets[sockets.length] = socket;
            }
        };

        socketConfig.callback = function(_socket) {
          //소켓 값 할당
            socket = _socket;
            //오픈
            this.onopen();

            if(_config.callback) {
                _config.callback();
            }
        };
        //소켓, 제공자, 스트림, 비디오 , inner 배열, 피어 변수 선언
        var socket = config.openSocket(socketConfig),
            isofferer = _config.isofferer,
            gotstream,
            video = document.createElement('video'),
            inner = { },
            peer;

        // 피어 정보 세팅
        var peerConfig = {
            attachStream: config.attachStream,
            onICE: function(candidate) {
                socket.send({
                    userToken: self.userToken,
                    candidate: {
                        sdpMLineIndex: candidate.sdpMLineIndex,
                        candidate: JSON.stringify(candidate.candidate)
                    }
                });
            },
            onRemoteStream: function(stream) {
                if (!stream) return;

                try {//비디오 속성 세팅
                    video.setAttributeNode(document.createAttribute('autoplay'));
                    video.setAttributeNode(document.createAttribute('playsinline'));
                    video.setAttributeNode(document.createAttribute('controls'));
                } catch (e) {
                    video.setAttribute('autoplay', true);
                    video.setAttribute('playsinline', true);
                    video.setAttribute('controls', true);
                }

                video.srcObject = stream;

                _config.stream = stream;
                onRemoteStreamStartsFlowing();
            },
            //스트림 종료
            onRemoteStreamEnded: function(stream) {
                if (config.onRemoteStreamEnded)
                    config.onRemoteStreamEnded(stream, video);
            }
        };


        function initPeer(offerSDP) {
            if (!offerSDP) {//넘어온 데이터 없으면 onOfferSDP값을 sendsdp 로 설정
                peerConfig.onOfferSDP = sendsdp;
            } else {
                //데이터가 넘어왔으면 offerSDP 값 세팅, onAnswerSDP 값 sendsdp로 할당
                peerConfig.offerSDP = offerSDP;
                peerConfig.onAnswerSDP = sendsdp;
            }
            //세팅된 peerConfig RTCPeerConnection 값 peer에 할당
            peer = RTCPeerConnection(peerConfig);
        }

        // 원격 스트리밍 시작 후
        function afterRemoteStreamStartedFlowing() {
            gotstream = true;
            //onRemoteStream 값 있으면
            if (config.onRemoteStream)
                //해당 데이터에 비디오와 스트림값 추가
                config.onRemoteStream({
                    video: video,
                    stream: _config.stream
                });

            //브로드캐스터 있고, 채널 값 길이가 3이상이면
            if (isbroadcaster && channels.split('--').length > 3) {
                /* broadcasting newly connected participant for video-conferencing! */
                //디폴트 소켓에 소켓 채널 데이터와 유저토큰 데이터 전송함
                defaultSocket.send({
                    newParticipant: socket.channel,
                    userToken: self.userToken
                });
            }
        }
        //원격 스트리밍 시작
        function onRemoteStreamStartsFlowing() {
            if(navigator.userAgent.match(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile/i)) {
                // if mobile device 모바일 기기
                return afterRemoteStreamStartedFlowing();
            }
            // 비디오 readyState 값이 HTMLMediaElement 값보다 크고, 비디오가 멈춰져있고, 비디오 현재 시간이 0보다 크면
            if (!(video.readyState <= HTMLMediaElement.HAVE_CURRENT_DATA || video.paused || video.currentTime <= 0)) {
                afterRemoteStreamStartedFlowing();
            } else setTimeout(onRemoteStreamStartsFlowing, 50);
        }

        function sendsdp(sdp) {
            socket.send({
                userToken: self.userToken,
                sdp: JSON.stringify(sdp)
            });
        }

        //소켓 response 함수
        function socketResponse(response) {
          //response 데이터의 유저 토큰과 현재 들고 있는 유저 토큰 같으면 리턴
            if (response.userToken == self.userToken) return;
            //response에서 sdp 값 있으면 inner의 sdp 속성값을 response의 sdp 속성값을 json 타입으로 파싱후 할당
            if (response.sdp) {
                inner.sdp = JSON.parse(response.sdp);
                selfInvoker();
            }
            //스트림 없고 참가자만 있을때
            if (response.candidate && !gotstream) {
                // 피어가 없다면 에러
                if (!peer) console.error('missed an ice', response.candidate);
                else
                    //피어가 있다면 피어를 아이스 서버에 추가 - 잘 모르겠음
                    peer.addICE({
                        sdpMLineIndex: response.candidate.sdpMLineIndex,
                        candidate: JSON.parse(response.candidate.candidate)
                    });
            }
            // 응답에 left가 참이면
            if (response.left) {
              //피어를 닫고 null 처리
                if (peer && peer.peer) {
                    peer.peer.close();
                    peer.peer = null;
                }
            }
        }

        var invokedOnce = false;
        // invoker 실행
        function selfInvoker() {
            if (invokedOnce) return;

            invokedOnce = true;
            //방장이면 addAnswerSDP
            if (isofferer) peer.addAnswerSDP(inner.sdp);
            //방장이 아니면  initPeer
            else  initPeer(inner.sdp);
        }
    }
    //방 나가기
    function leave() {
        var length = sockets.length;
        for (var i = 0; i < length; i++) {
            var socket = sockets[i];
            if (socket) {
                socket.send({
                    left: true,
                    userToken: self.userToken
                });
                delete sockets[i];
            }
        }

        // if owner leaves; try to remove his room from all other users side
        // 방장이 나가면 방을 지운다
        if (isbroadcaster) {
            defaultSocket.send({
                left: true,
                userToken: self.userToken,
                roomToken: self.roomToken
            });
        }

        if (config.attachStream) {
            if('stop' in config.attachStream) {
                config.attachStream.stop();
            }
            else {
                config.attachStream.getTracks().forEach(function(track) {
                    track.stop();
                });
            }
        }
    }
    //방 나가는 리스너
    window.addEventListener('beforeunload', function () {
        leave();
    }, false);

    //키보드 입력에 반응하는 리스터
    window.addEventListener('keyup', function (e) {
        if (e.keyCode == 116)
            leave();
    }, false);

    //브로드캐스팅 시작하는 함수
    function startBroadcasting() {
      //디폴트 소켓애 토큰 세팅
        defaultSocket && defaultSocket.send({
            roomToken: self.roomToken,
            roomName: self.roomName,
            broadcaster: self.userToken
        });
        setTimeout(startBroadcasting, 3000);
    }

    //새로운 참가자
    function onNewParticipant(channel) {
        //채널 값이 없고 채널 배열의 채널 인덱스 값이 -1이고 채널 값이 유저 토큰 값과 같지 않다면 리턴
        if (!channel || channels.indexOf(channel) != -1 || channel == self.userToken) return;
        // 위경우에 포함되지 않는 경우 채널 값을 추가
        channels += channel + '--';

        //랜덤한 값을 가진 새로운 채널 변수
        var new_channel = uniqueToken();

        //서브 소켓을 연다.
        openSubSocket({
            channel: new_channel
        });
        //디폴트 소켓에 참가자, 토큰 ,채널. new_channel 데이터 전송
        defaultSocket.send({
            participant: true,
            userToken: self.userToken,
            joinUser: channel,
            channel: new_channel
        });
    }

    //고유한 랜덤값을 생성하는 함수
    function uniqueToken() {
        var s4 = function() {
            return Math.floor(Math.random() * 0x10000).toString(16);
        };
        return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
    }
    //디폴트 소켓 오픈
    openDefaultSocket(config.onReady || function() {});
    //리턴
    return {
      //방 생성 기본 값 세팅
        createRoom: function(_config) {
            self.roomName = _config.roomName || 'Anonymous';
            self.roomToken = uniqueToken();

            isbroadcaster = true;
            isGetNewRoom = false;
            startBroadcasting();
        },
        //방 참가 기본값 세팅
        joinRoom: function(_config) {
            self.roomToken = _config.roomToken;
            isGetNewRoom = false;

            self.joinedARoom = true;
            self.broadcasterid = _config.joinUser;

            openSubSocket({
                channel: self.userToken,
                callback: function() {
                    defaultSocket.send({
                        participant: true,
                        userToken: self.userToken,
                        joinUser: _config.joinUser
                    });
                }
            });
        },
        leaveRoom: leave
    };
};
