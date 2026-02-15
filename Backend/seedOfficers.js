const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const ASC = require("./models/ASC");
const path = require("path");
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
require("dotenv").config({ path: path.join(__dirname, ".env") });

const officers = [
    {
        name: "Kamal Perera",
        email: "kamal.asc@agrolanka.com",
        nic: "851234567V",
        password: "Officer123",
        role: "ASC_OFFICER",
    },
    {
        name: "Sunil Silva",
        email: "sunil.store@agrolanka.com",
        nic: "881234567V",
        password: "Officer123",
        role: "STORE_OFFICER",
    },
    {
        name: "Nimali Fernando",
        email: "nimali.asc@agrolanka.com",
        nic: "901234567V",
        password: "Officer123",
        role: "ASC_OFFICER",
    },
    {
        name: "Arjuna Wickramsinghe",
        email: "arjuna.asc@agrolanka.com",
        nic: "821234567V",
        password: "Officer123",
        role: "ASC_OFFICER",
    },
];

const seedOfficers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");

        // Clear existing officers except admin
        await User.deleteMany({ role: { $in: ["ASC_OFFICER", "STORE_OFFICER"] } });
        console.log("🗑️  Previous officers deleted");

        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash("Officer123", salt);

        // Get some ASCs to assign
        const ascs = await ASC.find().limit(4);

        if (ascs.length < 4) {
            console.error("❌ Not enough ASCs found. Please run seedASC.js first.");
            process.exit(1);
        }

        for (let i = 0; i < officers.length; i++) {
            const officer = officers[i];
            const asc = ascs[i];

            const newUser = await User.create({
                ...officer,
                password: hashedPass,
                assignedAsc: asc._id
            });

            await ASC.findByIdAndUpdate(asc._id, {
                $addToSet: { assignedOfficers: newUser._id }
            });

            console.log(`✅ Officer Created: ${officer.name} (Assigned to: ${asc.name})`);
        }

        console.log("✅ Officers seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding officers:", error);
        process.exit(1);
    }
};

seedOfficers();
