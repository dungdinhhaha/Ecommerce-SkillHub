const User = require("../models/user.model");
const createError = require("../utils/createError");
const Gig = require("../models/gig.model");
const Order = require("../models/order.model");

exports.getUser = async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(createError(404, "User not found"));
  user.password = undefined;
  res.status(200).json({ user });
};

exports.getTalentProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isSeller: true }).select("-password");
    if (!user) return next(createError(404, "Talent not found"));

    const gigs = await Gig.find({
      userId: user._id,
      $or: [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false } }],
    }).sort({ sales: -1, createdAt: -1 }).populate("userId", "username img");

    const orders = await Order.find({ seller: user._id, paymentStatus: "paid" }).select("status price sellerAmount");
    const totalSales = gigs.reduce((sum, gig) => sum + Number(gig.sales || 0), 0);
    const totalStars = gigs.reduce((sum, gig) => sum + Number(gig.totalStars || 0), 0);
    const starNumber = gigs.reduce((sum, gig) => sum + Number(gig.starNumber || 0), 0);
    const completedOrders = orders.filter((order) => order.status === "completed").length;
    const activeOrders = orders.filter((order) => ["in_progress", "submitted", "revision_requested", "disputed"].includes(order.status)).length;
    const revenue = orders.reduce((sum, order) => sum + Number(order.sellerAmount || order.price || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        user,
        stats: {
          listings: gigs.length,
          paidOrders: orders.length,
          completedOrders,
          activeOrders,
          totalSales,
          revenue,
          rating: starNumber ? Number((totalStars / starNumber).toFixed(1)) : null,
          reviews: starNumber,
        },
        gigs,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const allowed = {};
    ["username", "email", "img", "country", "phone", "desc"].forEach((field) => {
      if (req.body[field] !== undefined) allowed[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user.id, allowed, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) return next(createError(404, "User not found"));
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (user?.id.toString() !== req.user.id.toString())
    return next(createError(401, "You are not authorized to delete this user"));

  await User.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true });
};
