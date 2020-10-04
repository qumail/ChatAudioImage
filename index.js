// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
//var io = require('../..')(server);
//var io = require('server');
//var app = require('http').createServer(handler)
//var io = require('socket.io')(app);
var io = require('socket.io')(server)
var port = process.env.PORT || 3080;

server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom

var numUsers = 0;
var user_list = {}

io.on('connection', (socket) => {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', (data) => {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  socket.on('new audio', (data)=>{
    socket.emit('new audio', {
      username: socket.username,
      audioURL:data,
    });
    socket.broadcast.emit('new audio', {
        username: socket.username,
        audioURL:data,
    });
  });
   // image sharing
   socket.on('user image', function (data) {
    console.log(data);
    socket.broadcast.emit('user image', socket.nickname, data);
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', (username) => {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    console.log("USER_LIST1", user_list)
    user_list[username] = username
    console.log("USER_LIST2", user_list)
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers,
        userList:user_list,
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers,
        userList:user_list,
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    if (addedUser) {
      --numUsers;
      var delete_name = socket.username
      delete user_list[delete_name]


      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers,
          userList:user_list,

      });
    }
  });
});