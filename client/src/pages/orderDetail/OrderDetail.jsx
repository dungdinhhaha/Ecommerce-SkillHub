import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import request from "../../utils/request.utils";
import "./OrderDetail.scss";

const labels = {
  pending_payment: "Chờ thanh toán",
  in_progress: "Đang thực hiện",
  submitted: "Đã bàn giao",
  revision_requested: "Yêu cầu sửa",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  disputed: "Tranh chấp",
};
const money = (value) => Number(value || 0).toLocaleString("vi-VN");

const OrderDetail = () => {
  const { id } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["order-detail", id],
    queryFn: () => request.get(`/gigs/order/${id}/detail`).then((res) => res.data.data),
  });

  const openDeliveryFile = async (index) => {
    const res = await request.get(`/gigs/order/${id}/delivery-files/${index}`);
    window.open(res.data.data.url, "_blank");
  };

  if (isLoading) return <div className="order-detail"><div className="container"><p>Đang tải chi tiết đơn...</p></div></div>;
  if (isError) return <div className="order-detail"><div className="container"><p>Không tải được đơn hàng.</p></div></div>;

  const deliveryEvent = [...(data.timeline || [])].reverse().find((item) => item.type === "delivered");
  const deliveryResult = {
    note: data.deliveryNote || deliveryEvent?.note || "",
    files: data.deliveryFiles?.length ? data.deliveryFiles : deliveryEvent?.files || [],
    createdAt: deliveryEvent?.createdAt || data.deliveredAt,
    hasDelivery: !!(data.deliveryNote || data.deliveryFiles?.length || deliveryEvent),
  };

  return <div className="order-detail"><div className="container">
    <Link to="/orders">← Quay lại đơn hàng</Link>
    <div className="order-detail-head">
      <div><h1>Đơn {data.paymentCode}</h1><p>{data.gig?.title}</p></div>
      <span className={`status ${data.status}`}>{labels[data.status] || data.status}</span>
    </div>
    <div className="order-detail-grid">
      <article><small>Buyer</small><strong>{data.buyer?.username}</strong><span>{data.buyer?.email}</span></article>
      <article><small>Talent</small><strong>{data.seller?.username}</strong><span>{data.seller?.email}</span></article>
      <article><small>Giá trị đơn</small><strong>{money(data.price)} VND</strong><span>Talent nhận: {money(data.sellerAmount || data.price)} VND</span></article>
      <article><small>Thanh toán</small><strong>{data.paymentStatus}</strong><span>{data.sepayTransactionId || "Chưa có mã giao dịch"}</span></article>
    </div>
    {deliveryResult.hasDelivery && <section className="delivery-result">
      <div className="section-title-row">
        <h2>Kết quả bàn giao</h2>
        {deliveryResult.createdAt && <small>{new Date(deliveryResult.createdAt).toLocaleString("vi-VN")}</small>}
      </div>
      {deliveryResult.note && <p>{deliveryResult.note}</p>}
      {deliveryResult.files.length > 0 ? <div className="delivery-files">
        {deliveryResult.files.map((fileUrl, index) => <button type="button" onClick={() => openDeliveryFile(index)} key={`${fileUrl}-${index}`}>Tải file bàn giao {index + 1}</button>)}
      </div> : <small>Đã ghi nhận bàn giao, chưa có file đính kèm.</small>}
    </section>}
    {data.buyerNote && <section><h2>Yêu cầu sửa</h2><p>{data.buyerNote}</p></section>}
    {data.disputeReason && <section className="dispute"><h2>Tranh chấp/hoàn tiền</h2><p>{data.disputeReason}</p></section>}
    <section>
      <h2>Timeline đơn hàng</h2>
      <div className="detail-timeline">
        {[...(data.timeline || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((item, index) => <div key={`${item.type}-${index}`}>
          <span>{new Date(item.createdAt).toLocaleString("vi-VN")}</span>
          <strong>{item.title}</strong>
          {item.note && <p>{item.note}</p>}
        </div>)}
      </div>
    </section>
  </div></div>;
};

export default OrderDetail;
