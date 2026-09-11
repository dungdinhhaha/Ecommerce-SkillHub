const router = require("express").Router();
const {
  getListingsForReview,
  getProducts,
  reviewListing,
  getUsers,
  updateUser,
  getCategoriesAdmin,
  createCategoryAdmin,
  updateCategoryAdmin,
  getDisputes,
  getOrders,
  updateOrderStatus,
  getDashboard,
  getWithdrawals,
  updateWithdrawal,
  createRefund,
  getRefunds,
  updateRefund,
  getVouchers,
  createVoucher,
  updateVoucher,
} = require("../controllers/admin.controller");
const isAuth = require("../middleware/jwt");
const isAdmin = require("../middleware/admin");

router.use(isAuth, isAdmin);
router.get("/listings", getListingsForReview);
router.patch("/listings/:id", reviewListing);
router.get("/products", getProducts);
router.patch("/users/:id", updateUser);
router.get("/users", getUsers);
router.get("/categories", getCategoriesAdmin);
router.post("/categories", createCategoryAdmin);
router.patch("/categories/:id", updateCategoryAdmin);
router.get("/vouchers", getVouchers);
router.post("/vouchers", createVoucher);
router.patch("/vouchers/:id", updateVoucher);
router.get("/disputes", getDisputes);
router.get("/dashboard", getDashboard);
router.get("/orders", getOrders);
router.patch("/orders/:id", updateOrderStatus);
router.post("/orders/:orderId/refunds", createRefund);
router.get("/withdrawals", getWithdrawals);
router.patch("/withdrawals/:id", updateWithdrawal);
router.get("/refunds", getRefunds);
router.patch("/refunds/:id", updateRefund);

module.exports = router;
