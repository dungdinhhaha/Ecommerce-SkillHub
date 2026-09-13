const Order = require("../models/order.model");
const Gig = require("../models/gig.model");
const User = require("../models/user.model");
const Refund = require("../models/refund.model");
const Voucher = require("../models/voucher.model");
const createError = require("../utils/createError");
const crypto = require("crypto");
const { v2: cloudinary } = require("cloudinary");
const { hasBlockedContact } = require("../utils/contentGuard");

const getPaymentCode = () => `DH${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
const pendingPaymentLocks = new Map();
const PAYOUT_HOLD_DAYS = Number(process.env.PAYOUT_HOLD_DAYS || 10);
const getPayoutAvailableAt = (date = new Date()) =>
  new Date(new Date(date).getTime() + PAYOUT_HOLD_DAYS * 24 * 60 * 60 * 1000);

const extractPaymentCode = (payload = {}) => {
  const values = [
    payload.code,
    payload.paymentCode,
    payload.payment_code,
    payload.gatewayCode,
    payload.gateway_code,
    payload.transactionCode,
    payload.transaction_code,
    payload.content,
    payload.description,
    payload.transferDescription,
    payload.transfer_description,
    payload.transactionContent,
    payload.transaction_content,
    payload.memo,
  ];
  const joined = values.filter(Boolean).map(String).join(" ").toUpperCase();
  return joined.match(/DH[A-Z0-9]{8,}/)?.[0] || "";
};

const extractTransferAmount = (payload = {}) => {
  const rawValue = payload.transferAmount || payload.transfer_amount || payload.amount || payload.money || payload.value || 0;
  if (typeof rawValue === "number") return rawValue;
  return Number(String(rawValue).replace(/[^\d]/g, ""));
};

const isIncomingTransfer = (payload = {}) => {
  const value = String(payload.transferType || payload.transfer_type || payload.type || "").toLowerCase();
  return !value || ["in", "income", "credit", "deposit"].includes(value) || value.includes("vao") || value.includes("vào");
};

const hasValidSepayKey = (req) => {
  const expectedKey = process.env.SEPAY_API_KEY;
  if (!expectedKey) return true;
  const authorization = req.get("authorization") || "";
  const apiKey = req.get("x-api-key") || req.get("apikey") || req.get("api-key") || "";
  const allowUnsigned = process.env.SEPAY_ALLOW_UNSIGNED_WEBHOOK !== "false" && process.env.NODE_ENV !== "production";
  if (allowUnsigned && !authorization && !apiKey) return true;
  return authorization === `Apikey ${expectedKey}` ||
    authorization === `Bearer ${expectedKey}` ||
    authorization === expectedKey ||
    apiKey === expectedKey;
};

const addTimeline = (order, item) => {
  order.timeline.push({
    type: item.type,
    title: item.title,
    note: item.note || "",
    files: item.files || [],
    actor: item.actor || null,
    createdAt: new Date(),
  });
};

const buildQrUrl = (amount, code) => {
  const params = new URLSearchParams({
    acc: process.env.SEPAY_BANK_ACCOUNT,
    bank: process.env.SEPAY_BANK_CODE,
    amount: String(Math.round(amount)),
    des: code,
  });
  return `https://vietqr.app/img?${params.toString()}`;
};

const getFeeParts = (price) => {
  const rate = Number(process.env.PLATFORM_FEE_RATE || 0.1);
  const platformFee = Math.round(Number(price) * rate);
  return {
    platformFeeRate: rate,
    platformFee,
    sellerAmount: Number(price) - platformFee,
  };
};

