require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
const mongoose = require('mongoose');

async function debugConnection() {
    const uri = "mongodb+srv://AgroLanka:AgroLanka123@cluster0.tlzm7m4.mongodb.net/AgroLanka?retryWrites=true&w=majority&appName=Cluster0";
    try {
        console.log("Testing connection to:", uri.split('@')[1]); // Don't log password
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log("✅ Successfully connected to MongoDB Atlas!");

        try {
            const collections = await mongoose.connection.db.listCollections().toArray();
            console.log("📂 Databases accessible. Collections:", collections.map(c => c.name));

            const userCount = await mongoose.connection.db.collection('users').countDocuments();
            console.log("👥 Total users in 'users' collection:", userCount);
        } catch (dbErr) {
            console.error("❌ Connected but failed to list data:", dbErr.message);
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ MongoDB Connection failed!");
        console.error("   Error Message:", error.message);
        if (error.message.includes('authentication failed')) {
            console.error("   💡 Hint: The username 'AgroLanka' or password 'AgroLanka123' might be incorrect for this cluster.");
        } else if (error.message.includes('querySrv')) {
            console.error("   💡 Hint: This looks like a DNS issue. Are you behind a firewall or VPN?");
        } else if (error.message.includes('ECONNREFUSED')) {
            console.error("   💡 Hint: The connection was refused. Check your IP whitelist in MongoDB Atlas.");
        }
        process.exit(1);
    }
}

debugConnection();
