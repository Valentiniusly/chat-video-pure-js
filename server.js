const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const { formatMessage, getOldMessages } = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  getUsersForStream,
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.resolve(__dirname, 'public')));
app.get('/*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  socket.on('leaveRoom', () => {
    const user = userLeave(socket.id);
    if (user) {
      socket.leave(user.room);
      io.to(user.room).emit(
        'message',
        formatMessage({
          username: user.username,
          room: user.room,
          text: `${user.username} has left the chat`,
          type: 'system',
        })
      );
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });

  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    if (user) {
      socket.join(user.room);

      socket.emit('oldMessages', getOldMessages(user.room));

      io.to(user.room).emit(
        'message',
        formatMessage({
          username: user.username,
          room: user.room,
          text: `${user.username} has joined the chat`,
          type: 'system',
        })
      );

      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });

  socket.on('startStream', ({ id, room }) => {
    const usersForStream = getUsersForStream({ id, room });
    console.log(usersForStream);
    socket.emit('usersForStream', usersForStream);
  });

  socket.on('stopStream', () => {
    socket.broadcast.emit('stopStream');
  });

  socket.on('chatMessage', (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit(
      'message',
      formatMessage({
        username: user.username,
        room: user.room,
        text: msg,
        type: 'msg',
      })
    );
  });

  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage({
          username: user.username,
          room: user.room,
          text: `${user.username} has left the chat`,
          type: 'system',
        })
      );

      io.to(user.room).emit('roomUser', {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Server is running on port ' + PORT);
});