const getVoucherDiscount = async (code, originalPrice, sellerId) => {
  const normalizedCode = String(code || "").trim().toUpperCase();
  if (!normalizedCode) return { voucherCode: "", discountAmount: 0, finalPrice: Number(originalPrice), discountFundedBy: "none", voucher: null };
  const voucher = await Voucher.findOne({ code: normalizedCode, isActive: true });
  if (!voucher) throw createError(400, "Mã voucher không tồn tại hoặc đã tắt");
  if (voucher.ownerType === "seller" && String(voucher.seller) !== String(sellerId))
    throw createError(400, "Voucher này không áp dụng cho talent của listing này");
  if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date())
    throw createError(400, "Mã voucher đã hết hạn");
  if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit)
    throw createError(400, "Mã voucher đã hết lượt sử dụng");
  if (Number(originalPrice) < Number(voucher.minOrderValue || 0))
    throw createError(400, `Đơn cần tối thiểu ${Number(voucher.minOrderValue).toLocaleString("vi-VN")} VND để dùng voucher`);
  let discountAmount = voucher.discountType === "percent"
    ? Math.round(Number(originalPrice) * Number(voucher.discountValue) / 100)
    : Math.round(Number(voucher.discountValue));
  if (voucher.maxDiscount) discountAmount = Math.min(discountAmount, Number(voucher.maxDiscount));
  if (voucher.ownerType === "seller")
    discountAmount = Math.min(discountAmount, Math.round(Number(originalPrice) * 0.3));
  discountAmount = Math.max(0, Math.min(discountAmount, Number(originalPrice) - 1000));
  return {
    voucherCode: voucher.code,
    discountAmount,
    finalPrice: Number(originalPrice) - discountAmount,
    discountFundedBy: voucher.discountFundedBy || voucher.ownerType || "platform",
    voucher,
  };
};

const getOrderMoneyParts = (originalPrice, voucherParts) => {
  const finalPrice = voucherParts.finalPrice;
  const feeBase = voucherParts.discountFundedBy === "platform" ? originalPrice : finalPrice;
  const feeParts = getFeeParts(feeBase);
  return {
    originalPrice,
    price: finalPrice,
    discountAmount: voucherParts.discountAmount,
    voucherCode: voucherParts.voucherCode,
    discountFundedBy: voucherParts.discountFundedBy,
    platformSubsidy: voucherParts.discountFundedBy === "platform" ? voucherParts.discountAmount : 0,
    sellerDiscount: voucherParts.discountFundedBy === "seller" ? voucherParts.discountAmount : 0,
    platformFeeRate: feeParts.platformFeeRate,
    platformFee: feeParts.platformFee,
    sellerAmount: feeBase - feeParts.platformFee,
  };
};

