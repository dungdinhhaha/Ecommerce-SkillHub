const router = require("express").Router({ mergeParams: true });

const {
  getOrders,
  getOrderDetail,
  getOrderDashboard,
  createPayment,
  getPaymentStatus,
  submitDelivery,
  requestRevision,
  requestRefund,
  completeOrder,
  downloadDigitalProduct,
  getSellerEarnings,
  getDeliveryFile,
  getPurchasedDigitalProducts,
} = require("../controllers/order.controller");
const isAuth = require("../middleware/jwt.js");

router.get("/", isAuth, getOrders);
router.get("/dashboard", isAuth, getOrderDashboard);
router.get("/earnings", isAuth, getSellerEarnings);
router.get("/digital-library", isAuth, getPurchasedDigitalProducts);
router.get("/:code/status", isAuth, getPaymentStatus);
router.get("/:orderId/detail", isAuth, getOrderDetail);
router.post("/", isAuth, createPayment);
router.post("/:orderId/delivery", isAuth, submitDelivery);
router.post("/:orderId/revision", isAuth, requestRevision);
router.post("/:orderId/refund", isAuth, requestRefund);
router.patch("/:orderId/complete", isAuth, completeOrder);
router.get("/:orderId/download", isAuth, downloadDigitalProduct);
router.get("/:orderId/delivery-files/:index", isAuth, getDeliveryFile);

module.exports = router;
