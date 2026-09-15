import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import request from "../../utils/request.utils";
import "../login/Login.scss";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    if (password.length < 6) {
      setError("Mật khẩu mới cần ít nhất 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu nhập lại chưa khớp.");
      return;
    }
    setLoading(true);
    try {
      const res = await request.patch(`/auth/reset-password/${token}`, { password });
      localStorage.setItem("currentUser", JSON.stringify(res.data.data.user));
      if (res.data.data.token) localStorage.setItem("accessToken", res.data.data.token);
      setMessage("Đã đặt lại mật khẩu. Đang chuyển về trang chủ...");
      setTimeout(() => navigate("/"), 700);
    } catch (err) {
      setError(err.response?.data?.error || "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login auth-page">
      <div className="container">
        <form onSubmit={submit}>
          <h1>Đặt lại mật khẩu</h1>
          <p className="auth-hint">Tạo mật khẩu mới cho tài khoản SkillHub của bạn.</p>
          <label htmlFor="password">Mật khẩu mới</label>
          <input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <label htmlFor="confirmPassword">Nhập lại mật khẩu mới</label>
          <input id="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <button type="submit" disabled={loading}>{loading ? "Đang lưu..." : "Đặt lại mật khẩu"}</button>
          {message && <p className="auth-message success">{message}</p>}
          {error && <p className="auth-message error" role="alert">{error}</p>}
          <Link className="auth-link" to="/login">Quay lại đăng nhập</Link>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
