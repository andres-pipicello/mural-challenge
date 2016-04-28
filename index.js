var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var logger = require('morgan');

app.use(logger('dev'));
app.use(express.static(__dirname))

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

var globalPosition = 0.4567

var clients = new Set();

function clamp(x, lo, hi) {
  return Math.min(Math.max(x, lo), hi);
}

function updateClientState(socket){
  socket.emit('state-update', { seq: socket.seq, state: globalPosition})
}

io.on('connection', function(socket){
  socket.seq = 0;
  updateClientState(socket);
  clients.add(socket);
  socket.on('delta-update', function(msg){
    socket.seq = msg.seq;
    globalPosition = clamp(globalPosition + msg.diff, 0, 1);
    clients.forEach(updateClientState);
  });
  socket.on('disconnect', () => {
    clients.delete(socket);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});