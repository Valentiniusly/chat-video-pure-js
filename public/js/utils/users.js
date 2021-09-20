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
