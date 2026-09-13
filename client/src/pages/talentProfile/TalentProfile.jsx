import React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import GigCard from "../../components/gigCard/GigCard";
import request from "../../utils/request.utils";
import "./TalentProfile.scss";

const money = (value) => Number(value || 0).toLocaleString("vi-VN");

const TalentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["talent-profile", id],
    queryFn: () => request.get(`/user/${id}/profile`).then((res) => res.data.data),
  });

  const contact = useMutation({
    mutationFn: () => request.post("/conversation", { to: id }),
    onSuccess: (res) => navigate(`/message/${res.data.data.id}`),
    onError: (err) => {
      if (err.response?.status === 401) navigate("/login");
      else alert(err.response?.data?.message || "Không mở được cuộc trò chuyện.");
    },
  });

  if (isLoading) return <div className="talent-profile sh-page"><div className="sh-container"><p>Đang tải hồ sơ talent...</p></div></div>;
  if (isError || !data) return <div className="talent-profile sh-page"><div className="sh-container"><p>Không tìm thấy talent.</p></div></div>;

  const { user, stats, gigs } = data;
  const canContact = currentUser?._id !== user._id;

  return <div className="talent-profile sh-page">
    <div className="sh-container">
      <section className="talent-profile-hero sh-card">
        <img src={user.img || "/img/noavatar.png"} alt={user.username} onError={(e) => { e.currentTarget.src = "/img/noavatar.png"; }} />
        <div>
          <span className="sh-badge service">Talent SkillHub</span>
          <h1>{user.username}</h1>
          <p>{user.desc || "Talent chưa cập nhật mô tả hồ sơ."}</p>
          <div className="talent-profile-actions">
            {canContact && <button className="sh-btn" onClick={() => contact.mutate()} disabled={contact.isLoading}>{contact.isLoading ? "Đang mở chat..." : "Nhắn tin với talent"}</button>}
            <Link className="sh-btn secondary" to={`/gigs?userId=${user._id}`}>Xem listing</Link>
          </div>
        </div>
      </section>

      <section className="talent-profile-stats">
        <article><small>Số sao</small><strong>{stats.rating ? `${stats.rating}★` : "Chưa có"}</strong><span>{stats.reviews || 0} đánh giá</span></article>
        <article><small>Đơn đã thanh toán</small><strong>{stats.paidOrders}</strong><span>{stats.completedOrders} đơn hoàn thành</span></article>
        <article><small>Đơn đang xử lý</small><strong>{stats.activeOrders}</strong><span>Đang làm/sửa/tranh chấp</span></article>
        <article><small>Listing đang bán</small><strong>{stats.listings}</strong><span>{stats.totalSales || 0} lượt bán</span></article>
        <article><small>Doanh thu talent</small><strong>{money(stats.revenue)}đ</strong><span>Từ đơn đã thanh toán</span></article>
      </section>

      <section className="talent-profile-info sh-card">
        <div>
          <small>Quốc gia</small>
          <strong>{user.country || "Chưa cập nhật"}</strong>
        </div>
        <div>
          <small>Tham gia</small>
          <strong>{user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN", { month: "long", year: "numeric" }) : "Chưa rõ"}</strong>
        </div>
        <div>
          <small>Ngôn ngữ</small>
          <strong>Tiếng Việt</strong>
        </div>
        <div>
          <small>Loại tài khoản</small>
          <strong>Talent</strong>
        </div>
      </section>

      <section className="talent-profile-products">
        <div className="profile-section-title">
          <div>
            <h2>Sản phẩm/dịch vụ của {user.username}</h2>
            <p>Toàn bộ listing đã duyệt đang bán trên SkillHub.</p>
          </div>
          <span>{gigs.length} listing</span>
        </div>
        {!gigs.length ? <p className="empty">Talent này chưa có listing đang bán.</p> : <div className="talent-product-grid">
          {gigs.map((gig) => <GigCard item={gig} key={gig._id} />)}
        </div>}
      </section>
    </div>
  </div>;
};

export default TalentProfile;
