const mongoose = require('mongoose');
const ASC = require('./models/ASC');
const { ascData, districtNames } = require('./data/ascData');
const path = require("path");
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
require("dotenv").config({ path: path.join(__dirname, ".env") });

const seedASC = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");

        // Clear existing ASCs to avoid duplicates
        await ASC.deleteMany({});
        console.log("🗑️  Cleared existing ASCs");

        const ascEntries = [];

        for (const [districtCode, centers] of Object.entries(ascData)) {
            const districtName = districtNames[districtCode];

            centers.forEach(center => {
                ascEntries.push({
                    code: center.code,
                    name: center.name,
                    district: districtName
                });
            });
        }

        await ASC.insertMany(ascEntries);
        console.log(`✅ Seeded ${ascEntries.length} ASCs successfully!`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding ASCs:", error);
        process.exit(1);
    }
};

seedASC();
