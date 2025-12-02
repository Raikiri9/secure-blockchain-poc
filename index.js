const express = require('express');
const path = require('path');

const _blockchain = require('./blockchain');
const SecureBlockchain = _blockchain && (_blockchain.SecureBlockchain || _blockchain.default || _blockchain);

if (typeof SecureBlockchain !== 'function') {
    console.error('SecureBlockchain is not a constructor. Check ./blockchain.js exports.');
    process.exit(1);
}

// Simple org manager used by the blockchain
const orgKeys = {
    System: 'SystemKey2025!',
    Hospital: 'HospitalKey2025!',
    Lab: 'LabKey2025!',
    Insurance: 'InsuranceKey2025!'
};
const orgManager = {
    isValidator(orgId) {
        return Object.prototype.hasOwnProperty.call(orgKeys, orgId);
    },
    getKey(orgId) {
        return orgKeys[orgId];
    }
};

const blockchain = new SecureBlockchain(orgManager);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Return chain and validity
app.get('/api/chain', (req, res) => {
    res.json({
        chain: blockchain.chain,
        valid: blockchain.isChainValid()
    });
});

// Add a new block
app.post('/api/add', (req, res) => {
    const { org, data } = req.body;
    if (!org || !data) return res.json({ success: false, error: 'Missing org or data' });

    try {
        const block = blockchain.addBlock(data, org);
        return res.json({ success: true, block });
    } catch (err) {
        return res.json({ success: false, error: err.message || String(err) });
    }
});

// Tamper with second block (if exists) to simulate tampering
app.post('/api/tamper', (req, res) => {
    if (blockchain.chain.length < 2) return res.json({ success: false, error: 'No block to tamper' });
    // change stored encrypted data without updating its hash to simulate tampering
    blockchain.chain[1].data = 'tampered-data';
    return res.json({ success: true });
});

// Fallback to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});