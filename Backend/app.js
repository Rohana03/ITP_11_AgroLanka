// require('dotenv').config({ path: './.env' });

// console.log("=== DEBUG: Loaded environment variables ===");
// console.log("All keys in process.env:", Object.keys(process.env));
// console.log("MONGO_URI →", process.env.MONGO_URI);
// console.log("PORT →", process.env.PORT);
// console.log("Number of vars dotenv claims to load:", Object.keys(process.env).length); // rough count

// // rest of your code...

// const express = require("express");
// const mongoose = require("mongoose");

// const app = express();

// app.get("/", (req, res) => {
//     res.send("It is working");
// });

// mongoose.connect(process.env.MONGO_URI)
// .then(() => {
//     console.log("✅ MongoDB connected");
//     app.listen(process.env.PORT, () => {
//         console.log(`🚀 Server running on port ${process.env.PORT}`);
//     });
// })
// .catch(err => console.error("❌ DB error:", err));
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");

const app = express();

console.log("MONGO_URI →", process.env.MONGO_URI);
console.log("PORT →", process.env.PORT);

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is missing. Check .env file + variable name.");
  process.exit(1);
}

app.get("/", (req, res) => res.send("It is working"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => console.error("❌ DB error:", err));

  app.use("/api/auth", require("./routes/authRoutes"));
