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
    {
        name: "Paddy Officer",
        email: "paddy@agrolanka.com",
        nic: "911234567V",
        password: "Officer123",
        role: "CROP_OFFICER",
        specialization: "Paddy"
    },
    {
        name: "Veggie Officer",
        email: "veggie@agrolanka.com",
        nic: "921234567V",
        password: "Officer123",
        role: "CROP_OFFICER",
        specialization: "Vegetables"
    },
    {
        name: "Coconut Officer",
        email: "coconut@agrolanka.com",
        nic: "931234567V",
        password: "Officer123",
        role: "CROP_OFFICER",
        specialization: "Coconut"
    },
    {
        name: "Tea Officer",
        email: "tea@agrolanka.com",
        nic: "941234567V",
        password: "Officer123",
        role: "CROP_OFFICER",
        specialization: "Tea"
    },
    {
        name: "Rubber Officer",
        email: "rubber@agrolanka.com",
        nic: "951234567V",
        password: "Officer123",
        role: "CROP_OFFICER",
        specialization: "Rubber"
    },
    {
        name: "Coffee Officer",
        email: "coffee@agrolanka.com",
        nic: "961234567V",
        password: "Officer123",
        role: "CROP_OFFICER",
        specialization: "Coffee"
    },
    {
        name: "Fruit Officer",
        email: "fruit@agrolanka.com",
        nic: "971234567V",
        password: "Officer123",
        role: "CROP_OFFICER",
        specialization: "Fruits"
    },
    {
        name: "Spice Officer",
        email: "spice@agrolanka.com",
        nic: "981234567V",
        password: "Officer123",
        role: "CROP_OFFICER",
        specialization: "Spices"
    },
    {
        name: "Generic Officer",
        email: "other@agrolanka.com",
        nic: "991234567V",
        password: "Officer123",
        role: "CROP_OFFICER",
        specialization: "Other"
    },
];

const seedOfficers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");

        // Clear existing officers except admin
        await User.deleteMany({ role: { $in: ["ASC_OFFICER", "STORE_OFFICER", "CROP_OFFICER"] } });
        console.log("🗑️  Previous officers deleted");

        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash("Officer123", salt);

        // Get ASCs to assign
        const ascs = await ASC.find();

        if (ascs.length === 0) {
            console.error("❌ No ASCs found. Please run seedASC.js first.");
            process.exit(1);
        }

        for (let i = 0; i < officers.length; i++) {
            const officer = officers[i];
            const asc = ascs[i % ascs.length]; // Use round-robin if more officers than ASCs

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
