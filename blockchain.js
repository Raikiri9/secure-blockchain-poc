// Import built-in Node.js crypto module for encryption & hashing
const crypto = require('crypto');

// ===== 1. CREATE A BLOCK =====
class Block {
    constructor(index, encryptedData, previousHash, addedBy) {
        this.index = index;
        this.timestamp = new Date().toISOString();
        this.data = encryptedData;        // Always store encrypted data
        this.previousHash = previousHash;
        this.addedBy = addedBy;
        this.hash = this.calculateHash(); // Unique fingerprint of this block
    }

    calculateHash() {
        // Combine all block info into one string and hash it
        const blockInfo = this.index + this.timestamp + this.data + this.previousHash + this.addedBy;
        return crypto.createHash('sha256').update(blockInfo).digest('hex');
    }
}

// ===== 2. CREATE THE BLOCKCHAIN =====
class Blockchain {
    constructor() {
        // Only these organizations are allowed to add blocks (Proof-of-Authority)
        this.allowedOrgs = new Set(['Hospital', 'Lab', 'Insurance']);
        this.chain = [this.createGenesisBlock()]; // Start with first block
    }

    createGenesisBlock() {
        // The very first block (index 0)
        const encryptedGenesis = this.encrypt("System: Blockchain initialized for secure sharing");
        return new Block(0, encryptedGenesis, "0", "System");
    }

    // Simple AES encryption (for demo only – real systems use stronger key management)
    encrypt(text) {
        const algorithm = 'aes-256-cbc';
        const key = crypto.createHash('sha256').update("MySecretKey123!").digest(); // 32 bytes
        const iv = crypto.randomBytes(16); // Initialization vector

        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // We store IV + encrypted data together (IV is not secret)
        return iv.toString('hex') + ':' + encrypted;
    }

    decrypt(encryptedText) {
        const algorithm = 'aes-256-cbc';
        const key = crypto.createHash('sha256').update("MySecretKey123!").digest();

        const parts = encryptedText.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];

        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    // Add a new block if org is trusted
    addBlock(data, orgName) {
        if (!this.allowedOrgs.has(orgName)) {
            console.log(`❌ ${orgName} is NOT authorized to add data!`);
            return false;
        }

        console.log(`✅ ${orgName} is authorized. Adding data...`);
        const encryptedData = this.encrypt(data);
        const lastBlock = this.chain[this.chain.length - 1];
        const newBlock = new Block(lastBlock.index + 1, encryptedData, lastBlock.hash, orgName);
        this.chain.push(newBlock);
        return true;
    }

    // Check if the chain is valid (not tampered)
    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const current = this.chain[i];
            const previous = this.chain[i - 1];

            // 1. Check if block’s own hash matches its content
            if (current.hash !== current.calculateHash()) {
                return false;
            }
            // 2. Check if it correctly links to previous block
            if (current.previousHash !== previous.hash) {
                return false;
            }
        }
        return true;
    }

    // Display all blocks with decrypted data (for demo)
    printChain() {
        console.log("\n🔗 BLOCKCHAIN CONTENTS (Decrypted for Viewing):");
        console.log("================================================");
        this.chain.forEach(block => {
            let decryptedData = "Genesis Data";
            if (block.index > 0) {
                try {
                    decryptedData = this.decrypt(block.data);
                } catch (e) {
                    decryptedData = "[Decryption Failed]";
                }
            }
            console.log(`Block ${block.index} | By: ${block.addedBy}`);
            console.log(`  Data: ${decryptedData}`);
            console.log(`  Hash: ${block.hash.substring(0, 12)}...`);
            console.log(`  Previous: ${block.previousHash.substring(0, 12)}...`);
            console.log("------------------------------------------------");
        });
    }
}

// ===== 3. RUN THE DEMO =====
console.log("🏥 Secure Data Sharing Blockchain Prototype");
console.log("==========================================");

const myChain = new Blockchain();

// Simulate organizations adding data
myChain.addBlock("Patient #101: Diagnosed with Type 2 Diabetes", "Hospital");
myChain.addBlock("Lab Report #101: HbA1c = 7.1%", "Lab");
myChain.addBlock("Claim #101: Approved for medication coverage", "Insurance");

// Try an unauthorized org
myChain.addBlock("Fake data", "Hacker");

// Show the blockchain
myChain.printChain();

// Validate integrity
console.log(`\n✅ Is blockchain valid? ${myChain.isChainValid()}`);

console.log("\n💡 This is a learning prototype. Real systems use secure key exchange and networking.");