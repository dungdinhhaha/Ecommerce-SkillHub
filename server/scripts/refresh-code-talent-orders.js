require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user.model");
const Gig = require("../models/gig.model");
const Order = require("../models/order.model");

const productFile = "https://res.cloudinary.com/ov2xvpak/image/upload/v1788597883/check.png";

const products = [
  ["Landing page giới thiệu startup React", "skill_service", "web", 450000, "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80"],
  ["Source code quản lý kho mini", "digital_product", "web", 119000, "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80"],
  ["API đặt lịch tư vấn Node.js", "skill_service", "web", 520000, "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80"],
  ["Template blog cá nhân developer", "digital_product", "web", 89000, "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80"],
  ["Sửa responsive website trên mobile", "skill_service", "web", 220000, "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?auto=format&fit=crop&w=1200&q=80"],
  ["Dashboard thống kê doanh thu React", "digital_product", "web", 129000, "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=80"],
];

async function run() {
  await mongoose.connect(process.env.DB_URI);
  const codeTalent = await User.findOne({ username: "code_talent" });
  if (!codeTalent) throw new Error("Không thấy code_talent");

  const orders = await Order.find({ seller: codeTalent._id }).sort({ createdAt: -1 }).limit(products.length);
  for (let index = 0; index < orders.length; index += 1) {
    const [title, listingType, cat, price, cover] = products[index];
    const isDigital = listingType === "digital_product";
    const gig = await Gig.findOneAndUpdate(
      { title, userId: codeTalent._id },
      {
        title,
        shortTitle: title.slice(0, 34),
        shortDesc: isDigital ? "Tải source/template ngay sau thanh toán." : "Talent xử lý theo yêu cầu, có cập nhật tiến độ.",
        description: `${title} dành cho buyer cần sản phẩm rõ ràng, dễ dùng và bàn giao đúng phạm vi.`,
        listingType,
        cat,
        price,
        cover,
        images: [cover],
        deliveryTime: isDigital ? 0 : 3,
        revisionNumber: isDigital ? 0 : 2,
        features: isDigital ? ["Source sạch", "Có hướng dẫn", "Tải sau thanh toán"] : ["Trao đổi yêu cầu", "Bàn giao đúng hạn", "Có chỉnh sửa"],
        digitalFileUrl: isDigital ? productFile : "",
        digitalFileName: isDigital ? `${title.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.png` : "",
        approvalStatus: "approved",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    orders[index].gig = gig._id;
    orders[index].originalPrice = price;
    orders[index].price = Math.max(11000, Math.round(price * 0.92));
    orders[index].sellerAmount = Math.max(9000, Math.round(orders[index].price * 0.9));
    await orders[index].save();
  }

  console.log(`Updated ${orders.length} code_talent orders.`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
