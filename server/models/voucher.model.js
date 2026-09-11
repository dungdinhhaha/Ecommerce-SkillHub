const mongoose = require("mongoose");

const VoucherModel = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    title: { type: String, required: true },
    ownerType: { type: String, enum: ["platform", "seller"], default: "platform" },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    discountFundedBy: { type: String, enum: ["platform", "seller"], default: "platform" },
    discountType: { type: String, enum: ["percent", "fixed"], default: "percent" },
    discountValue: { type: Number, required: true },
    maxDiscount: { type: Number, default: 0 },
    minOrderValue: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Voucher", VoucherModel);
