const mongoose = require("mongoose");

const ConversationModel = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    readByBuyer: {
      type: Boolean,
      default: false,
    },
    readBySeller: {
      type: Boolean,
      default: false,
    },
    lastMessage: {
      type: String,
      default: "",
    },
    gigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gig",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Conversation", ConversationModel);
