// server.js
const express = require('express');
const path = require('path');

// Shared encryption key for all orgs (server uses this to decrypt and enforce access)
const SHARED_KEY = 'SharedHealthcareKey2025!';

let OrgManager;
try {
    OrgManager = require('./orgManager');
} catch (e) {
    OrgManager = class {
        constructor() {
            // All orgs share the same symmetric key for this prototype.
            this.keys = {
                System: SHARED_KEY,
                Hospital: SHARED_KEY,
                Lab: SHARED_KEY,
                Insurance: SHARED_KEY,
                shared: SHARED_KEY
            };
        }
        isValidator(orgId) { return Object.prototype.hasOwnProperty.call(this.keys, orgId); }
        getKey(orgId) { return this.keys[orgId] || this.keys.shared; }
    };
}

const SecureBlockchain = require('./blockchain');

const orgManager = new OrgManager();
const chain = new SecureBlockchain(orgManager);

// preload a realistic conversation if only genesis exists
if (chain.chain.length === 1) {
    const now = () => new Date().toISOString();
    chain.addBlock({ type: 'PATIENT_ADMISSION', from: 'Hospital', to: 'Hospital', patientId: 'P101', content: 'Admitted for pneumonia', timestamp: now() }, 'Hospital');
    chain.addBlock({ type: 'LAB_REQUEST', from: 'Hospital', to: 'Lab', patientId: 'P101', content: 'Run CBC, CRP, Chest X-ray', timestamp: now() }, 'Hospital');
    chain.addBlock({ type: 'LAB_RESULT', from: 'Lab', to: 'Hospital', patientId: 'P101', content: 'WBC=15k, CRP=120, X-ray: infiltrate', timestamp: now() }, 'Lab');
    chain.addBlock({ type: 'CLAIM_SUBMISSION', from: 'Hospital', to: 'Insurance', patientId: 'P101', content: 'Request coverage for 5-day stay', timestamp: now() }, 'Hospital');
    chain.addBlock({ type: 'CLAIM_APPROVAL', from: 'Insurance', to: 'Hospital', patientId: 'P101', content: 'Approved up to $5,000', timestamp: now() }, 'Insurance');
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API: Get chain for a viewing org (viewer query param). Only decrypted messages visible to sender or recipient.
app.get('/api/chain', (req, res) => {
    const viewer = req.query.viewer || 'Public';
    try {
        const result = chain.chain.map((block, i) => {
            if (i === 0) {
                // Genesis
                return { index: block.index, addedBy: block.addedBy, timestamp: block.timestamp, hash: block.hash, data: { type: 'GENESIS', content: 'Genesis' } };
            }
            let parsed;
            try {
                parsed = chain.decryptMessage(i); // returns parsed message object
            } catch (e) {
                parsed = { type: 'UNKNOWN', from: 'unknown', to: 'unknown', content: '[Decryption Failed]' };
            }
            // only show message content if viewer is sender or recipient
            const visible = (viewer === parsed.from || viewer === parsed.to);
            return {
                index: block.index,
                addedBy: block.addedBy,
                timestamp: block.timestamp,
                hash: typeof block.hash === 'string' ? block.hash.substring(0, 12) + '...' : String(block.hash),
                data: visible ? parsed : { type: parsed.type, content: '[Encrypted]' }
            };
        });
        return res.json({ chain: result, valid: chain.isChainValid() });
    } catch (err) {
        console.error('Error building chain response:', err);
        return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// API: Add new structured message block
app.post('/api/add', (req, res) => {
    const { from, to, type, patientId, content } = req.body;
    if (!from || !to || !type || !content) return res.status(400).json({ success: false, error: 'from, to, type and content required' });
    if (!orgManager.isValidator(from) || !orgManager.isValidator(to)) return res.status(400).json({ success: false, error: 'Unknown org' });
    try {
        const message = { type, from, to, patientId: patientId || null, content, timestamp: new Date().toISOString() };
        const block = chain.addBlock(message, from);
        return res.json({ success: true, block: { index: block.index, addedBy: block.addedBy, timestamp: block.timestamp, hash: block.hash.substring(0, 12) + '...' } });
    } catch (e) {
        return res.status(400).json({ success: false, error: e.message || String(e) });
    }
});

// API: Simulate tampering (corrupt block 1)
app.post('/api/tamper', (req, res) => {
    if (chain.chain.length > 1) {
        chain.chain[1].data = 'tampered-data';
        return res.json({ success: true });
    }
    return res.status(400).json({ success: false, error: 'No block to tamper' });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🌐 Web UI running at http://localhost:${PORT}`);
    console.log(`   Shared encryption key (server): ${SHARED_KEY}`);
});