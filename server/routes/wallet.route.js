const router = require("express").Router();
const isAuth = require("../middleware/jwt");
const { getWallet, createWithdrawal } = require("../controllers/wallet.controller");

router.use(isAuth);
router.get("/", getWallet);
router.post("/withdrawals", createWithdrawal);

module.exports = router;
