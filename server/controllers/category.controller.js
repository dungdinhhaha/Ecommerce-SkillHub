const Category = require("../models/category.model");
const Gig = require("../models/gig.model");
const createError = require("../utils/createError");

const fallbackCategories = [
  { name: "Lập trình", slug: "web", description: "Website, API, source code", sortOrder: 1 },
  { name: "Thiết kế", slug: "design", description: "Logo, poster, PowerPoint, UI/UX", sortOrder: 2 },
  { name: "Content", slug: "writing", description: "Bài viết, SEO, mô tả sản phẩm", sortOrder: 3 },
  { name: "Media", slug: "video", description: "Edit video, thumbnail, chỉnh ảnh", sortOrder: 4 },
  { name: "Học tập", slug: "education", description: "Ebook, tài liệu, template báo cáo", sortOrder: 5 },
];

exports.getCategories = async (req, res, next) => {
  try {
    let categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    if (!categories.length) {
      await Category.insertMany(fallbackCategories, { ordered: false }).catch(() => {});
      categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    }
    const counts = await Gig.aggregate([
      { $match: { approvalStatus: "approved" } },
      { $group: { _id: "$cat", count: { $sum: 1 } } },
    ]);
    const countMap = counts.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {});
    res.status(200).json({ success: true, data: categories.map((cat) => ({ ...cat.toObject(), count: countMap[cat.slug] || 0 })) });
  } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (err) { next(err); }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return next(createError(404, "Category not found"));
    res.status(200).json({ success: true, data: category });
  } catch (err) { next(err); }
};
