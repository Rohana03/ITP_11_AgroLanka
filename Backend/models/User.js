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
      unique: true,
      lowercase: true,
      trim: true
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
      enum: ["FARMER", "ASC_OFFICER", "ADMIN", "FINANCIAL_OFFICER", "CROP_OFFICER", "PRODUCT_MANAGER", "MACHINERY_OFFICER"],
      default: "FARMER",
    },
    assignedAsc: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ASC',
      default: null
    },
    specialization: {
      type: String,
      default: null
    },
    serviceDistricts: {
      type: [String],
      default: []
    },
    phone: {
      type: String,
      default: ""
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
