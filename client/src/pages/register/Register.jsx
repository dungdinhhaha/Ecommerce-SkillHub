import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.scss";
import upload from "../../utils/upload.utils";
import request from "../../utils/request.utils";

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [user, setUser] = React.useState({
    username: "",
    email: "",
    img: "",
    password: "",
    country: "",
    phone: "",
    desc: "",
    isSeller: false,
    termsAccepted: false,
  });
  const [file, setFile] = React.useState(null);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSeller = () => {
    setUser({ ...user, isSeller: !user.isSeller });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!user.termsAccepted) {
      setError("Bạn cần đồng ý Điều khoản dịch vụ và Chính sách bảo mật để tạo tài khoản.");
      return;
    }
    setLoading(true);
    try {
      const url = file ? await upload(file) : "";
      const newUser = { ...user, img: url };
      await request.post("/auth/register", newUser);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Chưa tạo được tài khoản, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register">
      <form onSubmit={handleSubmit}>
        <div className="left">
          <h1>Tạo tài khoản SkillHub</h1>
          <label htmlFor="username">Tên đăng nhập</label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="ví dụ: minh_talent"
            autoComplete="username"
            onChange={handleChange}
          />
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="ban@email.com"
            autoComplete="email"
            onChange={handleChange}
          />
          <label htmlFor="password">Mật khẩu</label>
          <input id="password" name="password" type="password" autoComplete="new-password" onChange={handleChange} />
          <label htmlFor="avatar">Ảnh đại diện</label>
          <input id="avatar" type="file" onChange={(e) => setFile(e.target.files[0])} />
          <label htmlFor="country">Quốc gia</label>
          <input
            id="country"
            name="country"
            type="text"
            placeholder="Việt Nam"
            autoComplete="country-name"
            onChange={handleChange}
          />
          <label className="legal-check">
            <input
              type="checkbox"
              checked={user.termsAccepted}
              onChange={(e) => setUser({ ...user, termsAccepted: e.target.checked })}
            />
            <span>
              Tôi đã đọc và đồng ý với <Link to="/policy#terms">Điều khoản dịch vụ</Link>, <Link to="/policy#privacy">Chính sách bảo mật</Link> và quy định giao dịch điện tử của SkillHub.
            </span>
          </label>
          <button disabled={loading ? true : false} type="submit">
            {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </button>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div>
            <span>Đã có tài khoản?</span>
            <Link
              style={{
                marginLeft: "5px",
                textDecoration: "underline",
                color: "blue",
              }}
              className="link"
              to="/login"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
        <div className="right">
          <h1>Tôi muốn trở thành talent</h1>
          <div className="toggle">
            <label>Kích hoạt tài khoản talent</label>
            <label className="switch">
              <input type="checkbox" onChange={handleSeller} />
              <span className="slider round"></span>
            </label>
          </div>
          <label htmlFor="phone">Số điện thoại</label>
          <input
            id="phone"
            name="phone"
            type="text"
            placeholder="09xxxxxxxx"
            autoComplete="tel"
            onChange={handleChange}
          />
          <label htmlFor="desc">Mô tả hồ sơ</label>
          <textarea
            placeholder="Giới thiệu ngắn về kỹ năng, kinh nghiệm và loại dịch vụ bạn cung cấp"
            name="desc"
            id="desc"
            cols="30"
            rows="10"
            onChange={handleChange}
          ></textarea>
        </div>
      </form>
    </div>
  );
};

export default Register;
