// model.js
class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    const msg = this.index + this.previousHash + this.timestamp + JSON.stringify(this.data);
    let h = 0;
    for (let i = 0; i < msg.length; i++) {
      h = ((h << 5) - h) + msg.charCodeAt(i);
      h |= 0;
    }
    return (h >>> 0).toString(16);
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
  }

  createGenesisBlock() {
    return new Block(0, new Date().toISOString(), 'Genesis Block', '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.hash = newBlock.calculateHash();
    this.chain.push(newBlock);
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const cur = this.chain[i];
      const prev = this.chain[i - 1];
      if (cur.hash !== cur.calculateHash()) return false;
      if (cur.previousHash !== prev.hash) return false;
    }
    return true;
  }
}

const myChain = new Blockchain();

module.exports = { Block, Blockchain, myChain };
