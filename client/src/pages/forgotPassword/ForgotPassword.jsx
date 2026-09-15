import React, { useState } from "react";
import { Link } from "react-router-dom";
import request from "../../utils/request.utils";
import "../login/Login.scss";

const ForgotPassword = () => {
  const [account, setAccount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const res = await request.post("/auth/forgot-password", { account });
      setMessage(res.data.data.message || "Đã gửi link đặt lại mật khẩu qua email.");
    } catch (err) {
      setError(err.response?.data?.error || "Chưa gửi được email đặt lại mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login auth-page">
      <div className="container">
        <form onSubmit={submit}>
          <h1>Quên mật khẩu</h1>
          <p className="auth-hint">Nhập email hoặc tên đăng nhập, SkillHub sẽ gửi link đặt lại mật khẩu cho bạn.</p>
          <label htmlFor="account">Email hoặc tên đăng nhập</label>
          <input
            id="account"
            type="text"
            value={account}
            placeholder="demo_buyer hoặc email"
            autoComplete="username"
            onChange={(e) => setAccount(e.target.value)}
          />
          <button type="submit" disabled={loading}>{loading ? "Đang gửi..." : "Gửi link đặt lại"}</button>
          {message && <p className="auth-message success">{message}</p>}
          {error && <p className="auth-message error" role="alert">{error}</p>}
          <Link className="auth-link" to="/login">Quay lại đăng nhập</Link>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
