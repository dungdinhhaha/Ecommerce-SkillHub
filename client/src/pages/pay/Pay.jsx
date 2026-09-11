import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import request from "../../utils/request.utils";
import "./Pay.scss";

const Pay = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherMessage, setVoucherMessage] = useState("");
  const [checking, setChecking] = useState(false);
  const { data: gig } = useQuery({
    queryKey: ["checkout-gig", id],
    queryFn: () => request.get(`/gigs/${id}`).then((res) => res.data.data),
  });

  const checkPayment = async () => {
    if (!payment?.code) return;
    setChecking(true);
    try {
      const statusRes = await request.get(`/gigs/order/${payment.code}/status`);
      if (statusRes.data.data.paymentStatus === "paid") navigate("/orders");
      else setError("");
    } catch (err) {
      setError("Chưa kiểm tra được thanh toán, thử lại sau vài giây.");
    } finally {
      setChecking(false);
    }
  };

  const createOrder = async (code = "") => {
      try {
        setError("");
        setVoucherMessage("");
        const res = await request.post(`/gigs/${id}/order`, { voucherCode: code });
        const data = res.data.data;
        setPayment(data);
        if (code) setVoucherMessage(data.discountAmount ? `Đã áp dụng voucher ${data.voucherCode}, giảm ${Number(data.discountAmount).toLocaleString("vi-VN")} VND.` : "Voucher chưa tạo giảm giá cho đơn này.");
        if (data.status === "paid") {
          navigate("/orders");
          return;
        }
        return data;
      } catch (err) {
        setError(err.response?.data?.error || "Không thể tạo đơn thanh toán");
        return null;
      }
    };

  useEffect(() => {
    let timer;
    let active = true;
    const initPayment = async () => {
      try {
        const data = await createOrder();
        if (!active || !data) return;
        timer = window.setInterval(async () => {
          const statusRes = await request.get(`/gigs/order/${data.code}/status`);
          if (statusRes.data.data.paymentStatus === "paid") {
            window.clearInterval(timer);
            navigate("/orders");
          }
          if (["cancelled", "expired"].includes(statusRes.data.data.paymentStatus)) {
            window.clearInterval(timer);
            setError("Mã thanh toán này đã hết hiệu lực. Vui lòng tạo lại thanh toán.");
          }
        }, 3000);
      } catch (err) {
        setError(err.response?.data?.error || "Không thể tạo đơn thanh toán");
      }
    };
    initPayment();
    return () => {
      active = false;
      if (timer) window.clearInterval(timer);
    };
  }, [id, navigate]);

  return (
    <div className="pay">
      {error && <p>{error}</p>}
      {!error && !payment && <p>Đang tạo mã thanh toán...</p>}
      {payment && <div className="payment-box">
        <div className="checkout-head">
          <span>Bước cuối</span>
          <h1>Thanh toán qua SePay</h1>
          <p>Quét QR hoặc chuyển khoản đúng nội dung để hệ thống tự xác nhận đơn.</p>
        </div>
        {gig && <div className="checkout-summary">
          <img src={gig.cover || "/img/noavatar.png"} alt="" />
          <div>
            <strong>{gig.title}</strong>
            <span>{gig.listingType === "digital_product" ? "Sản phẩm số" : "Dịch vụ kỹ năng"}</span>
          </div>
        </div>}
        <img className="payment-qr" src={payment.qrUrl} alt="Mã QR thanh toán" />
        <div className="payment-info">
          <p><strong>Số tiền:</strong> {Number(payment.amount).toLocaleString("vi-VN")} VND</p>
          {!!payment.discountAmount && <p><strong>Khuyến mãi:</strong> -{Number(payment.discountAmount).toLocaleString("vi-VN")} VND {payment.voucherCode && `(${payment.voucherCode})`}</p>}
          <p><strong>Nội dung chuyển khoản:</strong> <code>{payment.code}</code> <button onClick={() => navigator.clipboard?.writeText(payment.code)}>Copy</button></p>
          <p><strong>Trạng thái:</strong> Đang chờ SePay xác nhận</p>
        </div>
        <div className="voucher-box">
          <label>Mã khuyến mãi / voucher</label>
          <div>
            <input value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())} placeholder="Ví dụ: SKILLHUB10" />
            <button onClick={() => createOrder(voucherCode)}>Áp dụng</button>
          </div>
          {voucherMessage && <small>{voucherMessage}</small>}
        </div>
        <div className="trust-grid">
          <article><strong>Mã đơn riêng</strong><span>Mỗi đơn dùng một mã DH khác nhau để không lẫn giao dịch.</span></article>
          <article><strong>SePay tự xác nhận</strong><span>Webhook cập nhật đơn khi nội dung chuyển khoản đúng mã.</span></article>
          <article><strong>Giữ tiền 10 ngày</strong><span>SkillHub giữ tiền bảo vệ buyer trước khi talent rút.</span></article>
          <article><strong>Có tranh chấp</strong><span>Buyer có thể yêu cầu sửa hoặc mở hoàn tiền cho admin xử lý.</span></article>
        </div>
        <div className="checkout-actions">
          <button onClick={checkPayment} disabled={checking}>{checking ? "Đang kiểm tra..." : "Tôi đã thanh toán, kiểm tra lại"}</button>
          <button className="muted" onClick={() => navigate("/orders")}>Về đơn hàng</button>
        </div>
        <small>SkillHub tự chuyển sang đơn hàng sau khi webhook SePay báo thanh toán thành công. Nhớ chuyển khoản đúng mã DH.</small>
      </div>}
    </div>
  );
};

export default Pay;
