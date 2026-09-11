const Wishlist = require("../models/wishlist.model");
const createError = require("../utils/createError");

exports.getWishlist = async (req, res, next) => {
  try {
    const items = await Wishlist.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate({ path: "gig", populate: { path: "userId", select: "username img" } });
    res.status(200).json({ success: true, data: items });
  } catch (err) { next(err); }
};

exports.toggleWishlist = async (req, res, next) => {
  try {
    const existing = await Wishlist.findOne({ user: req.user.id, gig: req.params.gigId });
    if (existing) {
      await existing.deleteOne();
      return res.status(200).json({ success: true, data: { saved: false } });
    }
    const item = await Wishlist.create({ user: req.user.id, gig: req.params.gigId });
    res.status(201).json({ success: true, data: { saved: true, item } });
  } catch (err) {
    if (err.code === 11000) return next(createError(400, "Already saved"));
    next(err);
  }
};
