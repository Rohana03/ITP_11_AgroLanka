const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    nic: {
      type: String,
      required: [true, "Please add a NIC number"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
    },
    role: {
      type: String,
<<<<<<< HEAD
      enum: ["FARMER", "ASC_OFFICER", "STORE_OFFICER", "ADMIN", "FINANCIAL_OFFICER", "CROP_OFFICER", "PRODUCT_MANAGER", "MACHINERY_OFFICER"],
=======
      enum: ["FARMER", "ASC_OFFICER", "STORE_OFFICER", "ADMIN"],
>>>>>>> 9b47020 (solved)
      default: "FARMER",
    },
    assignedAsc: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ASC',
      default: null
    },
<<<<<<< HEAD
    specialization: {
      type: String,
      default: null
    },
=======
>>>>>>> 9b47020 (solved)
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
