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
                    <input type="text" id="msg" class="form-control" placeholder="Type message" required
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
