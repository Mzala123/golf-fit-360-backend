require("dotenv").config()

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require("cors")

require("./model/db")
const {createTableUser, createTableCustomer, createTableAdmin} =  require('./model/user')

var routesApi = require('./routes/index');
var usersRouter = require('./routes/users');
const passport = require("passport")

require("./config/passport")

var app = express();
app.use(cors())

createTableUser().catch((err)=>{
  console.log("Error initializing database "+err)
})

createTableCustomer().catch((err)=>{
  console.log("Error initializing database "+err)
})

createTableAdmin().catch((err)=>{
  console.log("Error n")
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize())

app.use('/api', routesApi);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
