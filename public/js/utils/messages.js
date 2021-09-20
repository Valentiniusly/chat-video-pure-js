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
