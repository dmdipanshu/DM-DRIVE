const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not found in .env file");
    process.exit(1);
}

async function listUsers() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log("Connected to MongoDB\n");

        const db = client.db("dm-drive");
        const users = await db.collection("users").find({}).toArray();

        if (users.length === 0) {
            console.log("❌ No users found in database!");
            console.log("\n👉 You need to REGISTER first at http://localhost:3000/register");
        } else {
            console.log("📋 Users in database:\n");
            users.forEach((user, i) => {
                console.log(`${i + 1}. ${user.email} (Admin: ${user.isAdmin || false})`);
            });
        }
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await client.close();
    }
}

listUsers();
