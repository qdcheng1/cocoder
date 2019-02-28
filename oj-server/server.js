const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
var resRouter = require("./routes/rest");
var path = require('path');
var indexRouter = require("./routes/index");

var mongoose = require("mongoose");
var http = require('http');
var socket_io = require('socket.io');
var io = socket_io();
var socketService = require('./services/socketService')(io);

mongoose.connect("mongodb://user:dong0520CC@ds151393.mlab.com:51393/qboj", { useNewUrlParser: true });
app.use(express.static(path.join(__dirname, '../public/')));
app.use("/", indexRouter);
app.use("/api/v1", resRouter);

app.use(function (req, res) {
    res.sendFile("index.html", { root: path.join(__dirname, '../public/')});
});

var server = http.createServer(app);
io.attach(server);
server.listen(3000);

server.on('error', onError);
server.on('listening', onListening);

function onError(error) {
  throw error;
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr == 'string'
    ? 'pipe ' + addr : 'port ' + addr.port;
  console.log('listening on ' + bind);
}
