var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const multer = require('multer');
var index = require('./routes/index');
var splitwiseAuth = require('./routes/splitwiseAuth');
const mkdirp = require('mkdirp');
const processReciept = require('./processReceipt');

var app = express();

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    //var code = JSON.parse(req.body.model).empCode;
    var dest = 'public/uploads/';
    mkdirp(dest, function (err) {
      if (err) cb(err, dest);
      else cb(null, dest);
    });
  },
  filename: function (req, file, cb) {
    cb(null, Date.now()+'-'+file.originalname);
  }
});

var upload = multer({ storage: storage });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.post('/upload', upload.any(), function(req , res){
  let filePath = __dirname + '/' + req.files[0].path;
  mkdirp('/tmp/splitImage');
  var spawn = require("child_process").spawn;
  var process = spawn('python',["python/splitImage.py", filePath]);
  process.stdout.on('data', function (data){
    console.log(data.toString());
  });
  process.stderr.on('data', function (data){
    console.error(data.toString());
  });
  process.on('exit', function() {
    processReciept(filePath,res);
  });
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/',function(req,res){
  res.sendFile(path.join(__dirname+'/public/html/index.html'));
});
app.get('/splitwiseAuth', splitwiseAuth);
app.get('/next',function(req,res){
  res.sendFile(path.join(__dirname+'/public/html/next.html'));
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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
