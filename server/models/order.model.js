const mongoose = require("mongoose");

const OrderModel = new mongoose.Schema(
  {
    gig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gig",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    paymentCode: {
      type: String,
      required: true,
      unique: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "expired", "cancelled"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["pending_payment", "in_progress", "submitted", "revision_requested", "completed", "cancelled", "disputed"],
      default: "pending_payment",
    },
    deliveryNote: { type: String, default: "" },
    deliveryFiles: { type: [String], default: [] },
    buyerNote: { type: String, default: "" },
    revisionFiles: { type: [String], default: [] },
    revisionCount: { type: Number, default: 0 },
    disputeReason: { type: String, default: "" },
    disputeFiles: { type: [String], default: [] },
    adminNote: { type: String, default: "" },
    timeline: {
      type: [
        {
          type: { type: String, required: true },
          title: { type: String, required: true },
          note: { type: String, default: "" },
          files: { type: [String], default: [] },
          actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    deliveredAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    payoutAvailableAt: { type: Date, default: null },
    payoutReleasedAt: { type: Date, default: null },
    sepayTransactionId: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    price:{
      type: Number,
      required: true,
    },
    originalPrice: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    voucherCode: { type: String, default: "" },
    discountFundedBy: { type: String, enum: ["none", "platform", "seller"], default: "none" },
    platformSubsidy: { type: Number, default: 0 },
    sellerDiscount: { type: Number, default: 0 },
    platformFeeRate: { type: Number, default: 0.1 },
    platformFee: { type: Number, default: 0 },
    sellerAmount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", OrderModel);
