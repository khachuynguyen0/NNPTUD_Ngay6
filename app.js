var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
let mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Apply general rate limiting to all API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Quá nhiều yêu cầu, vui lòng thử lại sau" }
});

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Quá nhiều yêu cầu xác thực, vui lòng thử lại sau" }
});

app.use('/', indexRouter);
app.use('/api/v1/auth', authLimiter, authRouter);
app.use('/api/v1/products', apiLimiter, require('./routes/products'));
app.use('/api/v1/categories', apiLimiter, require('./routes/categories'));
app.use('/api/v1/roles', apiLimiter, require('./routes/roles'));
app.use('/api/v1/users', apiLimiter, require('./routes/users'));

mongoose.connect('mongodb://localhost:27017/NNPTUD-C6');
mongoose.connection.on('connected', () => {
  console.log("connected");
});
mongoose.connection.on('disconnected', () => {
  console.log("disconnected");
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
