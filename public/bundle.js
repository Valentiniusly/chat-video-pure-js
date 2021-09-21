(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{"./utils/messages":2,"./utils/peerConnection":3,"./utils/users":4,"./views/Chat":6,"./views/Welcome":7}],2:[function(require,module,exports){
function outputMessage(msg, node) {
  const div = document.createElement('div');
  switch (msg.type) {
    case 'system':
      div.classList.add('system-message');
      div.innerText = msg.text;
      break;

    case 'msg':
      div.classList.add('message');
      div.innerHTML = `
          <span class="author">${msg.username}</span>
          <span class="date">${msg.time}</span>
          <p class="text">${msg.text}</p>
      `;
      break;
  }

  node.appendChild(div);
}

module.exports = {
  outputMessage,
};

},{}],3:[function(require,module,exports){
async function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener('click', () => video.play());
  document.body.append(video);
}

exports.peerConnection = function (socket) {
  const myPeer = new Peer(socket.id);

  // get stream
  myPeer.on('call', (call) => {
    call.answer();
    document.getElementById('video-button').disabled = true;

    const video = document.createElement('video');
    call.on('stream', (stream) => {
      addVideoStream(video, stream);
    });
  });

  return myPeer;
};

exports.videoBtnHandler = function (myPeer, socket, room) {
  // start stream
  const myVideo = document.createElement('video');
  myVideo.muted = true;

  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: true,
    })
    .then((stream) => {
      addVideoStream(myVideo, stream);
      myVideo.play();
      document.getElementById('video-button').disabled = true;

      socket.emit('startStream', { id: socket.id, room });
      socket.on('usersForStream', (users) => {
        users.forEach((user) => {
          myPeer.call(user.id, stream);
        });
      });
    });
};

},{}],4:[function(require,module,exports){
function outputUsers(users, node) {
  node.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    li.classList.add('user');
    li.innerText = user.username;
    node.appendChild(li);
  });
}

module.exports = {
  outputUsers,
};

},{}],5:[function(require,module,exports){
module.exports = class {
  constructor() {}

  setTitle(title) {
    document.title = title;
  }

  async getHtml() {
    return '';
  }
};

},{}],6:[function(require,module,exports){
const AbstractView = require('./AbstractView');

module.exports = class Chat extends AbstractView {
  constructor() {
    super();
    this.setTitle('Chat App');
  }

  async getHtml() {
    return `
      <div class="container">
        <div class="row justify-content-sm-center">
          <div class="col col-lg-10 window window-chat">
            <div class="chat-container">
              <header class="chat-header">
                <h1>Chat App</h1>
                <button id="video-button" class="btn btn-dark">Video</button>
                <svg viewBox="0 0 100 80" height="20" class="d-md-none" data-bs-toggle="modal" data-bs-target="#usersModal">
                  <rect width="100" height="20"></rect>
                  <rect y="30" width="100" height="20"></rect>
                  <rect y="60" width="100" height="20"></rect>
                </svg>
              </header>
              <main class="content">
                <aside class="users-container d-none d-md-block ">
                  <h3>Users</h3>
                  <ul class="users"></ul>
                </aside>
                <div class="chat"></div>
              </main>
              <div class="message-input">
                <form id="chat-form">
                  <div class="input-group mb-3">
                    <input type="text" id="msg" class="form-control" autocomplete="off" placeholder="Type message" required
                      aria-label="Recipient's username" aria-describedby="button-addon2">
                    <button class="btn btn-dark" type="submit" id="button-addon2">Send</button>
                  </div>
                </form>
              </div>
            </div>
            
          </div>
        </div>
      </div>
      <div class="modal fade" tabindex="-1" id="usersModal">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-body">
            </div>
          </div>
        </div>
      </div>
    `;
  }
};

},{"./AbstractView":5}],7:[function(require,module,exports){
const AbstractView = require('./AbstractView');

module.exports = class Welcome extends AbstractView {
  constructor() {
    super();
    this.setTitle('Welcome to chat');
  }

  async getHtml() {
    return `
      <div class="container">
        <div class="row justify-content-sm-center">
          <div class="col col-sm-8 col-md-6 col-lg-4 window">
            <h1>Chat app</h1>
            <form id="name-form">
              <div class="mb-3">
                <label for="username" class="form-label">Please enter your name</label>
                <input type="text" class="form-control" id="username" name="username" required placeholder="Gorgeous" autocomplete="off">
              </div>
              <button type="submit" class="btn btn-dark">Submit</button>
            </form>
          </div>
        </div>
      </div>
    `;
  }
};

},{"./AbstractView":5}]},{},[1]);
