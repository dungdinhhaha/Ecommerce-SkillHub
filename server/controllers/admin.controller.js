const Gig = require("../models/gig.model");
const Order = require("../models/order.model");
const User = require("../models/user.model");
const Withdrawal = require("../models/withdrawal.model");
const Refund = require("../models/refund.model");
const Category = require("../models/category.model");
const Voucher = require("../models/voucher.model");
const createError = require("../utils/createError");

const PAYOUT_HOLD_DAYS = Number(process.env.PAYOUT_HOLD_DAYS || 10);
const getPayoutAvailableAt = (date = new Date()) =>
  new Date(new Date(date).getTime() + PAYOUT_HOLD_DAYS * 24 * 60 * 60 * 1000);

exports.getVouchers = async (req, res, next) => {
  try {
    const vouchers = await Voucher.find({}).sort({ createdAt: -1 }).populate("seller", "username email");
    res.status(200).json({ success: true, data: vouchers });
  } catch (err) { next(err); }
};

exports.createVoucher = async (req, res, next) => {
  try {
    const payload = {
      code: String(req.body.code || "").trim().toUpperCase(),
      title: req.body.title,
      ownerType: "platform",
      seller: null,
      discountFundedBy: "platform",
      discountType: req.body.discountType,
      discountValue: Number(req.body.discountValue),
      maxDiscount: Number(req.body.maxDiscount || 0),
      minOrderValue: Number(req.body.minOrderValue || 0),
      usageLimit: Number(req.body.usageLimit || 0),
      expiresAt: req.body.expiresAt || null,
      isActive: req.body.isActive !== false,
    };
    if (!payload.code || !payload.title || payload.discountValue <= 0)
      return next(createError(400, "Voucher cần mã, tên và giá trị giảm hợp lệ"));
    const voucher = await Voucher.create(payload);
    res.status(201).json({ success: true, data: voucher });
  } catch (err) { next(err); }
};

exports.updateVoucher = async (req, res, next) => {
  try {
    const allowed = {};
    ["title", "discountType", "expiresAt", "isActive"].forEach((field) => {
      if (req.body[field] !== undefined) allowed[field] = req.body[field];
    });
    ["discountValue", "maxDiscount", "minOrderValue", "usageLimit"].forEach((field) => {
      if (req.body[field] !== undefined) allowed[field] = Number(req.body[field] || 0);
    });
    const voucher = await Voucher.findByIdAndUpdate(req.params.id, allowed, { new: true, runValidators: true });
    if (!voucher) return next(createError(404, "Voucher not found"));
    res.status(200).json({ success: true, data: voucher });
  } catch (err) { next(err); }
};

exports.getListingsForReview = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.approvalStatus = req.query.status;
    if (req.query.type) filter.listingType = req.query.type;
    if (req.query.cat) filter.cat = req.query.cat;
    if (req.query.search) filter.title = { $regex: req.query.search, $options: "i" };
    const listings = await Gig.find(filter.approvalStatus ? filter : { approvalStatus: "pending" })
      .sort({ createdAt: -1 })
      .populate("userId", "username email img");
    res.status(200).json({ success: true, data: listings });
  } catch (err) { next(err); }
};

exports.getProducts = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.approvalStatus = req.query.status;
    if (req.query.type) filter.listingType = req.query.type;
    if (req.query.cat) filter.cat = req.query.cat;
    if (req.query.search) filter.title = { $regex: req.query.search, $options: "i" };
    const products = await Gig.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "username email img accountStatus");
    res.status(200).json({ success: true, data: products });
  } catch (err) { next(err); }
};

exports.reviewListing = async (req, res, next) => {
  try {
    const { status, rejectionReason = "" } = req.body;
    if (!["approved", "rejected", "pending"].includes(status))
      return next(createError(400, "Invalid approval status"));
    const listing = await Gig.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: status, rejectionReason },
      { new: true }
    );
    if (!listing) return next(createError(404, "Listing not found"));
    res.status(200).json({ success: true, data: listing });
  } catch (err) { next(err); }
};

