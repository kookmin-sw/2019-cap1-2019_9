const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const ColorHash = require('color-hash');
const helmet = require('helmet');
const hpp = require('hpp');
require('dotenv').config();
const fs = require('fs');
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
const http = require('http');

const webSocket = require('./socket');
const indexRouter = require('./routes');
const connect = require('./schemas');


const app = express();
connect();

// const options = {  
//   key: fs.readFileSync('key.pem'),
//   cert: fs.readFileSync('cert.pem')
// };


const sessionMiddleware = {
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: false,
  },
};

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('port', process.env.PORT || 8005);

if(process.env.NODE_ENV === 'production'){
  app.use(morgan('combined'));
  // app.use(helmet());
  // app.use(hpp());
} else{
  app.use(morgan('dev'));
}
app.use(express.static(path.join(__dirname, 'public')));
app.use('/gif', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
if(process.env.NODE_ENV === 'production'){
  sessionMiddleware.proxy = true;
  sessionMiddleware.cookie.secure = true;
}
app.use(session(sessionMiddleware));


app.use(flash());

app.use((req, res, next) => {
  if (!req.session.color) {
    const colorHash = new ColorHash();
    req.session.color = colorHash.hex(req.sessionID);
  }
  next();
});

app.use('/', indexRouter);

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});





const server = http.createServer(app).listen(app.get('port'), () => {
  console.log(app.get('port'), '번 포트에서 대기중');
});

webSocket(server, app, session(sessionMiddleware));
