const Review = require("../models/review.model");
const Gig = require("../models/gig.model");
const Order = require("../models/order.model");
const createError = require("../utils/createError");

exports.getReviews = async (req, res, next) => {
  const { id } = req.params;

  try {
    const reviews = await Review.find({ gig: id }).populate(
      "user",
      "username img country"
    );
    return res.status(200).json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
};

exports.postReview = async (req, res, next) => {
  const { id } = req.params;
  const { star, desc, orderId } = req.body;

  try {
    const gig = await Gig.findById(id);
    if (!gig) return next(createError(404, "Gig not found"));
    if (gig.userId.toString() === req.user.id)
      return next(createError(400, "You can't review your own gig"));

    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        gig: id,
        buyer: req.user.id,
        status: "completed",
      });
      if (!order) return next(createError(400, "Only completed orders can be reviewed"));
      const existing = await Review.findOne({ order: orderId });
      if (existing) return next(createError(400, "This order has already been reviewed"));
    }

    const review = await Review.create({
      gig: id,
      user: req.user.id,
      order: orderId || undefined,
      star,
      desc,
    });
    await Gig.findByIdAndUpdate(id, {
      $inc: { totalStars: Number(star), starNumber: 1 },
    });
    return res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
};
