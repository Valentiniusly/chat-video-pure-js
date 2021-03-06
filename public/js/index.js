const Welcome = require('./views/Welcome');
const Chat = require('./views/Chat');
const { outputMessage } = require('./utils/messages');
const { outputUsers } = require('./utils/users');
const { peerConnection, videoBtnHandler } = require('./utils/peerConnection');

const socket = io();
let myPeer;

const navigateTo = (url) => {
  history.pushState(null, null, url);
  router();
};

const router = async () => {
  const routes = [
    { path: '/', view: Welcome },
    { path: '/chat', view: Chat },
  ];

  const potentialMatches = routes.map((route) => {
    return {
      route: route,
      isMatch: location.pathname === route.path,
    };
  });

  let match = potentialMatches.find((potentialMatch) => potentialMatch.isMatch);

  if (!match) {
    match = {
      route: routes[0],
      isMatch: true,
    };
    navigateTo('/');
  }

  const view = new match.route.view();

  document.querySelector('#app').innerHTML = await view.getHtml();

  if (location.pathname === '/') {
    const form = document.getElementById('name-form');
    const nameInput = document.getElementById('username');
    const sessionRoom = sessionStorage.getItem('room');
    const sessionName = sessionStorage.getItem('username');

    // if user came from chat
    myPeer && myPeer.destroy();
    const video = document.querySelector('video');
    if (video) {
      socket.emit('stopStream', { id: socket.id, room: sessionRoom });
      const stream = video.srcObject;
      const tracks = stream.getTracks();

      tracks.forEach((track) => {
        track.stop();
      });

      video.srcObject = null;
      video.remove();
    }
    if (sessionName) {
      socket.emit('leaveRoom');
      nameInput.value = sessionName;
    }

    function submitHandler(e) {
      e.preventDefault();

      const username = e.target.elements.username.value;
      sessionStorage.setItem('username', username);

      form.removeEventListener('submit', submitHandler);

      // cool repeating code
      if (!socket.connected) {
        socket.on('connect', () => {
          const room = sessionRoom || socket.id;
          navigateTo(`/chat?room=${room}`);
        });
      } else {
        const room = sessionRoom || socket.id;
        navigateTo(`/chat?room=${room}`);
      }
    }

    form.addEventListener('submit', submitHandler);
  }

  if (location.pathname === '/chat') {
    const params = new URLSearchParams(document.location.search.substring(1));
    const room = params.get('room');
    sessionStorage.setItem('room', room);

    const username = sessionStorage.getItem('username');
    if (!username) {
      // user for the first time in the App
      navigateTo('/');
    } else {
      const chat = document.querySelector('.chat');
      const chatForm = document.getElementById('chat-form');
      const usersList = document.querySelector('.users');
      const modal = document.querySelector('.modal-body');
      const videoBtn = document.getElementById('video-button');

      // another cool repeating
      if (!socket.connected) {
        socket.on('connect', () => {
          initializePage(socket, myPeer, room);
        });
      } else {
        initializePage(socket, myPeer, room);
      }

      socket.emit('joinRoom', {
        username,
        room,
      });

      // load messages in server runtime database
      socket.on('oldMessages', (messages) => {
        messages.forEach((msg) => {
          outputMessage(msg, chat);
        });
      });

      // update users online
      socket.on('roomUsers', ({ room, users }) => {
        outputUsers(users, usersList);
        modal.innerHTML = document.querySelector('.users-container').innerHTML;
      });

      // receive chat message
      socket.on('message', (msg) => {
        outputMessage(msg, chat);
        chat.scrollTop = chat.scrollHeight;
      });

      // stop stream if consumer
      socket.on('stopStream', (id) => {
        if (id !== socket.id) {
          const video = document.querySelector('video');
          video && video.remove();
          document.getElementById('video-button').disabled = false;
        }
      });

      chatForm.addEventListener('submit', messageHandler);

      function messageHandler(e) {
        e.preventDefault();

        const msg = e.target.elements.msg.value;
        socket.emit('chatMessage', msg);

        e.target.elements.msg.value = '';
        e.target.elements.msg.focus();
      }

      function initializePage(socket, myPeer, room) {
        socket.emit('stopStream', socket.id);
        myPeer = peerConnection(socket);
        videoBtn.addEventListener('click', () =>
          videoBtnHandler(myPeer, socket, room)
        );
      }
    }
  }
};
window.addEventListener('popstate', router);

document.addEventListener('DOMContentLoaded', () => {
  router();
});
