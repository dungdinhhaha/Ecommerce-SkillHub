const User = require("../models/user.model");
const createError = require("../utils/createError");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

const emailShell = ({ title, intro, body, footerNote }) => `
  <div style="margin:0;padding:0;background:#f6faf8;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6faf8;padding:28px 12px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #dbe8e2;border-radius:24px;overflow:hidden">
            <tr>
              <td style="background:#013914;padding:26px 30px;color:#ffffff">
                <div style="font-size:30px;font-weight:900;letter-spacing:-1px">SkillHub<span style="color:#1dbf73">.</span></div>
                <div style="margin-top:8px;color:#d1fae5;font-size:14px">Marketplace sản phẩm số và dịch vụ kỹ năng</div>
              </td>
            </tr>
            <tr>
              <td style="padding:30px">
                <h1 style="margin:0 0 12px;font-size:26px;line-height:1.25;color:#0f172a">${title}</h1>
                <p style="margin:0 0 22px;color:#475569;font-size:16px;line-height:1.65">${intro}</p>
                ${body}
                <div style="margin-top:28px;padding-top:18px;border-top:1px solid #e5e7eb;color:#64748b;font-size:13px;line-height:1.6">
                  <p style="margin:0 0 8px">${footerNote}</p>
                  <p style="margin:0">Trân trọng,<br/><strong>Đội ngũ SkillHub</strong></p>
                </div>
              </td>
            </tr>
          </table>
          <p style="max-width:620px;margin:14px auto 0;color:#94a3b8;font-size:12px;line-height:1.5">
            Email này được gửi tự động từ SkillHub. Vui lòng không chia sẻ liên kết bảo mật trong email cho người khác.
          </p>
        </td>
      </tr>
    </table>
  </div>
`;

const sendWelcomeEmail = async (user) => {
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
  const role = user.isAdmin ? "Quản trị viên" : user.isSeller ? "Talent" : "Buyer";
  const text = `Xin chào ${user.username},\n\nSkillHub xác nhận tài khoản của bạn đã được tạo thành công.\n\nThông tin tài khoản:\n- Tên đăng nhập: ${user.username}\n- Email đăng ký: ${user.email}\n- Loại tài khoản: ${role}\n\nĐăng nhập tại: ${clientUrl}/login\n\nVì lý do bảo mật, SkillHub không gửi hoặc lưu mật khẩu ở dạng có thể đọc lại. Nếu quên mật khẩu, vui lòng sử dụng chức năng Quên mật khẩu trên trang đăng nhập.\n\nTrân trọng,\nĐội ngũ SkillHub`;

  await sendEmail({
    to: user.email,
    subject: "SkillHub xác nhận tài khoản của bạn đã được tạo thành công",
    text,
    html: emailShell({
      title: `Chào mừng ${user.username} đến với SkillHub`,
      intro: "SkillHub xác nhận tài khoản của bạn đã được tạo thành công. Dưới đây là thông tin tài khoản để bạn tiện ghi nhớ khi đăng nhập.",
      body: `
        <div style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:18px;padding:18px 20px;margin:0 0 22px">
          <p style="margin:0 0 10px"><span style="display:block;color:#047857;font-size:13px;font-weight:700">Tên đăng nhập</span><strong style="font-size:18px">${user.username}</strong></p>
          <p style="margin:0 0 10px"><span style="display:block;color:#047857;font-size:13px;font-weight:700">Email đăng ký</span><strong style="font-size:18px">${user.email}</strong></p>
          <p style="margin:0"><span style="display:block;color:#047857;font-size:13px;font-weight:700">Loại tài khoản</span><strong style="font-size:18px">${role}</strong></p>
        </div>
        <p style="margin:0 0 20px;color:#475569;line-height:1.65">Bạn có thể bắt đầu tìm sản phẩm số, thuê talent phù hợp hoặc đăng bán kỹ năng của mình trên SkillHub.</p>
        <p style="margin:0"><a href="${clientUrl}/login" style="display:inline-block;background:#1dbf73;color:#ffffff;padding:13px 20px;border-radius:999px;text-decoration:none;font-weight:800">Đăng nhập SkillHub</a></p>
      `,
      footerNote: "Vì lý do bảo mật, SkillHub không gửi mật khẩu qua email. Nếu quên mật khẩu, vui lòng sử dụng chức năng Quên mật khẩu trên trang đăng nhập.",
    }),
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
        { email: { $regex: `^${escapeRegExp(account)}$`, $options: "i" } },
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
    const message = `Xin chào ${user.username},\n\nSkillHub nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.\n\nLink đặt lại mật khẩu có hiệu lực trong 15 phút:\n${resetUrl}\n\nNếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email. Mật khẩu hiện tại của bạn sẽ không thay đổi.\n\nTrân trọng,\nĐội ngũ SkillHub`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Yêu cầu đặt lại mật khẩu SkillHub",
        text: message,
        html: emailShell({
          title: "Đặt lại mật khẩu SkillHub",
          intro: `Xin chào ${user.username}, SkillHub nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.`,
          body: `
            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:18px;padding:16px 18px;margin:0 0 22px;color:#9a3412;line-height:1.6">
              Link đặt lại mật khẩu chỉ có hiệu lực trong <strong>15 phút</strong>. Vì sự an toàn của tài khoản, vui lòng không chia sẻ email này cho người khác.
            </div>
            <p style="margin:0 0 20px"><a href="${resetUrl}" style="display:inline-block;background:#1dbf73;color:#ffffff;padding:13px 20px;border-radius:999px;text-decoration:none;font-weight:800">Đặt lại mật khẩu</a></p>
            <p style="margin:0 0 8px;color:#64748b;font-size:14px">Nếu nút không hoạt động, hãy copy đường dẫn dưới đây và dán vào trình duyệt:</p>
            <p style="margin:0;word-break:break-all;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px;color:#334155;font-size:13px">${resetUrl}</p>
          `,
          footerNote: "Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Mật khẩu hiện tại của bạn sẽ không thay đổi.",
        }),
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
