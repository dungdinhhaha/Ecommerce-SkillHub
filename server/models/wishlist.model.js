const mongoose = require("mongoose");

const WishlistModel = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    gig: { type: mongoose.Schema.Types.ObjectId, ref: "Gig", required: true },
  },
  { timestamps: true }
);

WishlistModel.index({ user: 1, gig: 1 }, { unique: true });

module.exports = mongoose.model("Wishlist", WishlistModel);
