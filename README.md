# discovery

Example of usage

```javascript
const { Discovery } = require('./src');

const discovery = new Discovery();

discovery.onPromote = (node) => {
  if (node.isOwnNode) {
    console.log(`This node is now the primary`);
  } else {
    console.log(`A new node has been promoted to primary: ${node.id}`);
  }
};

discovery.onDemote = (node) => {
  if (node.isOwnNode) {
    console.log(`This node is not longer the primary`);
  } else {
    console.log(`A node is no longer the primary: ${node.id}`);
  }
};

discovery.onAddNode = (node) => {
  console.log(`Welcome to a new node ${node.id}`);
};

discovery.onRemoveNode = (node) => {
  console.log(`A node has been disconnected ${node.id}`);
};

discovery.start();
```