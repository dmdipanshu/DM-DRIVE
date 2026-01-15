const crypto = require('crypto');
const { webcrypto } = require('crypto'); // Node 15+ has webcrypto

const SECRET = "DM123456789dm+";
const PAYLOAD_OBJ = {
    exp: Date.now() + 3600000,
    fid: "test-file-id"
};
const PAYLOAD_JSON = JSON.stringify(PAYLOAD_OBJ);

// 1. GENERATE (Node Style - Matching route.ts)
const signatureHex = crypto.createHmac('sha256', SECRET).update(PAYLOAD_JSON).digest('hex');
const token = `${btoa(PAYLOAD_JSON)}.${signatureHex}`;

console.log("Generated Token:", token);

// 2. VERIFY (Worker Style - Matching worker/index.js)
async function verifyWorkerStyle(token, secret) {
    const encoder = new TextEncoder();
    const key = await webcrypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
    );

    const [contentB64, sigHex] = token.split('.');
    const content = atob(contentB64); // Decode base64 to get JSON string

    // Check if content matches
    if (content !== PAYLOAD_JSON) {
        console.log("Content mismatch!", content, PAYLOAD_JSON);
    }

    const signature = new Uint8Array(sigHex.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16)));

    const valid = await webcrypto.subtle.verify(
        "HMAC",
        key,
        signature,
        encoder.encode(content) // Verify against the DECODED json string
    );

    return valid;
}

verifyWorkerStyle(token, SECRET).then(valid => {
    console.log("Verification Result:", valid ? "PASS" : "FAIL");
});
