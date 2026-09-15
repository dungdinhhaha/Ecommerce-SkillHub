const User = require("../models/user.model");
const createError = require("../utils/createError");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

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

const sendWelcomeEmail = async (user) => {
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
  const role = user.isAdmin ? "Quản trị viên" : user.isSeller ? "Talent" : "Buyer";
  const text = `Chào mừng bạn đến với SkillHub!\n\nThông tin tài khoản của bạn:\n- Tên đăng nhập: ${user.username}\n- Email: ${user.email}\n- Loại tài khoản: ${role}\n\nBạn có thể đăng nhập tại: ${clientUrl}/login\n\nLưu ý: SkillHub không gửi mật khẩu qua email để bảo vệ tài khoản của bạn. Nếu quên mật khẩu, hãy dùng chức năng Quên mật khẩu trên trang đăng nhập.`;

  await sendEmail({
    to: user.email,
    subject: "Chào mừng bạn đến với SkillHub",
    text,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2>Chào mừng bạn đến với SkillHub!</h2>
        <p>Tài khoản của bạn đã được tạo thành công. Mình gửi lại vài thông tin cơ bản để bạn dễ nhớ khi đăng nhập.</p>
        <div style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:16px;padding:14px 16px;margin:16px 0">
          <p><strong>Tên đăng nhập:</strong> ${user.username}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Loại tài khoản:</strong> ${role}</p>
        </div>
        <p><a href="${clientUrl}/login" style="display:inline-block;background:#1dbf73;color:white;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:700">Đăng nhập SkillHub</a></p>
        <p style="color:#64748b">SkillHub không gửi mật khẩu qua email để bảo vệ tài khoản của bạn. Nếu quên mật khẩu, hãy dùng chức năng Quên mật khẩu trên trang đăng nhập.</p>
      </div>
    `,
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
    sendWelcomeEmail(user).catch((err) => console.error("Welcome email error:", err.message || err));
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

exports.forgotPassword = async (req, res, next) => {
  try {
    const account = String(req.body.account || "").trim();
    if (!account) return next(createError(400, "Vui lòng nhập email hoặc tên đăng nhập"));

    const user = await User.findOne({
      $or: [
        { email: account.toLowerCase() },
        { username: account },
      ],
    });
    if (!user) return next(createError(404, "Không tìm thấy tài khoản với email hoặc tên đăng nhập này"));
    if (user.accountStatus === "blocked") return next(createError(403, "Tài khoản đã bị khóa bởi quản trị viên"));

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
    const message = `Bạn vừa yêu cầu đặt lại mật khẩu SkillHub.\n\nBấm vào link này trong 15 phút: ${resetUrl}\n\nNếu không phải bạn, hãy bỏ qua email này.`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Đặt lại mật khẩu SkillHub",
        text: message,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
            <h2>Đặt lại mật khẩu SkillHub</h2>
            <p>Bạn vừa yêu cầu đặt lại mật khẩu. Link này có hiệu lực trong <strong>15 phút</strong>.</p>
            <p><a href="${resetUrl}" style="display:inline-block;background:#1dbf73;color:white;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:700">Đặt lại mật khẩu</a></p>
            <p>Nếu nút không hoạt động, copy link này:</p>
            <p style="word-break:break-all">${resetUrl}</p>
            <p>Nếu không phải bạn, hãy bỏ qua email này.</p>
          </div>
        `,
      });

      res.status(200).json({ success: true, data: { message: `Đã gửi link đặt lại mật khẩu tới ${user.email}` } });
    } catch (mailError) {
      user.resetPasswordToken = "";
      user.resetPasswordExpire = null;
      await user.save({ validateBeforeSave: false });
      return next(createError(500, "Chưa gửi được email đặt lại mật khẩu. Kiểm tra SMTP trên server."));
    }
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const token = String(req.params.token || "");
    const password = String(req.body.password || "");
    if (password.length < 6) return next(createError(400, "Mật khẩu mới cần ít nhất 6 ký tự"));

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) return next(createError(400, "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn"));

    user.password = password;
    user.resetPasswordToken = "";
    user.resetPasswordExpire = null;
    await user.save();
    sendToken(user, res, 200);
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");
    if (!currentPassword || !newPassword) return next(createError(400, "Vui lòng nhập đủ mật khẩu hiện tại và mật khẩu mới"));
    if (newPassword.length < 6) return next(createError(400, "Mật khẩu mới cần ít nhất 6 ký tự"));

    const user = await User.findById(req.user.id);
    if (!user) return next(createError(404, "Không tìm thấy tài khoản"));
    if (!(await user.isPasswordMatch(currentPassword))) return next(createError(400, "Mật khẩu hiện tại không đúng"));

    user.password = newPassword;
    user.resetPasswordToken = "";
    user.resetPasswordExpire = null;
    await user.save();
    sendToken(user, res, 200);
  } catch (err) {
    next(err);
  }
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
