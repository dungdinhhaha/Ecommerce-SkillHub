const Gig = require("../models/gig.model");
const Voucher = require("../models/voucher.model");
const createError = require("../utils/createError");

const getSellerId = (gig) => String(gig.userId?._id || gig.userId || "");

const calculatePromotion = (gig, sellerVouchers = []) => {
  const originalPrice = Number(gig.price || 0);
  if (!originalPrice || !sellerVouchers.length) return null;
  return sellerVouchers.reduce((best, voucher) => {
    if (originalPrice < Number(voucher.minOrderValue || 0)) return best;
    let discountAmount = voucher.discountType === "percent"
      ? Math.round(originalPrice * Number(voucher.discountValue || 0) / 100)
      : Math.round(Number(voucher.discountValue || 0));
    if (voucher.maxDiscount) discountAmount = Math.min(discountAmount, Number(voucher.maxDiscount));
    discountAmount = Math.min(discountAmount, Math.round(originalPrice * 0.3), originalPrice - 1000);
    if (discountAmount <= 0) return best;
    const promotion = {
      code: voucher.code,
      title: voucher.title,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      discountAmount,
      originalPrice,
      finalPrice: originalPrice - discountAmount,
      discountPercent: Math.round((discountAmount / originalPrice) * 100),
    };
    if (!best || promotion.discountAmount > best.discountAmount) return promotion;
    return best;
  }, null);
};

const attachPromotions = async (gigs) => {
  const items = Array.isArray(gigs) ? gigs : [gigs];
  const plainItems = items.map((gig) => typeof gig.toObject === "function" ? gig.toObject() : gig);
  const sellerIds = [...new Set(plainItems.map(getSellerId).filter(Boolean))];
  if (!sellerIds.length) return Array.isArray(gigs) ? plainItems : plainItems[0];
  const now = new Date();
  const vouchers = await Voucher.find({
    ownerType: "seller",
    seller: { $in: sellerIds },
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  });
  const grouped = vouchers.reduce((map, voucher) => {
    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) return map;
    const key = String(voucher.seller);
    map[key] = map[key] || [];
    map[key].push(voucher);
    return map;
  }, {});
  const withPromotions = plainItems.map((gig) => {
    const promotion = calculatePromotion(gig, grouped[getSellerId(gig)] || []);
    return {
      ...gig,
      hasPromotion: !!promotion,
      salePrice: promotion?.finalPrice || null,
      promotion,
    };
  });
  return Array.isArray(gigs) ? withPromotions : withPromotions[0];
};

exports.addGig = async (req, res, next) => {
  try {
    if (!req.user.isSeller)
      return next(createError(401, "Only sellers can create a gig"));
    const listingType = req.body.listingType || "skill_service";
    if (listingType === "digital_product" && !req.body.digitalFileUrl)
      return next(createError(400, "Digital products require a downloadable file"));
    const gig = await Gig.create({
      ...req.body,
      listingType,
      approvalStatus: "pending",
      userId: req.user.id,
    });
    return res.status(201).json({ success: true, data: gig });
  } catch (err) {
    next(err);
  }
};
exports.getAllGigs = async (req, res, next) => {
  const filters = {};
  const andFilters = [];
  const search = String(req.query.search || "").trim();
  if (search)
    andFilters.push({ $or: [
      { title: { $regex: search, $options: "i" } },
      { shortTitle: { $regex: search, $options: "i" } },
      { shortDesc: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { cat: { $regex: search, $options: "i" } },
    ] });
  if (req.query.max) filters.price = { $lte: req.query.max };
  if (req.query.min) filters.price = { $gte: req.query.min };
  if (req.query.max && req.query.min) filters.price = { $gte: req.query.min, $lte: req.query.max };
  if (req.query.cat) filters.cat = req.query.cat;
  if (req.query.type) filters.listingType = req.query.type;
  if (req.query.deliveryTime) filters.deliveryTime = { $lte: Number(req.query.deliveryTime) };
  if (req.query.minSales) filters.sales = { $gte: Number(req.query.minSales) };
  if(req.query.userId) filters.userId = req.query.userId;
  if (!req.query.userId) {
    andFilters.push({ $or: [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false } }] });
  }
  if (andFilters.length) filters.$and = andFilters;
  try {
    const sortKey = String(req.query.sort || "createdAt");
    const sortMap = {
      createdAt: { createdAt: -1 },
      sales: { sales: -1 },
      priceAsc: { price: 1 },
      priceDesc: { price: -1 },
      rating: { totalStars: -1, starNumber: -1 },
    };
    const gigs = await Gig.find(filters)
      .sort(sortMap[sortKey] || sortMap.createdAt)
      .populate("userId", "username img");
    let data = await attachPromotions(gigs);
    if (sortKey === "promotion") {
      data = data.sort((a, b) => {
        if (Number(b.hasPromotion) !== Number(a.hasPromotion)) return Number(b.hasPromotion) - Number(a.hasPromotion);
        return (b.promotion?.discountPercent || 0) - (a.promotion?.discountPercent || 0);
      });
    }
    if (req.query.promotion === "true") data = data.filter((gig) => gig.hasPromotion);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getGig = async (req, res, next) => {
  try {
    console.log(req.params.id);
    const gig = await Gig.findOne({
      _id: req.params.id,
      $or: [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false } }],
    }).populate(
      "userId",
      "username img country desc createdAt"
    );
    if (!gig) return next(createError(404, "Gig not found"));
    const data = await attachPromotions(gig);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.deleteGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return next(createError(404, "Gig not found"));
    if (gig.userId.toString() !== req.user.id.toString())
      return next(
        createError(403, "You are not authorized to delete this gig")
      );
    await Gig.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
