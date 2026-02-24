require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
const mongoose = require('mongoose');

async function testOriginal() {
    try {
        console.log("Connecting to ORIGINAL MongoDB Atlas...");
        const uri = 'mongodb+srv://AGLanka:AGLanka@cluster0.mtteh4v.mongodb.net/AgroLanka?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(uri);
        console.log("✅ ORIGINAL MongoDB connected!");

        const userCount = await mongoose.connection.db.collection('users').countDocuments();
        console.log("👥 Total users found:", userCount);

        if (userCount > 0) {
            const users = await mongoose.connection.db.collection('users').find({}).toArray();
            users.forEach(u => console.log(`- ${u.email} (${u.role})`));
        }
    } catch (error) {
        console.error("❌ ORIGINAL MongoDB failed:", error.message);
        process.exit(1);
    }
}

testOriginal();
