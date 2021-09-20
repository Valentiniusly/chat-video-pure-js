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
