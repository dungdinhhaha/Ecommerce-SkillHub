const router = require("express").Router();
const isAuth = require("../middleware/jwt");
const { getMyVouchers, createMyVoucher, updateMyVoucher } = require("../controllers/voucher.controller");

router.get("/", isAuth, getMyVouchers);
router.post("/", isAuth, createMyVoucher);
router.patch("/:id", isAuth, updateMyVoucher);

module.exports = router;
