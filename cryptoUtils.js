// cryptoUtils.js
const crypto = require('crypto');

class CryptoUtils {
    // Derive a 32-byte key from a password (for demo; real systems use HSM/key exchange)
    static deriveKey(password) {
        return crypto.createHash('sha256').update(password).digest();
    }

    // Encrypt with AES-256-GCM (provides confidentiality + integrity)
    static encrypt(text, password) {
        const key = this.deriveKey(password);
        const iv = crypto.randomBytes(12); // 96-bit IV for GCM
        const cipher = crypto.createCipher('aes-256-gcm', key);
        cipher.setAAD(Buffer.from('secure-data-sharing')); // Associated data
        const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return {
            iv: iv.toString('hex'),
            encrypted: encrypted.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }

    // Decrypt
    static decrypt(encryptedObj, password) {
        const key = this.deriveKey(password);
        const iv = Buffer.from(encryptedObj.iv, 'hex');
        const encrypted = Buffer.from(encryptedObj.encrypted, 'hex');
        const authTag = Buffer.from(encryptedObj.authTag, 'hex');

        const decipher = crypto.createDecipher('aes-256-gcm', key);
        decipher.setAAD(Buffer.from('secure-data-sharing'));
        decipher.setAuthTag(authTag);
        const decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString('utf8');
    }
}

module.exports = CryptoUtils;