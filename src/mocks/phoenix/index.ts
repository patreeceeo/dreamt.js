
export class Socket {
  endpoint: string;
  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  endPointURL() {
    return this.endpoint;
  }

  connect = jest.fn()

  channel = jest.fn(() =>{
    return new Channel();
  })
}

class Channel {
  push = jest.fn();
}
