import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";

import request from "../../utils/request.utils";
import upload from "../../utils/upload.utils";
import "./Account.scss";

const Account = () => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [form, setForm] = useState({
    username: currentUser?.username || "",
    email: currentUser?.email || "",
    country: currentUser?.country || "Việt Nam",
    phone: currentUser?.phone || "",
    desc: currentUser?.desc || "",
    img: currentUser?.img || "",
  });

  if (!currentUser) {
    navigate("/login?redirect=/account");
    return null;
  }

  const mutation = useMutation({
    mutationFn: (payload) => request.patch("/user/me", payload).then((res) => res.data.data),
    onSuccess: (user) => {
      const updatedUser = { ...currentUser, ...user };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      setForm({
        username: updatedUser.username || "",
        email: updatedUser.email || "",
        country: updatedUser.country || "Việt Nam",
        phone: updatedUser.phone || "",
        desc: updatedUser.desc || "",
        img: updatedUser.img || "",
      });
      setMessage("Đã lưu thông tin tài khoản.");
    },
    onError: (err) => setMessage(err.response?.data?.error || "Chưa lưu được thông tin."),
  });
  const passwordMutation = useMutation({
    mutationFn: (payload) => request.patch("/auth/change-password", payload).then((res) => res.data.data),
    onSuccess: (data) => {
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      if (data.token) localStorage.setItem("accessToken", data.token);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordMessage("Đã đổi mật khẩu thành công.");
    },
    onError: (err) => setPasswordMessage(err.response?.data?.error || "Chưa đổi được mật khẩu."),
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("");
    let img = form.img;
    if (avatarFile) {
      setUploading(true);
      try {
        img = await upload(avatarFile);
        setForm((prev) => ({ ...prev, img }));
      } catch (err) {
        setUploading(false);
        setMessage(err.message || "Upload ảnh đại diện chưa thành công.");
        return;
      }
      setUploading(false);
    }
    mutation.mutate({ ...form, img });
  };
  const handlePasswordSave = (e) => {
    e.preventDefault();
    setPasswordMessage("");
    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage("Mật khẩu mới cần ít nhất 6 ký tự.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage("Mật khẩu nhập lại chưa khớp.");
      return;
    }
    passwordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  return (
    <main className="account-page">
      <div className="container">
        <section className="account-hero">
          <div>
            <span className="sh-badge service">Tài khoản</span>
            <h1>Thông tin tài khoản</h1>
            <p>Cập nhật hồ sơ hiển thị trên SkillHub để buyer/talent nhận ra bạn rõ hơn.</p>
          </div>
          <div className="account-links">
            <Link to="/orders">Đơn hàng</Link>
            <Link to="/messages">Tin nhắn</Link>
            <Link to="/wishlist">Yêu thích</Link>
          </div>
        </section>

        <div className="account-grid">
          <aside className="account-card">
            <img src={form.img || "/img/noavatar.png"} alt="" />
            <h2>{form.username}</h2>
            <p>{currentUser?.isAdmin ? "Quản trị viên" : currentUser?.isSeller ? "Talent" : "Buyer"}</p>
            <div className="account-badges">
              {currentUser?.isSeller && <span>Talent</span>}
              {currentUser?.isAdmin && <span>Admin</span>}
              <span>{currentUser?.accountStatus === "blocked" ? "Đã khóa" : "Đang hoạt động"}</span>
            </div>
          </aside>

          <form className="account-form" onSubmit={handleSave}>
            <label>
              Ảnh đại diện
              <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0])} />
              <small>Dùng ảnh thật hoặc logo cá nhân để tăng độ tin cậy.</small>
            </label>
            <div className="form-row">
              <label>
                Tên hiển thị
                <input name="username" value={form.username} onChange={handleChange} />
              </label>
              <label>
                Email
                <input name="email" type="email" value={form.email} onChange={handleChange} />
              </label>
            </div>
            <div className="form-row">
              <label>
                Quốc gia/khu vực
                <input name="country" value={form.country} onChange={handleChange} />
              </label>
              <label>
                Số điện thoại
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="Chỉ dùng để hỗ trợ tài khoản" />
              </label>
            </div>
            <label>
              Giới thiệu ngắn
              <textarea name="desc" rows="6" value={form.desc} onChange={handleChange} placeholder="Ví dụ: Tôi chuyên làm website React, landing page và API Node.js..." />
            </label>
            {message && <p className="account-message">{message}</p>}
            <button disabled={mutation.isLoading || uploading}>
              {uploading ? "Đang upload ảnh..." : mutation.isLoading ? "Đang lưu..." : "Lưu thông tin"}
            </button>
          </form>
          <form className="account-form password-form" onSubmit={handlePasswordSave}>
            <div>
              <h2>Đổi mật khẩu</h2>
              <p>Nhập mật khẩu hiện tại để đổi sang mật khẩu mới.</p>
            </div>
            <label>
              Mật khẩu hiện tại
              <input type="password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))} />
            </label>
            <div className="form-row">
              <label>
                Mật khẩu mới
                <input type="password" autoComplete="new-password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))} />
              </label>
              <label>
                Nhập lại mật khẩu mới
                <input type="password" autoComplete="new-password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} />
              </label>
            </div>
            {passwordMessage && <p className="account-message">{passwordMessage}</p>}
            <button disabled={passwordMutation.isLoading}>{passwordMutation.isLoading ? "Đang đổi..." : "Đổi mật khẩu"}</button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Account;
