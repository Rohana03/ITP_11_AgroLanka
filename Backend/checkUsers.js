require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const mongoose = require("mongoose");
const User = require("./models/User");

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // Get all users
        const users = await User.find({});
        console.log(`\n📊 Total users in database: ${users.length}\n`);

        if (users.length > 0) {
            console.log("👥 Users found:");
            users.forEach((user, index) => {
                console.log(`\n${index + 1}. ${user.name}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   NIC: ${user.nic}`);
            });
        } else {
            console.log("❌ No users found in the database!");
            console.log("\n💡 You need to register a user first:");
            console.log("   1. Go to http://localhost:5173/register");
            console.log("   2. Fill in the registration form");
            console.log("   3. Select 'Farmer' as the role");
            console.log("   4. Submit the form");
        }

        await mongoose.connection.close();
        console.log("\n✅ Database connection closed");
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

checkUsers();
