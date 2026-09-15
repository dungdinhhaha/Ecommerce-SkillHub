import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "./Login.scss";
import request from "../../utils/request.utils";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await request.post("/auth/login", { username, password });

      localStorage.setItem("currentUser", JSON.stringify(res.data.data.user));
      // Keep a fallback token for development when the browser changes between
      // localhost and 127.0.0.1 and therefore does not send the cookie.
      if (res.data.data.token) {
        localStorage.setItem("accessToken", res.data.data.token);
      }
      const params = new URLSearchParams(location.search);
      const redirect = params.get("redirect");
      const user = res.data.data.user;
      const defaultPath = user.isAdmin ? "/admin" : user.isSeller ? "/talent/dashboard" : "/";
      navigate(redirect || defaultPath);
    } catch (err) {
      setError(err.response.data.error);
    }
  };

  return (
    <div className="login">
      <div className="container">
        <form onSubmit={handleSubmit}>
          <h1>Đăng nhập SkillHub</h1>
          <label htmlFor="username">Tên đăng nhập</label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="demo_buyer"
            autoComplete="username"
            onChange={(e) => setUsername(e.target.value)}
          />

          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <Link className="auth-link forgot-link" to="/forgot-password">Quên mật khẩu?</Link>
          <button type="submit">Đăng nhập</button>
          {error && <p role="alert">{error}</p>}
        </form>
        <div className="signup">
          <span>Chưa có tài khoản SkillHub?</span>
          <Link
            style={{
              marginLeft: "5px",
              textDecoration: "underline",
              color: "blue",
            }}
            className="link"
            to="/register"
          >
            Đăng ký
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
