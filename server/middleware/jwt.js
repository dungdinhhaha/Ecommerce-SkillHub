const jwt = require("jsonwebtoken");
const createError = require("../utils/createError");
const User = require("../models/user.model");

const isAuth = (req, res, next) => {
  const authorization = req.get("authorization") || "";
  const bearerToken = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;
  const token = bearerToken || req.cookies.token;
  if (!token)
    return next(
      createError(401, "You are not authorized to access this route")
    );
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err)
      return next(
        createError(401, "You are not authorized to access this route")
      );
    const user = await User.findById(decoded.id).select("accountStatus isSeller isAdmin");
    if (!user || user.accountStatus === "blocked")
      return next(createError(403, "Tài khoản đã bị khóa bởi quản trị viên"));
    decoded.isSeller = user.isSeller;
    decoded.isAdmin = user.isAdmin;
    req.user = decoded;
    next();
  });
};

module.exports = isAuth;
