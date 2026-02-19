const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const path = require("path");
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
require("dotenv").config({ path: path.join(__dirname, ".env") });

const seedFinancialOfficer = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");

        const email = "finance@test.com";
        const password = "Finance123";
        const nic = "998877665V";

        // Delete existing officer if exists
        await User.deleteOne({ email });
        console.log("🗑️  Previous test financial officer deleted (if existed)");

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new officer
        await User.create({
            name: "Test Finance Officer",
            email: email,
            nic: nic,
            password: hashedPassword,
            role: "FINANCIAL_OFFICER"
        });

        console.log(`✅ Test Financial Officer User Created:`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   NIC: ${nic}`);
        console.log(`\n📝 You can now login with these credentials!`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding financial officer:", error);
        process.exit(1);
    }
};

seedFinancialOfficer();
