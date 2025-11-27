// index.js
const OrgManager = require('./orgManager');
const SecureBlockchain = require('./blockchain');

console.log("🏥 Secure Data Sharing Blockchain – Undergraduate Prototype");
console.log("==========================================================\n");

const orgs = new OrgManager();
const chain = new SecureBlockchain(orgs);

// Add data
try {
    chain.addBlock("Patient #101: Diagnosed with pneumonia", "Hospital");
    chain.addBlock("Lab #101: WBC = 15k, CRP elevated", "Lab");
    chain.addBlock("Claim #101: Approved for antibiotics", "Insurance");
    console.log("✅ All records added successfully.");
} catch (e) {
    console.log("❌ Error:", e.message);
}

// Tamper
console.log("\n⚠️  Simulating tampering...");
chain.chain[1].data = "tampered:data";

// Validate
console.log(`\n🔍 Chain valid? ${chain.isChainValid() ? "YES" : "❌ NO"}`);

// Access demo
console.log("\n📂 Data Access Test:");
for (let i = 1; i <= 3; i++) {
    console.log(`Block ${i}:`);
    orgs.getAllOrgs().forEach(org => {
        const result = chain.tryDecrypt(i, org);
        console.log(`  ${org}: ${result}`);
    });
}