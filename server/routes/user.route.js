const router = require("express").Router();

const { getUser, deleteUser, updateMe } = require("../controllers/user.controller");
const isAuth = require("../middleware/jwt");

router.patch("/me", isAuth, updateMe);
router.route("/:id").get(getUser).delete(isAuth, deleteUser);

module.exports = router;
