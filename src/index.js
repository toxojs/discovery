const discovery = require('./discovery');
const udpnet = require('./udpnet');

module.exports = {
  ...discovery,
  ...udpnet,
};
