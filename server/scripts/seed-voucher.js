require("dotenv").config();
const mongoose = require("mongoose");
const Voucher = require("../models/voucher.model");

async function seedVoucher() {
  if (!process.env.DB_URI) {
    throw new Error("Missing DB_URI");
  }

  await mongoose.connect(process.env.DB_URI);
  const voucher = await Voucher.findOneAndUpdate(
    { code: "SKILLHUB20" },
    {
      code: "SKILLHUB20",
      title: "Mã chào mừng SkillHub",
      ownerType: "platform",
      seller: null,
      discountFundedBy: "platform",
      discountType: "percent",
      discountValue: 20,
      maxDiscount: 50000,
      minOrderValue: 0,
      usageLimit: 0,
      isActive: true,
      expiresAt: null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Voucher seeded: ${voucher.code}`);
  await mongoose.disconnect();
}

seedVoucher().catch(async (err) => {
  console.error(err.message || err);
  await mongoose.disconnect();
  process.exit(1);
});
