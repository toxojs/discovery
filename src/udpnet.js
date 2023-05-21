const dgram = require('dgram');
const { v4 } = require('uuid');

const BROADCAST_ADDRESS = '255.255.255.255';
const DEFAULT_ADDRESS = '0.0.0.0';
const DEFAULT_PORT = 2905;

class UdpNet {
  constructor(options = {}) {
    this.id = v4();
    this.address = options.address || DEFAULT_ADDRESS;
    this.port = options.port || DEFAULT_PORT;
    this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    this.socket.on('message', (data, rinfo) => {
      const obj = JSON.parse(data);
      if (obj.sender !== this.id && this.onReceive) {
        this.onReceive(obj, rinfo);
      }
    });
  }

  start() {
    this.socket.bind(
      {
        port: this.port,
        address: this.address,
        exclusive: false,
      },
      () => this.socket.setBroadcast(true)
    );
  }

  stop() {
    this.socket.close();
  }

  send(event, data) {
    const obj = {
      sender: this.id,
      event,
      data,
    };
    const msg = Buffer.from(JSON.stringify(obj));
    this.socket.send(msg, this.port, BROADCAST_ADDRESS);
  }
}

module.exports = { UdpNet };
