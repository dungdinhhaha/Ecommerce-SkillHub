const Voucher = require("../models/voucher.model");
const createError = require("../utils/createError");

const SELLER_MAX_PERCENT = 30;

const validateSellerVoucher = (payload) => {
  if (!payload.code || !payload.title || payload.discountValue <= 0)
    return "Voucher cần mã, tên và giá trị giảm hợp lệ";
  if (payload.discountType === "percent" && payload.discountValue > SELLER_MAX_PERCENT)
    return `Talent chỉ được tạo khuyến mãi tối đa ${SELLER_MAX_PERCENT}%`;
  return "";
};

exports.getMyVouchers = async (req, res, next) => {
  try {
    if (!req.user.isSeller) return next(createError(403, "Only talent can manage vouchers"));
    const vouchers = await Voucher.find({ seller: req.user.id, ownerType: "seller" }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: vouchers });
  } catch (err) { next(err); }
};

exports.createMyVoucher = async (req, res, next) => {
  try {
    if (!req.user.isSeller) return next(createError(403, "Only talent can create vouchers"));
    const payload = {
      code: String(req.body.code || "").trim().toUpperCase(),
      title: req.body.title,
      ownerType: "seller",
      seller: req.user.id,
      discountFundedBy: "seller",
      discountType: req.body.discountType || "percent",
      discountValue: Number(req.body.discountValue),
      maxDiscount: Number(req.body.maxDiscount || 0),
      minOrderValue: Number(req.body.minOrderValue || 0),
      usageLimit: Number(req.body.usageLimit || 0),
      expiresAt: req.body.expiresAt || null,
      isActive: req.body.isActive !== false,
    };
    const errorMessage = validateSellerVoucher(payload);
    if (errorMessage) return next(createError(400, errorMessage));
    const voucher = await Voucher.create(payload);
    res.status(201).json({ success: true, data: voucher });
  } catch (err) { next(err); }
};

exports.updateMyVoucher = async (req, res, next) => {
  try {
    if (!req.user.isSeller) return next(createError(403, "Only talent can update vouchers"));
    const allowed = {};
    ["title", "discountType", "expiresAt", "isActive"].forEach((field) => {
      if (req.body[field] !== undefined) allowed[field] = req.body[field];
    });
    ["discountValue", "maxDiscount", "minOrderValue", "usageLimit"].forEach((field) => {
      if (req.body[field] !== undefined) allowed[field] = Number(req.body[field] || 0);
    });
    const current = await Voucher.findOne({ _id: req.params.id, seller: req.user.id, ownerType: "seller" });
    if (!current) return next(createError(404, "Voucher not found"));
    const nextType = allowed.discountType || current.discountType;
    const nextValue = allowed.discountValue !== undefined ? allowed.discountValue : current.discountValue;
    if (nextType === "percent" && nextValue > SELLER_MAX_PERCENT)
      return next(createError(400, `Talent chỉ được tạo khuyến mãi tối đa ${SELLER_MAX_PERCENT}%`));
    Object.assign(current, allowed);
    const voucher = await current.save();
    res.status(200).json({ success: true, data: voucher });
  } catch (err) { next(err); }
};
