require("dotenv").config()

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require("cors")

require("./model/db")
const {createTableUser, createTableCustomer, createTableAdmin} =  require('./model/user')
const createTableGolfClubMessage = require("./model/message")
const {createTableFittingRequest, createTableFittingTasks} = require("./model/fitting")

var routesApi = require('./routes/index');
var usersRouter = require('./routes/users');
const passport = require("passport");
const sendJsonResponse = require("./services/response");

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
  console.log("Error initializing")
})

createTableGolfClubMessage().catch((err)=>{
  console.log("Error initializing database "+err)
})

createTableFittingRequest().catch((err)=>{
  console.log("Error initializing database "+err)
})

createTableFittingTasks().catch(err=>{
  console.log("Error ", err)
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

app.use((err, req, res, next)=>{
  if(err.name === 'UnauthorizedError'){
    sendJsonResponse(res, 401, {message: err.name+" "+err.message})
  }
})

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
