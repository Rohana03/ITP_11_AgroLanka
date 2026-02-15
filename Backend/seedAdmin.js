const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const path = require("path");
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
require("dotenv").config({ path: path.join(__dirname, ".env") });

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");

        const email = "AdminAgroLanka@gmail.com";
        const password = "Admin123";
        const nic = "999999999V";

        // Delete existing admin if exists
        await User.deleteOne({ email });
        console.log("🗑️  Previous admin deleted (if existed)");

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new admin
        await User.create({
            name: "System Admin",
            email: email,
            nic: nic,
            password: hashedPassword,
            role: "ADMIN"
        });

        console.log(`✅ Admin User Created:`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   NIC: ${nic}`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding admin:", error);
        process.exit(1);
    }
};

seedAdmin();
