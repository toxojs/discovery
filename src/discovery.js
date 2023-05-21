const { UdpNet } = require('./udpnet');

const LOCALHOST_ADDRESS = '127.0.0.1';

class Discovery {
  constructor(settings = {}) {
    this.pingTime = settings.pingTime || 1000;
    this.checkTime = settings.checkTime || 2000;
    this.nodeTimeout = settings.nodeTimeout || 2000;
    if (this.nodeTimeout < this.checkTime) {
      throw new Error('nodeTimeout must be greater than or equal to checkTime');
    }
    if (this.checkTime < this.pingTime) {
      throw new Error('checkTime must be greater than or equal to pingTime');
    }
    this.network = new UdpNet({
      address: settings.address,
      port: settings.port,
    });
    this.network.onReceive = (obj, rinfo) => this.doOnReceive(obj, rinfo);
    this.nodes = {};
    this.nodes[this.id] = {
      id: this.id,
      isPrimary: false,
      createdAt: Date.now(),
      address: LOCALHOST_ADDRESS,
      port: this.network.port,
      isOwnNode: true,
    };
  }

  get id() {
    return this.network.id;
  }

  get isStarted() {
    return this.started;
  }

  start() {
    if (!this.started) {
      this.network.start();
      this.checkInterval = setInterval(() => this.check(), this.checkTime);
      this.pingInterval = setInterval(() => this.sendPing(), this.pingTime);
      this.sendPing();
      this.started = true;
    }
  }

  stop() {
    if (this.started) {
      this.network.stop();
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
      clearInterval(this.pingInterval);
      this.pingInterval = undefined;
      this.started = false;
    }
  }

  sendPing() {
    this.network.send('ping', { createdAt: this.nodes[this.id].createdAt });
  }

  isTimeouted(node) {
    return Date.now() - node.lastUpdated > this.nodeTimeout;
  }

  check() {
    // Remove timeout nodes
    Object.entries(this.nodes).forEach(([id, node]) => {
      if (id !== this.network.id && this.isTimeouted(node)) {
        if (this.onRemoveNode) {
          this.onRemoveNode(node);
        }
        delete this.nodes[id];
      }
    });
    const nodes = Object.values(this.nodes).sort(
      (a, b) => a.createdAt - b.createdAt
    );
    // If best node is not the primary...
    if (!nodes[0].isPrimary) {
      // set the first node to primary
      nodes[0].isPrimary = true;
      if (this.onPromote) {
        this.onPromote(nodes[0]);
      }
      // set all the other nodes to not primary
      for (let i = 1; i < nodes.length; i += 1) {
        const node = nodes[i];
        if (node.isPrimary) {
          if (this.onDemote) {
            this.onDemote(node);
          }
          node.isPrimary = false;
        }
      }
    }
  }

  doOnPing(obj, rinfo) {
    const isNewNode = !this.nodes[obj.sender];
    if (isNewNode) {
      this.nodes[obj.sender] = {
        id: obj.sender,
        isPrimary: false,
        createdAt: obj.data.createdAt,
        address: rinfo.address,
        port: rinfo.port,
      };
      if (this.onAddNode) {
        this.onAddNode(this.nodes[obj.sender]);
      }
    }
    this.nodes[obj.sender].lastUpdated = Date.now();
  }

  doOnReceive(obj, rinfo) {
    if (obj.event === 'ping') {
      this.doOnPing(obj, rinfo);
    } else if (this.onReceive) {
      this.onReceive(obj, rinfo);
    }
  }
}

module.exports = { Discovery };