exports.getUsers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role === "talent") filter.isSeller = true;
    if (req.query.role === "buyer") {
      filter.isSeller = false;
      filter.isAdmin = { $ne: true };
    }
    if (req.query.role === "admin") filter.isAdmin = true;
    if (req.query.status) filter.accountStatus = req.query.status;
    const search = String(req.query.search || "").trim();
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
      ];
    }
    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const allowed = {};
    if (["active", "blocked"].includes(req.body.accountStatus)) allowed.accountStatus = req.body.accountStatus;
    if (typeof req.body.isSeller === "boolean") allowed.isSeller = req.body.isSeller;
    if (typeof req.body.isAdmin === "boolean") allowed.isAdmin = req.body.isAdmin;
    const user = await User.findByIdAndUpdate(req.params.id, allowed, { new: true }).select("-password");
    if (!user) return next(createError(404, "User not found"));
    res.status(200).json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.getCategoriesAdmin = async (req, res, next) => {
  try {
    const categories = await Category.find({}).sort({ sortOrder: 1, name: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (err) { next(err); }
};

exports.createCategoryAdmin = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (err) { next(err); }
};

exports.updateCategoryAdmin = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return next(createError(404, "Category not found"));
    res.status(200).json({ success: true, data: category });
  } catch (err) { next(err); }
};

exports.getDisputes = async (req, res, next) => {
  try {
    const orders = await Order.find({ status: "disputed" })
      .sort({ updatedAt: -1 })
      .populate("gig", "title cover listingType")
      .populate("buyer", "username email")
      .populate("seller", "username email");
    res.status(200).json({ success: true, data: orders });
  } catch (err) { next(err); }
};

exports.getOrders = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.buyer) filter.buyer = req.query.buyer;
    if (req.query.seller) filter.seller = req.query.seller;
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
    }
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate("gig", "title cover listingType")
      .populate("buyer", "username email")
      .populate("seller", "username email");
    res.status(200).json({ success: true, data: orders });
  } catch (err) { next(err); }
};

