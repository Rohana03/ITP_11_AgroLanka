const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const ASC = require("./models/ASC");
const Machinery = require("./models/Machinery");
const path = require("path");
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
require("dotenv").config({ path: path.join(__dirname, ".env") });

const seedMachinery = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");

        const asc = await ASC.findOne();
        if (!asc) {
            console.error("❌ No ASC found. Run seedASC.js first.");
            process.exit(1);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash("Test1234", salt);

        // 1. Create Machinery Officer
        const officerEmail = "machinery@verify.com";
        await User.deleteOne({ email: officerEmail });
        const officer = await User.create({
            name: "Verify Machinery Officer",
            email: officerEmail,
            nic: "333333333V",
            password: hashedPass,
            role: "MACHINERY_OFFICER",
            assignedAsc: asc._id
        });
        console.log(`✅ Machinery Officer Created: ${officerEmail}`);

        // 2. Add initial inventory
        await Machinery.deleteMany({ asc: asc._id });
        const items = [
            { name: "John Deere Tractor", type: "Tractor", totalCount: 5, availableCount: 5, asc: asc._id },
            { name: "Kubota Harvester", type: "Harvester", totalCount: 2, availableCount: 2, asc: asc._id },
            { name: "Standard Plough", type: "Plough", totalCount: 10, availableCount: 10, asc: asc._id }
        ];
        await Machinery.insertMany(items);
        console.log(`✅ Seeded ${items.length} machinery items for ${asc.name}`);

        console.log("\n--- Machinery Test Environment Ready ---");
        console.log(`Officer Email: ${officerEmail}`);
        console.log(`Password: Test1234`);
        console.log("-----------------------------------------");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding machinery:", error);
        process.exit(1);
    }
};

seedMachinery();
