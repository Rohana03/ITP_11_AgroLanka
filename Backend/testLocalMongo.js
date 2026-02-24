const mongoose = require('mongoose');

async function testLocal() {
    try {
        console.log("Connecting to local MongoDB...");
        await mongoose.connect('mongodb://127.0.0.1:27017/AgroLanka');
        console.log("✅ Local MongoDB connected!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Local MongoDB failed:", error.message);
        process.exit(1);
    }
}

testLocal();
