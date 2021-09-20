const chat = document.querySelector('.chat');
const chatForm = document.getElementById('chat-form');
const usersList = document.querySelector('.users');

const room = window.location.pathname.substring(1);
const username = sessionStorage.getItem('username');

if (!username) {
  window.history.pushState('/');
}

const socket = io();

socket.emit('joinRoom', {
  username,
  room,
});

socket.on('message', (msg) => {
  outputMessage(msg);

  chat.scrollTop = chat.scrollHeight;
});

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const msg = e.target.elements.msg.value;
  socket.emit('chatMessage', msg);

  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
});

function outputMessage(msg) {
  const div = document.createElement('div');
  div.classList.add('message');
  div.innerHTML = `
    <span class="author">${msg.username}</span>
    <span class="date">${msg.time}</span>
    <p class="text">${msg.text}</p>
  `;
  document.querySelector('.chat').appendChild(div);
}

function outputUsers(users) {
  usersList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    li.classList.add('user');
    userList.appendChild(li);
  });
}
