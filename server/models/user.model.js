const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")

const UserModel = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    img: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: false,
    },
    desc: {
      type: String,
      required: false,
    },
    isSeller: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    accountStatus: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },
    totalEarned: {
      type: Number,
      default: 0,
    },
    legalConsent: {
      termsAcceptedAt: { type: Date, default: null },
      privacyAcceptedAt: { type: Date, default: null },
      version: { type: String, default: "2026-09" },
    },
  },
  {
    timestamps: true,
  }
);

UserModel.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const hashedPass = await bcrypt.hash(this.password, 10);
  this.password = hashedPass;
  next();
});

UserModel.methods.isPasswordMatch = async function (password) {
  return await bcrypt.compare(password, this.password);
};

UserModel.methods.getSignToken = function () {
  return jwt.sign(
    { id: this._id, isSeller: this.isSeller, isAdmin: this.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" }
  );
};

module.exports = mongoose.model("User", UserModel);
