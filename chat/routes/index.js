const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Room = require('../schemas/room');
const Chat = require('../schemas/chat');
const User = require('../schemas/user');
const {Translate} = require('@google-cloud/translate');
// Creates a client


var mylang='';

const router = express.Router();

// 초기 로그인 화면
router.get('/', async (req, res, next) => {
  try {
    res.render('login', {title: '로그인', error: req.flash('loginError')});
  } catch (error) {
    console.error(error);
    next(error);
  }
})

// 로그인 페이지에서 작성한 로그인 정보 전송
router.post('/main', async (req, res, next) => {
  try {
    if(req.body.userid=='') {
      req.flash('loginError', '아이디를 입력해주세요.');
      return res.redirect('/');
    }
      // io.of('/room').emit('newRoom', newRoom);
      // 기존에 같은 피씨로 등록된 id 전부 삭제
      await User.deleteMany({user: req.session.color});
      
      const user = new User({
        user: req.session.color,
        id: req.body.userid,
        lang: req.body.lang,
      });
      // 아이디 등록
      user.save();
      // 사용자 언어 설정
      mylang = req.body.lang;
      res.redirect(`/main`);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 메인 페이지 접속
router.get('/main', async (req, res, next) => {
  try {
    const rooms = await Room.find({});
    res.render('main', { rooms, title: 'GIF 채팅방', error: req.flash('roomError') });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 방 생성 페이지 접속
router.get('/room', (req, res) => {
  res.render('room', { title: 'GIF 채팅방 생성' });
});

// 방 생성 시
router.post('/room', async (req, res, next) => {
  try {
    const room = new Room({
      title: req.body.title,
      max: req.body.max,
      owner: req.session.color,
      password: req.body.password,
    });
    const newRoom = await room.save();
    const io = req.app.get('io');
    io.of('/room').emit('newRoom', newRoom);
    res.redirect(`/room/${newRoom._id}?password=${req.body.password}`);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 방 입장 시
router.get('/room/:id', async (req, res, next) => {
  try {
    const room = await Room.findOne({ _id: req.params.id });
    const io = req.app.get('io');
    if (!room) {
      req.flash('roomError', '존재하지 않는 방입니다.');
      return res.redirect('/');
    }
    if (room.password && room.password !== req.query.password) {
      req.flash('roomError', '비밀번호가 틀렸습니다.');
      return res.redirect('/');
    }
    const { rooms } = io.of('/chat').adapter;
    if (rooms && rooms[req.params.id] && room.max <= rooms[req.params.id].length) {
      req.flash('roomError', '허용 인원이 초과하였습니다.');
      return res.redirect('/');
    }
    const chats = await Chat.find({ room: room._id }).sort('createdAt');

    return res.render('chat', {
      lang: mylang,
      room,
      title: room.title,
      chats,
      user: req.session.color,
    });
    
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.delete('/room/:id', async (req, res, next) => {
  try {
    await Room.remove({ _id: req.params.id });
    await Chat.remove({ room: req.params.id });
    res.send('ok');
    setTimeout(() => {
      req.app.get('io').of('/room').emit('removeRoom', req.params.id);
    }, 2000);
  } catch (error) {
    console.error(error);
    next(error);
  }
});



let translations = async function processtrans(array, text) {

  // Creates a client
  const translate = new Translate();

  let str = '';
  for (const target of array) {
    str += '('+target+')'+'        ';
    let [translations] = await translate.translate(text, target);
    translations = Array.isArray(translations) ? translations : [translations];
    str += translations + '        ';
  }
  return str;
}


router.post('/room/:id/chat', async (req, res, next) => {

  user = await User.findOne({user: req.session.color});
  console.log(user.id);
  const targets = ['ko', 'ja', 'en'];
  let chats = req.body.chat +'     ';
  translations(targets, req.body.chat).then(function (result) {
    try {
      chats+=result;
      const chat = new Chat({
        room: req.params.id,
        user: req.session.color,
        id: user.id,
        lang: user.lang,
        chat: chats,
      });
      chat.save();
      req.app.get('io').of('/chat').to(req.params.id).emit('chat', chat);
      res.send('ok');
    } catch (error) {
      console.error(error);
      next(error);
    }

  });


});


fs.readdir('uploads', (error) => {
  if (error) {
    console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
    fs.mkdirSync('uploads');
  }
});
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/');
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});
router.post('/room/:id/gif', upload.single('gif'), async (req, res, next) => {
  try {
    const chat = new Chat({
      room: req.params.id,
      user: req.session.color,
      gif: req.file.filename,
    });
    await chat.save();
    req.app.get('io').of('/chat').to(req.params.id).emit('chat', chat);
    res.send('ok');
  } catch (error) {
    console.error(error);
    next(error);
  }
});



module.exports = router;
