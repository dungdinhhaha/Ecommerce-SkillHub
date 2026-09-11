const Conversation = require("../models/conversation.model");
const createError = require("../utils/createError");

exports.createConversation = async (req, res, next) => {
  const isSeller = req.user.isSeller;
  const to = req.body.to;
  const gigId = req.body.gigId || null;
  const from = req.user.id;
  const conversationId = isSeller ? from + to : to + from;

  const newConversation = new Conversation({
    // sellerId + buyerId = conversationId
    id: conversationId,
    sellerId: isSeller ? from : to,
    buyerId: isSeller ? to : from,
    gigId,
    readBySeller: isSeller ? true : false,
    readByBuyer: isSeller ? false : true,
  });

  try {
    const existing = await Conversation.findOne({ id: conversationId });
    if (existing) {
      if (gigId) {
        existing.gigId = gigId;
        await existing.save();
      }
      await existing.populate("gigId", "title cover price listingType shortDesc");
      return res.status(200).json({
        success: true,
        data: existing,
      });
    }
    const conversation = await (await newConversation.save()).populate("gigId", "title cover price listingType shortDesc");
    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (err) {
    next(err);
  }
};

exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find(
      req.user.isSeller ? { sellerId: req.user.id } : { buyerId: req.user.id }
    )
      .populate("sellerId", "username isSeller")
      .populate("buyerId", "username isSeller")
      .populate("gigId", "title cover price listingType shortDesc");
    res.status(200).json({ success: true, data: conversations });
  } catch (err) {
    next(err);
  }
};

exports.getConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({ id: req.params.id })
      .populate("sellerId", "username isSeller img")
      .populate("buyerId", "username isSeller img")
      .populate("gigId", "title cover price listingType shortDesc");
    if (!conversation || conversation?.length == 0)
      return next(createError(404, "Conversation not found"));
    res.status(200).json({ success: true, data: conversation });
  } catch (err) {
    next(err);
  }
};

exports.updateConversation = async (req, res, next) => {
  try {
    const isSeller = req.user.isSeller;
    const conversation = await Conversation.findOneAndUpdate(
      { id: req.params.id },
      {
        // seller reads buyer's message and vice versa
        ...(isSeller ? { readBySeller: true } : { readByBuyer: true }),
      },
      { new: true }
    );
    res.status(200).json({ success: true, data: conversation });
  } catch (err) {
    next(err);
  }
};
