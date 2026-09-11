const router = require("express").Router();
const { getWishlist, toggleWishlist } = require("../controllers/wishlist.controller");
const isAuth = require("../middleware/jwt");

router.get("/", isAuth, getWishlist);
router.post("/:gigId", isAuth, toggleWishlist);

module.exports = router;