const getCloudinaryDownloadUrl = (url) => {
  if (!url || !process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return url;
  }
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    const publicId = url.split("/upload/")[1]?.replace(/^v\d+\//, "")?.replace(/\.[^.]+$/, "");
    if (!publicId) return url;
    return cloudinary.url(publicId, {
      sign_url: true,
      secure: true,
      resource_type: "auto",
      type: "upload",
    });
  } catch (err) {
    return url;
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const baseFilter = {
      ...(req.user.isSeller ? { seller: req.user.id } : { buyer: req.user.id }),
      paymentStatus: "paid",
    };
    const q = String(req.query.q || "").trim();
    if (q) {
      const [users, gigs] = await Promise.all([
        User.find({
          $or: [
            { username: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
          ],
        }).select("_id"),
        Gig.find({
          $or: [
            { title: { $regex: q, $options: "i" } },
            { shortTitle: { $regex: q, $options: "i" } },
          ],
        }).select("_id"),
      ]);
      const userIds = users.map((user) => user._id);
      const gigIds = gigs.map((gig) => gig._id);
      const searchOr = [
        { paymentCode: { $regex: q, $options: "i" } },
        { sepayTransactionId: { $regex: q, $options: "i" } },
      ];
      if (/^[a-f\d]{24}$/i.test(q)) searchOr.push({ _id: q }, { buyer: q }, { seller: q }, { gig: q });
      if (userIds.length) searchOr.push({ buyer: { $in: userIds } }, { seller: { $in: userIds } });
      if (gigIds.length) searchOr.push({ gig: { $in: gigIds } });
      baseFilter.$or = searchOr;
    }
    const orders = await Order.find(baseFilter)
      .sort({ paidAt: -1, createdAt: -1 })
      .populate("gig")
      .populate("seller", "username email country img")
      .populate("buyer", "username email country img");
    return res.status(200).json({
      status: "success",
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

exports.createPayment = async (req, res, next) => {
  const { id } = req.params;
  const requestedVoucherCode = String(req.body?.voucherCode || "").trim().toUpperCase();
  const lockKey = `${id}:${req.user.id}:${requestedVoucherCode}`;
  const sendPayment = (res, order, status = 200) => res.status(status).json({ success: true, data: {
    orderId: order._id,
    code: order.paymentCode,
    amount: order.price,
    originalPrice: order.originalPrice || order.price,
    discountAmount: order.discountAmount || 0,
    voucherCode: order.voucherCode || "",
    discountFundedBy: order.discountFundedBy || "none",
    platformSubsidy: order.platformSubsidy || 0,
    sellerDiscount: order.sellerDiscount || 0,
    platformFee: order.platformFee || 0,
    sellerAmount: order.sellerAmount || 0,
    qrUrl: buildQrUrl(order.price, order.paymentCode),
    status: order.paymentStatus,
    reused: status === 200,
  }});
  try {
    if (pendingPaymentLocks.has(lockKey)) {
      const locked = await pendingPaymentLocks.get(lockKey);
      return sendPayment(res, locked);
    }

    const createOrderPromise = (async () => {
      const gig = await Gig.findById(id);
      if (!gig) throw createError(404, "Gig not found");
      if (gig.userId.toString() === req.user.id)
        throw createError(400, "You can't buy your own gig");
      const existing = await Order.findOne({
        gig: gig._id,
        buyer: req.user.id,
        paymentStatus: "pending",
      });
      if (existing) {
        const moneyParts = getOrderMoneyParts(gig.price, await getVoucherDiscount(requestedVoucherCode, gig.price, gig.userId));
        Object.assign(existing, moneyParts);
        return existing.save();
      }
      const paymentCode = getPaymentCode();
      const voucherParts = await getVoucherDiscount(requestedVoucherCode, gig.price, gig.userId);
      const moneyParts = getOrderMoneyParts(gig.price, voucherParts);
      return Order.create({
        gig: gig._id,
        seller: gig.userId,
        buyer: req.user.id,
        ...moneyParts,
        paymentCode,
        timeline: [{
          type: "created",
          title: "Đơn hàng được tạo",
          note: voucherParts.voucherCode ? `Mã thanh toán: ${paymentCode}. Đã áp voucher ${voucherParts.voucherCode}` : `Mã thanh toán: ${paymentCode}`,
          actor: req.user.id,
        }],
      });
    })();
    pendingPaymentLocks.set(lockKey, createOrderPromise);
    const order = await createOrderPromise;
    pendingPaymentLocks.delete(lockKey);
    return sendPayment(res, order, order.createdAt && Date.now() - new Date(order.createdAt).getTime() < 3000 ? 201 : 200);
  } catch (err) {
    pendingPaymentLocks.delete(lockKey);
    next(err);
  }
};

exports.getOrderDetail = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      paymentStatus: "paid",
      $or: [{ buyer: req.user.id }, { seller: req.user.id }],
    })
      .populate("gig")
      .populate("seller", "username country img email")
      .populate("buyer", "username country img email");
    if (!order) return next(createError(404, "Order not found"));
    res.status(200).json({ success: true, data: order });
  } catch (err) { next(err); }
};

exports.getOrderDashboard = async (req, res, next) => {
  try {
    const orders = await Order.find({
      ...(req.user.isSeller ? { seller: req.user.id } : { buyer: req.user.id }),
      paymentStatus: "paid",
    }).populate("gig", "title cover listingType");
    const stats = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      acc.total += 1;
      acc.value += order.price || 0;
      return acc;
    }, { total: 0, value: 0 });
    res.status(200).json({ success: true, data: {
      stats,
      recentOrders: orders.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5),
    } });
  } catch (err) { next(err); }
};

