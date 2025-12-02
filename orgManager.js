// orgManager.js
class OrgManager {
    constructor() {
        this.orgKeys = {
            'Hospital': 'HospitalKey2025!',
            'Lab': 'LabSecretKey2025!',
            'Insurance': 'InsureKey2025!'
        };
        this.validators = new Set(['Hospital', 'Lab', 'Insurance']);
    }

    isValidator(orgId) {
        return this.validators.has(orgId);
    }

    getKey(orgId) {
        return this.orgKeys[orgId] || null;
    }

    getAllOrgs() {
        return Object.keys(this.orgKeys);
    }
}

module.exports = OrgManager;