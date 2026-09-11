const Order = require("../models/order.model");
const Withdrawal = require("../models/withdrawal.model");
const createError = require("../utils/createError");

const PAYOUT_HOLD_DAYS = Number(process.env.PAYOUT_HOLD_DAYS || 10);
const HOLD_MS = PAYOUT_HOLD_DAYS * 24 * 60 * 60 * 1000;
const moneyForSeller = (order) => order.sellerAmount || order.price || 0;
const payoutDateFor = (order) => {
  if (order.payoutAvailableAt) return new Date(order.payoutAvailableAt);
  const completedAt = order.completedAt || order.updatedAt || order.createdAt;
  return new Date(new Date(completedAt).getTime() + HOLD_MS);
};
const isPayoutAvailable = (order, now = new Date()) =>
  order.status === "completed" && order.paymentStatus === "paid" && payoutDateFor(order) <= now;

exports.getWallet = async (req, res, next) => {
  try {
    if (!req.user.isSeller) return next(createError(403, "Only sellers can view wallet"));
    const orders = await Order.find({ seller: req.user.id, paymentStatus: "paid" })
      .sort({ paidAt: -1, createdAt: -1 })
      .populate("gig", "title cover");
    const withdrawals = await Withdrawal.find({ seller: req.user.id }).sort({ createdAt: -1 });
    const now = new Date();
    const availableOrders = orders.filter((order) => isPayoutAvailable(order, now));
    const heldOrders = orders.filter((order) => order.status === "completed" && !isPayoutAvailable(order, now));
    const pending = orders.filter((order) => ["in_progress", "submitted", "revision_requested", "disputed"].includes(order.status));
    const available = availableOrders.reduce((sum, order) => sum + moneyForSeller(order), 0)
      - withdrawals.filter((item) => ["pending", "approved", "paid"].includes(item.status)).reduce((sum, item) => sum + item.amount, 0);
    const pendingBalance = pending.reduce((sum, order) => sum + moneyForSeller(order), 0);
    const heldBalance = heldOrders.reduce((sum, order) => sum + moneyForSeller(order), 0);
    res.status(200).json({ success: true, data: {
      available: Math.max(available, 0),
      pendingBalance,
      heldBalance,
      holdDays: PAYOUT_HOLD_DAYS,
      heldOrders: heldOrders.map((order) => ({
        _id: order._id,
        paymentCode: order.paymentCode,
        amount: moneyForSeller(order),
        completedAt: order.completedAt,
        payoutAvailableAt: payoutDateFor(order),
        gig: order.gig,
      })),
      withdrawals,
    } });
  } catch (err) { next(err); }
};

exports.createWithdrawal = async (req, res, next) => {
  try {
    if (!req.user.isSeller) return next(createError(403, "Only sellers can withdraw"));
    const amount = Number(req.body.amount || 0);
    if (amount <= 0) return next(createError(400, "Invalid withdrawal amount"));
    const orders = await Order.find({ seller: req.user.id, status: "completed", paymentStatus: "paid" });
    const withdrawals = await Withdrawal.find({ seller: req.user.id, status: { $in: ["pending", "approved", "paid"] } });
    const available = orders.filter((order) => isPayoutAvailable(order)).reduce((sum, order) => sum + moneyForSeller(order), 0)
      - withdrawals.reduce((sum, item) => sum + item.amount, 0);
    if (amount > available) return next(createError(400, `Số dư khả dụng không đủ. Tiền đơn hoàn thành chỉ rút được sau ${PAYOUT_HOLD_DAYS} ngày.`));
    const withdrawal = await Withdrawal.create({
      seller: req.user.id,
      amount,
      bankName: req.body.bankName,
      bankAccount: req.body.bankAccount,
      accountName: req.body.accountName,
      note: req.body.note || "",
    });
    res.status(201).json({ success: true, data: withdrawal });
  } catch (err) { next(err); }
};