exports.getPaymentStatus = async (req, res, next) => {
  try {
    const order = await Order.findOne({ paymentCode: req.params.code, buyer: req.user.id })
      .select("paymentStatus paymentCode price");
    if (!order) return next(createError(404, "Order not found"));
    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

exports.handleSepayWebhook = async (req, res, next) => {
  try {
    if (!hasValidSepayKey(req)) {
      console.log("[sepay:webhook] rejected invalid key");
      return res.status(401).json({ success: false, message: "Invalid webhook key" });
    }
    const payload = req.body || {};
    const code = extractPaymentCode(payload);
    const amount = extractTransferAmount(payload);
    const transactionId = String(payload.id || payload.referenceCode || payload.reference_code || payload.transaction_id || payload.transactionId || "");
    console.log("[sepay:webhook]", { code, amount, transactionId, keys: Object.keys(payload) });
    if (!isIncomingTransfer(payload)) {
      return res.status(200).json({ success: true, ignored: true });
    }
    const order = await Order.findOne({ paymentCode: code });
    if (!order) return res.status(200).json({ success: true, ignored: true, reason: "order_not_found", code });
    if (order.paymentStatus === "paid") return res.status(200).json({ success: true });
    if (amount < order.price) {
      return res.status(400).json({ success: false, message: "Insufficient amount" });
    }
    order.paymentStatus = "paid";
    order.status = "in_progress";
    order.sepayTransactionId = transactionId;
    order.paidAt = new Date();
    addTimeline(order, {
      type: "paid",
      title: "Thanh toán thành công",
      note: transactionId ? `Mã giao dịch SePay: ${transactionId}` : "",
    });
    await order.save();
    if (order.voucherCode) {
      await Voucher.findOneAndUpdate({ code: order.voucherCode }, { $inc: { usedCount: 1 } });
    }
    await Order.updateMany(
      {
        _id: { $ne: order._id },
        gig: order.gig,
        buyer: order.buyer,
        paymentStatus: "pending",
      },
      {
        paymentStatus: "cancelled",
        status: "cancelled",
      }
    );
    await Gig.findByIdAndUpdate(order.gig, { $inc: { sales: 1 } });
    return res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

const getOrderForUser = async (id, userId) =>
  Order.findById(id).populate("gig").populate("seller", "username img").populate("buyer", "username img");

exports.submitDelivery = async (req, res, next) => {
  try {
    const order = await getOrderForUser(req.params.orderId, req.user.id);
    if (!order) return next(createError(404, "Order not found"));
    if (order.seller._id.toString() !== req.user.id.toString())
      return next(createError(403, "Only the seller can submit delivery"));
    if (!["in_progress", "revision_requested"].includes(order.status))
      return next(createError(400, "This order is not ready for delivery"));
    if (hasBlockedContact(req.body.note))
      return next(createError(400, "Không được gửi số điện thoại, email hoặc link liên hệ ngoài nền tảng"));
    order.deliveryNote = req.body.note || "";
    order.deliveryFiles = Array.isArray(req.body.files) ? req.body.files : [];
    order.status = "submitted";
    order.deliveredAt = new Date();
    addTimeline(order, {
      type: "delivered",
      title: "Talent đã gửi kết quả",
      note: order.deliveryNote,
      files: order.deliveryFiles,
      actor: req.user.id,
    });
    await order.save();
    res.status(200).json({ success: true, data: order });
  } catch (err) { next(err); }
};

exports.requestRevision = async (req, res, next) => {
  try {
    const order = await getOrderForUser(req.params.orderId, req.user.id);
    if (!order) return next(createError(404, "Order not found"));
    if (order.buyer._id.toString() !== req.user.id.toString())
      return next(createError(403, "Only the buyer can request revisions"));
    if (order.status !== "submitted")
      return next(createError(400, "The order has no submitted delivery"));
    const maxRevisions = Number(order.gig?.revisionNumber || 0);
    if (order.revisionCount >= maxRevisions)
      return next(createError(400, "Đơn hàng đã hết số lần chỉnh sửa"));
    if (hasBlockedContact(req.body.note))
      return next(createError(400, "Không được gửi số điện thoại, email hoặc link liên hệ ngoài nền tảng"));
    order.buyerNote = req.body.note || "";
    order.revisionFiles = Array.isArray(req.body.files) ? req.body.files : [];
    order.revisionCount += 1;
    order.status = "revision_requested";
    addTimeline(order, {
      type: "revision_requested",
      title: `Người mua yêu cầu chỉnh sửa lần ${order.revisionCount}`,
      note: order.buyerNote,
      files: order.revisionFiles,
      actor: req.user.id,
    });
    await order.save();
    res.status(200).json({ success: true, data: order });
  } catch (err) { next(err); }
};

exports.requestRefund = async (req, res, next) => {
  try {
    const order = await getOrderForUser(req.params.orderId, req.user.id);
    if (!order) return next(createError(404, "Order not found"));
    if (order.buyer._id.toString() !== req.user.id.toString())
      return next(createError(403, "Only the buyer can request a refund"));
    if (order.paymentStatus !== "paid")
      return next(createError(400, "Only paid orders can be disputed"));
    if (["cancelled", "disputed"].includes(order.status))
      return next(createError(400, "This order already has a final or active dispute status"));

    const reason = String(req.body.reason || req.body.note || "").trim();
    const amount = Number(req.body.amount || order.price);
    if (!reason) return next(createError(400, "Vui lòng nhập lý do yêu cầu hoàn tiền"));
    if (amount <= 0 || amount > order.price)
      return next(createError(400, "Số tiền hoàn không hợp lệ"));

    const existing = await Refund.findOne({ order: order._id, status: { $in: ["pending", "approved", "paid"] } });
    if (existing) return next(createError(400, "Đơn này đã có yêu cầu hoàn tiền đang xử lý"));

    const evidenceFiles = Array.isArray(req.body.files) ? req.body.files : [];
    const refund = await Refund.create({
      order: order._id,
      buyer: order.buyer._id,
      seller: order.seller._id,
      requestedBy: req.user.id,
      amount,
      refundType: amount === order.price ? "full" : "partial",
      reason,
      evidenceFiles,
    });

    order.status = "disputed";
    order.disputeReason = reason;
    order.disputeFiles = evidenceFiles;
    order.payoutAvailableAt = null;
    addTimeline(order, {
      type: "refund_requested",
      title: amount === order.price ? "Người mua yêu cầu hoàn tiền toàn phần" : "Người mua yêu cầu hoàn tiền một phần",
      note: reason,
      files: evidenceFiles,
      actor: req.user.id,
    });
    await order.save();

    res.status(201).json({ success: true, data: { order, refund } });
  } catch (err) { next(err); }
};

exports.completeOrder = async (req, res, next) => {
  try {
    const order = await getOrderForUser(req.params.orderId, req.user.id);
    if (!order) return next(createError(404, "Order not found"));
    if (order.buyer._id.toString() !== req.user.id.toString())
      return next(createError(403, "Only the buyer can complete the order"));
    if (order.status !== "submitted")
      return next(createError(400, "The seller must submit delivery first"));
    order.status = "completed";
    order.isCompleted = true;
    order.completedAt = new Date();
    order.payoutAvailableAt = getPayoutAvailableAt(order.completedAt);
    addTimeline(order, {
      type: "completed",
      title: "Người mua xác nhận hoàn thành",
      note: `Tiền của talent sẽ khả dụng sau ${PAYOUT_HOLD_DAYS} ngày.`,
      actor: req.user.id,
    });
    await order.save();
    await User.findByIdAndUpdate(order.seller._id, { $inc: { totalEarned: order.sellerAmount || order.price } });
    res.status(200).json({ success: true, data: order });
  } catch (err) { next(err); }
};

exports.getSellerEarnings = async (req, res, next) => {
  try {
    if (!req.user.isSeller) return next(createError(403, "Only sellers can view earnings"));
    const orders = await Order.find({ seller: req.user.id, paymentStatus: "paid" })
      .sort({ createdAt: -1 })
      .populate("gig", "title cover listingType")
      .populate("buyer", "username img");
    const completedOrders = orders.filter((order) => order.status === "completed");
    const pendingOrders = orders.filter((order) => ["in_progress", "submitted", "revision_requested", "disputed"].includes(order.status));
    const now = new Date();
    const payoutDateFor = (order) => order.payoutAvailableAt || getPayoutAvailableAt(order.completedAt || order.updatedAt || order.createdAt);
    const heldOrders = completedOrders.filter((order) => new Date(payoutDateFor(order)) > now);
    const availableOrders = completedOrders.filter((order) => new Date(payoutDateFor(order)) <= now);
    const completedRevenue = completedOrders.reduce((sum, order) => sum + order.price, 0);
    const pendingRevenue = pendingOrders.reduce((sum, order) => sum + order.price, 0);
    const completedNetRevenue = completedOrders.reduce((sum, order) => sum + (order.sellerAmount || order.price), 0);
    const pendingNetRevenue = pendingOrders.reduce((sum, order) => sum + (order.sellerAmount || order.price), 0);
    const heldRevenue = heldOrders.reduce((sum, order) => sum + (order.sellerAmount || order.price), 0);
    const availableNetRevenue = availableOrders.reduce((sum, order) => sum + (order.sellerAmount || order.price), 0);
    const platformFees = completedOrders.reduce((sum, order) => sum + (order.platformFee || 0), 0);
    res.status(200).json({
      success: true,
      data: {
        completedRevenue,
        pendingRevenue,
        completedNetRevenue,
        availableNetRevenue,
        pendingNetRevenue,
        heldRevenue,
        holdDays: PAYOUT_HOLD_DAYS,
        platformFees,
        completedCount: completedOrders.length,
        pendingCount: pendingOrders.length,
        orders,
      },
    });
  } catch (err) { next(err); }
};

exports.downloadDigitalProduct = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, buyer: req.user.id, paymentStatus: "paid" }).populate("gig");
    if (!order) return next(createError(404, "Paid order not found"));
    if (order.gig.listingType !== "digital_product")
      return next(createError(400, "This order is not a digital product"));
    res.status(200).json({ success: true, data: { url: getCloudinaryDownloadUrl(order.gig.digitalFileUrl), fileName: order.gig.digitalFileName } });
  } catch (err) { next(err); }
};

