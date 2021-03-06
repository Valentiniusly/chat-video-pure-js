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
