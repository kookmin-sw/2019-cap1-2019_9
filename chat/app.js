const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const utf8 = require('utf8');

app.set('view engine', 'ejs');
app.set('views', './views');

let room = ['room1', 'room2'];
let a = 0;
let data = '';
const translate_file_path = "C:\\Users\\ChoiChangGyu\\Desktop\\2019-cap1-2019_9\\chat\\mic_test_v2.py"
const spawn = require("child_process").spawn;
const pythonProcess = spawn("python", [translate_file_path]);

str = pythonProcess.stdout.on('data', (data) => {
  data = data.toString();
  console.log(data);
  io.to(room[0]).emit('chat message', 1, data);
});

app.get('/', (req, res) => {
  res.render('chat');
});

io.on('connection', (socket) => {
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });


  socket.on('leaveRoom', (num, name) => {
    socket.leave(room[num], () => {
      console.log(name + ' leave a ' + room[num]);
      io.to(room[num]).emit('leaveRoom', num, name);
    });
  });


  socket.on('joinRoom', (num, name) => {
    socket.join(room[num], () => {
      console.log(name + ' join a ' + room[num]);
      io.to(room[num]).emit('joinRoom', num, name);
    });
  });


  socket.on('chat message', (num, name, msg) => {
    io.to(room[num]).emit('chat message', name, msg);
  });
});

http.listen(3000, () => {
  console.log('Connected at 3000');
});