exports.getDeliveryFile = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      paymentStatus: "paid",
      $or: [{ buyer: req.user.id }, { seller: req.user.id }],
    });
    if (!order) return next(createError(404, "Order not found"));
    const fileUrl = order.deliveryFiles[Number(req.params.index)];
    if (!fileUrl) return next(createError(404, "File not found"));
    res.status(200).json({ success: true, data: { url: getCloudinaryDownloadUrl(fileUrl) } });
  } catch (err) { next(err); }
};

exports.getPurchasedDigitalProducts = async (req, res, next) => {
  try {
    const orders = await Order.find({ buyer: req.user.id, paymentStatus: "paid" })
      .sort({ paidAt: -1, createdAt: -1 })
      .populate("gig", "title cover listingType digitalFileUrl digitalFileName userId")
      .populate("seller", "username img");
    const products = orders
      .filter((order) => order.gig?.listingType === "digital_product")
      .map((order) => ({
        orderId: order._id,
        paymentCode: order.paymentCode,
        paidAt: order.paidAt,
        price: order.price,
        seller: order.seller,
        gig: {
          _id: order.gig._id,
          title: order.gig.title,
          cover: order.gig.cover,
          fileName: order.gig.digitalFileName,
        },
      }));
    res.status(200).json({ success: true, data: products });
  } catch (err) { next(err); }
};
