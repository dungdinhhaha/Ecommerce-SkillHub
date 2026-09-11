import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import request from "../../utils/request.utils";
import "./TalentDashboard.scss";

const money = (value) => Number(value || 0).toLocaleString("vi-VN");
const labels = {
  in_progress: "Cần làm",
  submitted: "Chờ buyer xác nhận",
  revision_requested: "Buyer yêu cầu sửa",
  disputed: "Đang tranh chấp",
  completed: "Hoàn thành",
};
const statusDescriptions = {
  all: "Tất cả đơn đã thanh toán của talent.",
  in_progress: "Đơn buyer đã thanh toán, talent cần bắt đầu làm và bàn giao.",
  submitted: "Talent đã gửi kết quả, đang chờ buyer xác nhận hoàn thành.",
  revision_requested: "Buyer đã yêu cầu chỉnh sửa, talent cần xem nội dung sửa.",
  disputed: "Đơn đang có tranh chấp, cần chờ hoặc phối hợp với admin.",
  completed: "Đơn đã hoàn thành, doanh thu sẽ khả dụng sau thời gian giữ tiền.",
};

const TalentDashboard = () => {
  const [activeStatus, setActiveStatus] = useState("all");
  const orders = useQuery({
    queryKey: ["talent-dashboard-orders"],
    queryFn: () => request.get("/gigs/order").then((res) => res.data.data),
  });
  const earnings = useQuery({
    queryKey: ["talent-dashboard-earnings"],
    queryFn: () => request.get("/gigs/order/earnings").then((res) => res.data.data),
  });
  const gigs = useQuery({
    queryKey: ["talent-dashboard-gigs"],
    queryFn: () => {
      const user = JSON.parse(localStorage.getItem("currentUser") || "null");
      return request.get(`/gigs?userId=${user?._id || ""}`).then((res) => res.data.data);
    },
  });

  const orderItems = orders.data || [];
  const gigItems = gigs.data || [];
  const urgent = orderItems.filter((order) => ["in_progress", "revision_requested", "disputed"].includes(order.status));
  const statusCounts = orderItems.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});
  const filteredOrders = useMemo(() => {
    if (activeStatus === "all") return orderItems;
    return orderItems.filter((order) => order.status === activeStatus);
  }, [activeStatus, orderItems]);
  const topListings = [...gigItems].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 5);

  if (orders.isLoading || earnings.isLoading || gigs.isLoading) {
    return <div className="talent-dashboard sh-page"><div className="sh-container"><p>Đang tải workbench talent...</p></div></div>;
  }
  if (orders.isError || earnings.isError) {
    return <div className="talent-dashboard sh-page"><div className="sh-container"><p>Chỉ tài khoản talent mới xem được dashboard này.</p></div></div>;
  }

  return <div className="talent-dashboard sh-page">
    <div className="sh-container">
      <section className="talent-hero">
        <div>
          <span className="sh-badge service">Talent workbench</span>
          <h1>Việc cần làm hôm nay</h1>
          <p>Ưu tiên đơn mới, yêu cầu sửa và tranh chấp trước. Tiền hoàn thành được giữ {earnings.data.holdDays || 10} ngày để bảo vệ giao dịch.</p>
        </div>
        <div className="talent-actions">
          <Link className="sh-btn" to="/orders">Xử lý đơn</Link>
          <Link className="sh-btn secondary" to="/add">Đăng listing mới</Link>
        </div>
      </section>

      <section className="talent-kpis">
        <article><small>Tiền khả dụng</small><strong>{money(earnings.data.availableNetRevenue)} VND</strong><span>Có thể tạo yêu cầu rút</span></article>
        <article><small>Đang giữ 10 ngày</small><strong>{money(earnings.data.heldRevenue)} VND</strong><span>Chờ qua thời gian bảo vệ</span></article>
        <article><small>Đơn cần xử lý</small><strong>{urgent.length}</strong><span>Đơn mới/sửa/tranh chấp</span></article>
        <article><small>Listing đang bán</small><strong>{gigItems.length}</strong><span>Đã đăng trên SkillHub</span></article>
      </section>

      <section className="talent-grid">
        <div className="sh-card talent-panel">
          <h2>Ưu tiên xử lý</h2>
          {!urgent.length && <p className="empty">Chưa có đơn cần xử lý. Nhìn yên bình như sáng Chủ nhật.</p>}
          {urgent.slice(0, 6).map((order) => <Link to={`/orders/${order._id}`} className="task-row" key={order._id}>
            <img src={order.gig?.cover || "/img/noavatar.png"} alt="" />
            <div>
              <strong>{order.gig?.title || "Đơn hàng"}</strong>
              <span>Mã {order.paymentCode} · {labels[order.status] || order.status}</span>
            </div>
            <b>{money(order.sellerAmount || order.price)}đ</b>
          </Link>)}
        </div>
        <div className="sh-card talent-panel">
          <h2>Trạng thái đơn</h2>
          <button className={`status-row ${activeStatus === "all" ? "active" : ""}`} onClick={() => setActiveStatus("all")}>
            <span>Tất cả đơn</span>
            <strong>{orderItems.length}</strong>
          </button>
          {Object.entries(labels).map(([status, label]) => <button className={`status-row ${activeStatus === status ? "active" : ""}`} onClick={() => setActiveStatus(status)} key={status}>
            <span>{label}</span>
            <strong>{statusCounts[status] || 0}</strong>
          </button>)}
        </div>
        <div className="sh-card talent-panel full order-browser">
          <div className="panel-title-row">
            <div>
              <h2>{activeStatus === "all" ? "Tất cả đơn hàng" : labels[activeStatus]}</h2>
              <p>{statusDescriptions[activeStatus]}</p>
            </div>
            <div className="order-filter-control">
              <span>{filteredOrders.length} đơn</span>
              <select value={activeStatus} onChange={(e) => setActiveStatus(e.target.value)}>
                <option value="all">Tất cả đơn hàng</option>
                {Object.entries(labels).map(([status, label]) => (
                  <option value={status} key={status}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          {!filteredOrders.length && <p className="empty">Chưa có đơn nào trong trạng thái này.</p>}
          {filteredOrders.map((order) => <Link to={`/orders/${order._id}`} className="order-row" key={order._id}>
            <img src={order.gig?.cover || "/img/noavatar.png"} alt="" />
            <div>
              <strong>{order.gig?.title || "Đơn hàng"}</strong>
              <span>Mã {order.paymentCode} · {labels[order.status] || order.status}</span>
            </div>
            <div className="order-money">
              <b>{money(order.sellerAmount || order.price)}đ</b>
              <small>{new Date(order.updatedAt || order.createdAt).toLocaleDateString("vi-VN")}</small>
            </div>
          </Link>)}
        </div>
        <div className="sh-card talent-panel full">
          <h2>Top listing</h2>
          {!topListings.length && <p className="empty">Chưa có listing. Bắt đầu bằng một sản phẩm số hoặc dịch vụ kỹ năng nha.</p>}
          {topListings.map((gig) => <Link to={`/gig/${gig._id}`} className="listing-row" key={gig._id}>
            <img src={gig.cover || "/img/noavatar.png"} alt="" />
            <div><strong>{gig.title}</strong><span>{gig.listingType === "digital_product" ? "Sản phẩm số" : "Dịch vụ"} · {gig.sales || 0} lượt bán</span></div>
            <b>{money(gig.price)}đ</b>
          </Link>)}
        </div>
      </section>
    </div>
  </div>;
};

export default TalentDashboard;
