const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not found in .env file");
    process.exit(1);
}

// CHANGE THIS TO YOUR EMAIL
const YOUR_EMAIL = "dm@dm.com";

async function makeAdmin() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db("dm-drive");
        const result = await db.collection("users").updateOne(
            { email: YOUR_EMAIL },
            { $set: { isAdmin: true } }
        );

        if (result.matchedCount === 0) {
            console.log("❌ User not found with email:", YOUR_EMAIL);
        } else {
            console.log("✅ Successfully made admin:", YOUR_EMAIL);
        }
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await client.close();
    }
}

makeAdmin();
