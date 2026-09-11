import React from "react";
import { useQuery } from "@tanstack/react-query";
import request from "../../utils/request.utils";
import "./Earnings.scss";

const labels = {
  in_progress: "Đang thực hiện",
  submitted: "Đã bàn giao",
  revision_requested: "Đang yêu cầu sửa",
  completed: "Hoàn thành",
  disputed: "Đang tranh chấp",
  cancelled: "Đã hủy",
};

const money = (value) => Number(value || 0).toLocaleString("vi-VN");

const Earnings = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["seller-earnings"],
    queryFn: () => request.get("/gigs/order/earnings").then((res) => res.data.data),
  });

  if (isLoading) return <div className="earnings"><div className="container"><p>Đang tải doanh thu...</p></div></div>;
  if (isError) return <div className="earnings"><div className="container"><p>Chỉ tài khoản talent mới xem được trang doanh thu.</p></div></div>;

  return <div className="earnings"><div className="container">
    <div className="title">
      <div><span className="sh-badge product">Finance dashboard</span><h1>Doanh thu talent</h1><p>{data.orders.length} đơn đã thanh toán · doanh thu khả dụng sau thời gian giữ tiền.</p></div>
      <a href="/wallet">Tạo yêu cầu rút tiền</a>
    </div>
    <div className="earning-summary">
      <article><small>Tiền khả dụng để rút</small><strong>{money(data.availableNetRevenue)} VND</strong><span>Đơn đã qua {data.holdDays || 10} ngày giữ tiền</span></article>
      <article><small>Tiền đang giữ {data.holdDays || 10} ngày</small><strong>{money(data.heldRevenue)} VND</strong><span>Đã hoàn thành nhưng chưa rút được</span></article>
      <article><small>Tiền thực nhận đang chờ</small><strong>{money(data.pendingNetRevenue)} VND</strong><span>{data.pendingCount} đơn</span></article>
      <article><small>Tổng giá trị đơn hoàn thành</small><strong>{money(data.completedRevenue)} VND</strong><span>Trước khi trừ phí</span></article>
      <article><small>Phí nền tảng đã ghi nhận</small><strong>{money(data.platformFees)} VND</strong><span>SkillHub giữ lại</span></article>
    </div>
    <div className="earning-list">
      {data.orders.map((order) => <article className="earning-card" key={order._id}>
        <img src={order.gig?.cover || "/img/noavatar.png"} alt="" />
        <div>
          <strong>{order.gig?.title}</strong>
          <p>Người mua: {order.buyer?.username}</p>
          <small>Mã đơn: {order.paymentCode}</small>
        </div>
        <div className="earning-right">
          <span className={`status ${order.status}`}>{labels[order.status] || order.status}</span>
          <strong>{money(order.sellerAmount || order.price)} VND</strong>
          <small>Phí: {money(order.platformFee)} VND</small>
        </div>
      </article>)}
    </div>
  </div></div>;
};

export default Earnings;
