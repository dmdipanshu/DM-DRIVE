// Check database connection - reads from .env using dotenv
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not found in .env file");
    process.exit(1);
}

console.log("=== DATABASE CONNECTION CHECK ===\n");
console.log("MongoDB URI:", MONGODB_URI.replace(/:[^:]*@/, ':****@')); // Hide password

// Try connecting to what the APP uses
async function checkAppDB() {
    console.log("\n=== Checking App's Database ===");
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db();
        const dbName = db.databaseName;
        console.log("Connected to database:", dbName);

        const users = await db.collection("users").find({}).toArray();
        console.log("Users in this database:", users.length);
        users.forEach(u => console.log(" -", u.email));
    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await client.close();
    }
}

checkAppDB();
