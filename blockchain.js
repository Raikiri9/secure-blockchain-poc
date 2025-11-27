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
        const raw = this.index + this.timestamp + JSON.stringify(this.data) + this.previousHash + this.addedBy;
        return crypto.createHash('sha256').update(raw).digest('hex');
    }
}

class SecureBlockchain {
    constructor(orgManager) {
        this.orgManager = orgManager;
        this.chain = [this.createGenesisBlock()];
    }

    createGenesisBlock() {
        const defaultKey = "SystemKey2025!";
        const key = (this.orgManager && typeof this.orgManager.getKey === 'function')
            ? (this.orgManager.getKey('System') || defaultKey)
            : defaultKey;
        const encrypted = this.encrypt("System: Blockchain started", key);
        return new Block(0, encrypted, "0", "System");
    }

    encrypt(text, key) {
        const algorithm = 'aes-256-cbc';
        const hashKey = crypto.createHash('sha256').update(String(key)).digest();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, hashKey, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }

    decrypt(encryptedText, key) {
        if (!encryptedText) throw new Error('No ciphertext provided');
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

    addBlock(data, orgId) {
        if (!this.orgManager || typeof this.orgManager.isValidator !== 'function' || typeof this.orgManager.getKey !== 'function') {
            throw new Error('Org manager not configured correctly');
        }
        if (!this.orgManager.isValidator(orgId)) {
            throw new Error(`${orgId} not authorized`);
        }
        const key = this.orgManager.getKey(orgId);
        const encrypted = this.encrypt(data, key);
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

    tryDecrypt(blockIndex, orgId) {
        if (typeof blockIndex !== 'number' || blockIndex < 0 || blockIndex >= this.chain.length) {
            return "[Invalid Block]";
        }
        const block = this.chain[blockIndex];
        if (!block || !block.data) return "[No Data]";
        if (!this.orgManager || typeof this.orgManager.getKey !== 'function') return "[Unknown Org]";
        const key = this.orgManager.getKey(orgId);
        if (!key) return "[Unknown Org]";
        try {
            return this.decrypt(block.data, key);
        } catch (e) {
            return "[Access Denied]";
        }
    }
}

// Export the class as the module root so `const SecureBlockchain = require('./blockchain')` works,
// and attach named properties so destructuring `const { SecureBlockchain, Block } = require('./blockchain')` also works.
module.exports = SecureBlockchain;
module.exports.SecureBlockchain = SecureBlockchain;
module.exports.Block = Block;
module.exports.default = SecureBlockchain;