exports.getDashboard = async (req, res, next) => {
  try {
    const orders = await Order.find({ paymentStatus: "paid" }).populate("gig", "title cat").populate("seller", "username");
    const completed = orders.filter((order) => order.status === "completed");
    const paidRevenue = orders.reduce((sum, order) => sum + order.price, 0);
    const completedRevenue = completed.reduce((sum, order) => sum + order.price, 0);
    const platformFees = completed.reduce((sum, order) => sum + (order.platformFee || 0), 0);
    const sellerPayouts = completed.reduce((sum, order) => sum + (order.sellerAmount || order.price), 0);
    const now = new Date();
    const payoutDateFor = (order) => order.payoutAvailableAt || getPayoutAvailableAt(order.completedAt || order.updatedAt || order.createdAt);
    const availableSellerPayouts = completed
      .filter((order) => new Date(payoutDateFor(order)) <= now)
      .reduce((sum, order) => sum + (order.sellerAmount || order.price), 0);
    const heldSellerPayouts = completed
      .filter((order) => new Date(payoutDateFor(order)) > now)
      .reduce((sum, order) => sum + (order.sellerAmount || order.price), 0);
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});
    const sellerMap = {};
    const categoryMap = {};
    completed.forEach((order) => {
      const sellerName = order.seller?.username || "Unknown";
      sellerMap[sellerName] = (sellerMap[sellerName] || 0) + (order.sellerAmount || order.price);
      const cat = order.gig?.cat || "other";
      categoryMap[cat] = (categoryMap[cat] || 0) + order.price;
    });
    const topSellers = Object.entries(sellerMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, revenue]) => ({ name, revenue }));
    const topCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, revenue]) => ({ name, revenue }));
    const revenueByDayMap = {};
    orders.forEach((order) => {
      const key = new Date(order.paidAt || order.createdAt).toISOString().slice(0, 10);
      revenueByDayMap[key] = (revenueByDayMap[key] || 0) + order.price;
    });
    const revenueByDay = Object.entries(revenueByDayMap).sort((a, b) => a[0].localeCompare(b[0])).map(([date, revenue]) => ({ date, revenue }));
    const disputedCount = orders.filter((order) => order.status === "disputed").length;
    const cancelledCount = orders.filter((order) => order.status === "cancelled").length;
    res.status(200).json({ success: true, data: {
      totalPaidOrders: orders.length,
      completedOrders: completed.length,
      paidRevenue,
      completedRevenue,
      platformFees,
      sellerPayouts,
      availableSellerPayouts,
      heldSellerPayouts,
      payoutHoldDays: PAYOUT_HOLD_DAYS,
      disputedCount,
      cancelledCount,
      disputeRate: orders.length ? Math.round((disputedCount / orders.length) * 100) : 0,
      refundRate: orders.length ? Math.round((cancelledCount / orders.length) * 100) : 0,
      statusCounts,
      topSellers,
      topCategories,
      revenueByDay,
    }});
  } catch (err) { next(err); }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const allowed = ["pending_payment", "in_progress", "submitted", "revision_requested", "completed", "cancelled", "disputed"];
    if (!allowed.includes(req.body.status))
      return next(createError(400, "Invalid order status"));
    const before = await Order.findById(req.params.id);
    if (!before) return next(createError(404, "Order not found"));
    const wasCompleted = before.isCompleted;
    before.status = req.body.status;
    before.isCompleted = req.body.status === "completed";
    if (req.body.status === "completed" && !before.completedAt) before.completedAt = new Date();
    if (req.body.status === "completed" && !before.payoutAvailableAt)
      before.payoutAvailableAt = getPayoutAvailableAt(before.completedAt);
    if (req.body.status !== "completed") before.payoutAvailableAt = null;
    if (req.body.status === "cancelled") before.paymentStatus = "cancelled";
    before.adminNote = req.body.adminNote || before.adminNote || "";
    before.timeline.push({
      type: "admin_update",
      title: `Admin chuyển trạng thái: ${req.body.status}`,
      note: req.body.adminNote || "",
      actor: req.user.id,
    });
    const order = await before.save();
    if (req.body.status === "completed" && !wasCompleted)
      await User.findByIdAndUpdate(order.seller, { $inc: { totalEarned: order.sellerAmount || order.price } });
    if (req.body.status !== "completed" && wasCompleted)
      await User.findByIdAndUpdate(order.seller, { $inc: { totalEarned: -(order.sellerAmount || order.price) } });
    res.status(200).json({ success: true, data: order });
  } catch (err) { next(err); }
};

exports.getWithdrawals = async (req, res, next) => {
  try {
    const withdrawals = await Withdrawal.find(req.query.status ? { status: req.query.status } : {})
      .sort({ createdAt: -1 })
      .populate("seller", "username email");
    res.status(200).json({ success: true, data: withdrawals });
  } catch (err) { next(err); }
};

exports.updateWithdrawal = async (req, res, next) => {
  try {
    const allowed = ["pending", "approved", "rejected", "paid"];
    if (!allowed.includes(req.body.status)) return next(createError(400, "Invalid withdrawal status"));
    const withdrawal = await Withdrawal.findByIdAndUpdate(req.params.id, {
      status: req.body.status,
      adminNote: req.body.adminNote || "",
      paidAt: req.body.status === "paid" ? new Date() : null,
    }, { new: true });
    if (!withdrawal) return next(createError(404, "Withdrawal not found"));
    res.status(200).json({ success: true, data: withdrawal });
  } catch (err) { next(err); }
};

