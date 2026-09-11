const User = require("../models/user.model");
const createError = require("../utils/createError");

const sendToken = (user, res, statusCode) => {
  const token = user.getSignToken();
  user.password = undefined;
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    data: {
      token,
      user,
    },
  });
};

exports.register = async (req, res, next) => {
  try {
    if (!req.body.termsAccepted) {
      return next(createError(400, "Bạn cần đồng ý Điều khoản dịch vụ và Chính sách bảo mật để tạo tài khoản"));
    }
    const user = await User.create({
      ...req.body,
      legalConsent: {
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
        version: "2026-09",
      },
    });
    sendToken(user, res, 201);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const user = await User.findOne({ username: req.body.username });
  if (!user || !(await user.isPasswordMatch(req.body.password))) {
    return next(createError(401, "Invalid username or password"));
  }
  if (user.accountStatus === "blocked") {
    return next(createError(403, "Tài khoản đã bị khóa bởi quản trị viên"));
  }
  user.password = undefined;
  sendToken(user, res, 200);
};

exports.logout = async (req, res, next) => {
  return res
    .clearCookie("token", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    })
    .status(200)
    .json({ success: true, data: { message: "User has been logged out" } });
};
