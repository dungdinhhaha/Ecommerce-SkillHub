const router = require("express").Router();

const { register, login, logout, forgotPassword, resetPassword, changePassword } = require("../controllers/auth.controller");
const isAuth = require("../middleware/jwt");

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);
router.patch("/change-password", isAuth, changePassword);
router.post("/logout", logout);

module.exports = router;
