const createError = require("../utils/createError");

const isAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) return next(createError(403, "Admin access required"));
  next();
};

module.exports = isAdmin;