exports.createRefund = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return next(createError(404, "Order not found"));
    if (order.paymentStatus !== "paid") return next(createError(400, "Only paid orders can be refunded"));
    const amount = Number(req.body.amount || order.price);
    if (amount <= 0 || amount > order.price) return next(createError(400, "Invalid refund amount"));
    if (!String(req.body.reason || order.adminNote || "").trim()) return next(createError(400, "Refund reason is required"));
    const existing = await Refund.findOne({ order: order._id, status: { $in: ["pending", "approved", "paid"] } });
    if (existing) return next(createError(400, "This order already has an active refund"));
    const refund = await Refund.create({
      order: order._id,
      buyer: order.buyer,
      seller: order.seller,
      requestedBy: req.user.id,
      amount,
      refundType: amount === order.price ? "full" : "partial",
      reason: req.body.reason || order.adminNote || "",
      evidenceFiles: Array.isArray(req.body.evidenceFiles) ? req.body.evidenceFiles : [],
    });
    order.status = "disputed";
    order.disputeReason = refund.reason;
    order.disputeFiles = Array.isArray(req.body.evidenceFiles) ? req.body.evidenceFiles : [];
    order.payoutAvailableAt = null;
    order.timeline.push({
      type: "refund_created",
      title: "Admin tạo yêu cầu hoàn tiền",
      note: refund.reason,
      actor: req.user.id,
    });
    await order.save();
    res.status(201).json({ success: true, data: refund });
  } catch (err) { next(err); }
};

exports.getRefunds = async (req, res, next) => {
  try {
    const refunds = await Refund.find(req.query.status ? { status: req.query.status } : {})
      .sort({ createdAt: -1 })
      .populate("order", "paymentCode price status paymentStatus sepayTransactionId paidAt")
      .populate("buyer", "username email")
      .populate("seller", "username email");
    res.status(200).json({ success: true, data: refunds });
  } catch (err) { next(err); }
};

exports.updateRefund = async (req, res, next) => {
  try {
    const allowed = ["pending", "approved", "rejected", "paid"];
    if (!allowed.includes(req.body.status)) return next(createError(400, "Invalid refund status"));
    const refund = await Refund.findById(req.params.id);
    if (!refund) return next(createError(404, "Refund not found"));
    refund.status = req.body.status;
    refund.adminNote = req.body.adminNote || "";
    refund.paidAt = req.body.status === "paid" ? new Date() : null;
    await refund.save();
    if (req.body.status === "paid") {
      const order = await Order.findById(refund.order);
      if (order) {
        if (refund.refundType === "full" || refund.amount >= order.price) {
          order.status = "cancelled";
          order.paymentStatus = "cancelled";
          order.isCompleted = false;
          order.payoutAvailableAt = null;
        } else {
          const remainingSellerAmount = Math.max((order.sellerAmount || order.price) - refund.amount, 0);
          order.status = "completed";
          order.isCompleted = true;
          order.completedAt = order.completedAt || new Date();
          order.sellerAmount = remainingSellerAmount;
          order.payoutAvailableAt = getPayoutAvailableAt(order.completedAt);
        }
        order.timeline.push({
          type: "refund_paid",
          title: refund.refundType === "full" ? "Admin đã hoàn tiền toàn phần" : "Admin đã hoàn tiền một phần",
          note: req.body.adminNote || refund.adminNote || "",
          actor: req.user.id,
        });
        await order.save();
      }
    }
    if (req.body.status === "rejected") {
      const order = await Order.findById(refund.order);
      if (order && order.status === "disputed") {
        order.status = order.deliveryFiles?.length ? "submitted" : "in_progress";
        order.timeline.push({
          type: "refund_rejected",
          title: "Admin từ chối yêu cầu hoàn tiền",
          note: req.body.adminNote || "",
          actor: req.user.id,
        });
        await order.save();
      }
    }
    res.status(200).json({ success: true, data: refund });
  } catch (err) { next(err); }
};
