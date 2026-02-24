const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const ASC = require("./models/ASC");
const Crop = require("./models/Crop");
const path = require("path");
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
require("dotenv").config({ path: path.join(__dirname, ".env") });

const seedTestEnvironment = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");

        // 1. Get first ASC
        const asc = await ASC.findOne();
        if (!asc) {
            console.error("❌ No ASC found. Please run seedASC.js first.");
            process.exit(1);
        }
        console.log(`📍 Using ASC: ${asc.name} (${asc.district} District)`);

        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash("Test1234", salt);

        // 2. Create Farmer
        const farmerEmail = "farmer@verify.com";
        await User.deleteOne({ email: farmerEmail });
        const farmer = await User.create({
            name: "Verify Farmer",
            email: farmerEmail,
            nic: "111111111V",
            password: hashedPass,
            role: "FARMER",
            assignedAsc: asc._id
        });
        console.log(`✅ Farmer Created: ${farmerEmail}`);

        // 3. Create Financial Officer
        const financeEmail = "finance@verify.com";
        await User.deleteOne({ email: financeEmail });
        const officer = await User.create({
            name: "Verify Finance Officer",
            email: financeEmail,
            nic: "222222222V",
            password: hashedPass,
            role: "FINANCIAL_OFFICER",
            assignedAsc: asc._id
        });

        // Add officer to ASC's assignedOfficers array
        await ASC.findByIdAndUpdate(asc._id, {
            $addToSet: { assignedOfficers: officer._id }
        });
        console.log(`✅ Financial Officer Created: ${financeEmail}`);

        // 4. Create Approved Crop for Farmer
        await Crop.deleteMany({ farmer: farmer._id });
        const crop = await Crop.create({
            farmer: farmer._id,
            cropType: "Rice",
            variety: "Samba",
            landSize: 5,
            location: "North Field",
            soilType: "Clayey",
            assignedAsc: asc._id,
            season: "Yala",
            status: "APPROVED"
        });
        console.log(`✅ Approved Crop Created for Farmer`);

        console.log("\n--- Test Environment Prepared ---");
        console.log(`Farmer Email: ${farmerEmail}`);
        console.log(`Officer Email: ${financeEmail}`);
        console.log(`Password: Test1234`);
        console.log("----------------------------------");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding test environment:", error);
        process.exit(1);
    }
};

seedTestEnvironment();
