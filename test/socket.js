const SocketIO = require('socket.io');
const redis = require('socket.io-redis');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const cookie = require('cookie-signature');
const User = require('./schemas/user');

// 예를 들어 현재 socket.id 즉 현재클러스터에 요청을 보내야하는데 binding을 안하면
// 다른 socket.id로 요청이 들어갈 수 있다. 그것을 방지하기 위해
// binding 해준다.
// SocketIO는 서버 인스턴스 간의 연결을 추적하기 위해 신속한 키 값 저장소 redis를 사용해야한다.

const bindListeners = (io) => {
  io.on('connection', (socket) => {
    console.log(`${socket.id} connected`)
  })
}


module.exports = (server, app, sessionMiddleware) => {
  const io = SocketIO(server, {
  });
  app.set('io', io);
  const room = io.of('/room');
  const chat = io.of('/chat');
  const rtc = io.of('/rtc');
  io.adapter(redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
  }));
  bindListeners(io);
  io.use((socket, next) => {
    cookieParser(process.env.COOKIE_SECRET)(socket.request, socket.request.res || {}, next);
  })
  io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res || {}, next);
  });

  var channels ={};



  room.on('connection', async (socket) => {
    console.log('room 네임스페이스에 접속');
    
    const req = socket.request;
    const user = await User.findOne({
      user: req.session.color
    });

    onNewNamespace('channel', user.id);
    
    socket.on('disconnect', () => {
      console.log('room 네임스페이스 접속 해제');
    });
  });



  chat.on('connection', async (socket) => {


    const req = socket.request;

    const user = await User.findOne({
      user: req.session.color
    });
    const roomId = user.room;
    socket.join(roomId);
    socket.to(roomId).emit('join', {
      user: 'system',
      chat: `${user.id}님이 입장하셨습니다.`,
    });

    socket.on('disconnect', async () => {
      console.log('접속 해제');
      socket.leave(roomId);
      const currentRoom = socket.adapter.rooms[roomId];
      const userCount = currentRoom ? currentRoom.length : 0;
      await User.update({
        user: req.session.color
      }, {
        $unset: {
          room: 1
        }
      });
      if (userCount === 0) {
        axios.delete(`https://localhost:443/room/${roomId}`)
          .then(() => {
            console.log('방 제거 성공');
          })
          .catch((error) => {
            console.error(error);
          });
      } else {
        socket.to(roomId).emit('exit', {
          user: 'system',
          chat: `${user.id}님이 퇴장하셨습니다.`,
        });

      }
    });
  });


function onNewNamespace(channel, sender) {
 
  io.of('/'+channel).on('connection', function (socket) {
      
      var username;
      if (io.isConnected) {
          io.isConnected = false;
          socket.emit('connect', true);
      }

      socket.on('message', function (data) {
        

          if (data.sender==sender) {
              if(!username) username = data.data.sender;
              setTimeout(() => {
              socket.broadcast.emit('message', data.data);
          },500);
        }
      });
      
      socket.on('disconnect', function() {
          console.log('접속헤제');
          if(username) {
              socket.broadcast.emit('user-left', username);
              username = null;
          }
      });
  });
   
}

};
