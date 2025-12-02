const crypto = require('crypto');

class Block {
    constructor(index, encryptedData, previousHash, addedBy) {
        this.index = index;
        this.timestamp = new Date().toISOString();
        this.data = encryptedData;
        this.previousHash = previousHash;
        this.addedBy = addedBy;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        const raw = `${this.index}|${this.timestamp}|${this.data}|${this.previousHash}|${this.addedBy}`;
        return crypto.createHash('sha256').update(raw).digest('hex');
    }
}

class SecureBlockchain {
    constructor(orgManager) {
        this.orgManager = orgManager || null;
        this.chain = [this.createGenesisBlock()];
    }

    createGenesisBlock() {
        const defaultKey = (this.orgManager && typeof this.orgManager.getKey === 'function')
            ? (this.orgManager.getKey('shared') || this.orgManager.getKey('System') || 'SystemKey2025!')
            : 'SystemKey2025!';
        const encrypted = this.encrypt(JSON.stringify({ type: 'GENESIS', content: 'Genesis' }), defaultKey);
        return new Block(0, encrypted, '0', 'System');
    }

    encrypt(text, key) {
        if (!key) throw new Error('No encryption key provided');
        const algorithm = 'aes-256-cbc';
        const hashKey = crypto.createHash('sha256').update(String(key)).digest(); // 32 bytes
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, hashKey, iv);
        let encrypted = cipher.update(String(text), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }

    decrypt(encryptedText, key) {
        if (!encryptedText) throw new Error('No ciphertext provided');
        if (!key) throw new Error('No decryption key provided');
        const algorithm = 'aes-256-cbc';
        const hashKey = crypto.createHash('sha256').update(String(key)).digest();
        const parts = String(encryptedText).split(':');
        if (parts.length < 2) throw new Error('Invalid ciphertext format');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const decipher = crypto.createDecipheriv(algorithm, hashKey, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    addBlock(messageObj, orgId) {
        if (!this.orgManager || typeof this.orgManager.isValidator !== 'function' || typeof this.orgManager.getKey !== 'function') {
            throw new Error('Org manager not configured correctly');
        }
        if (!this.orgManager.isValidator(orgId)) {
            throw new Error(`${orgId} not authorized`);
        }
        // Use shared key if present so both sender & recipient can be decrypted server-side
        const key = this.orgManager.getKey('shared') || this.orgManager.getKey(orgId);
        if (!key) throw new Error('No encryption key available');
        const payload = JSON.stringify(messageObj);
        const encrypted = this.encrypt(payload, key);
        const last = this.chain[this.chain.length - 1];
        const block = new Block(last.index + 1, encrypted, last.hash, orgId);
        this.chain.push(block);
        return block;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const curr = this.chain[i];
            const prev = this.chain[i - 1];
            if (curr.hash !== curr.calculateHash()) return false;
            if (curr.previousHash !== prev.hash) return false;
        }
        return true;
    }

    // decrypt using shared (or fallback) key and return parsed object or throw
    decryptMessage(blockIndex) {
        if (typeof blockIndex !== 'number' || blockIndex < 0 || blockIndex >= this.chain.length) {
            throw new Error('Invalid block index');
        }
        const block = this.chain[blockIndex];
        if (!block || !block.data) throw new Error('No data');
        const key = (this.orgManager && typeof this.orgManager.getKey === 'function')
            ? (this.orgManager.getKey('shared') || this.orgManager.getKey(block.addedBy))
            : null;
        if (!key) throw new Error('No key for decryption');
        const decrypted = this.decrypt(block.data, key);
        return JSON.parse(decrypted);
    }
}

module.exports = SecureBlockchain;
module.exports.SecureBlockchain = SecureBlockchain;
module.exports.Block = Block;
module.exports.default = SecureBlockchain;
