const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const path = require("path");
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
require("dotenv").config({ path: path.join(__dirname, ".env") });

const seedFarmer = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");

        const email = "farmer@test.com";
        const password = "Farmer123";
        const nic = "123456789V";

        // Delete existing farmer if exists
        await User.deleteOne({ email });
        console.log("🗑️  Previous test farmer deleted (if existed)");

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new farmer
        await User.create({
            name: "Test Farmer",
            email: email,
            nic: nic,
            password: hashedPassword,
            role: "FARMER"
        });

        console.log(`✅ Test Farmer User Created:`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   NIC: ${nic}`);
        console.log(`\n📝 You can now login with these credentials!`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding farmer:", error);
        process.exit(1);
    }
};

seedFarmer();
