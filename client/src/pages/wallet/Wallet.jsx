import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import request from "../../utils/request.utils";
import "./Wallet.scss";

const money = (value) => Number(value || 0).toLocaleString("vi-VN");
const statusLabels = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối", paid: "Đã chuyển tiền" };
const dateText = (value) => value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa có";

const Wallet = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ amount: "", bankName: "", bankAccount: "", accountName: "", note: "" });
  const wallet = useQuery({ queryKey: ["wallet"], queryFn: () => request.get("/wallet").then((res) => res.data.data) });
  const withdrawal = useMutation({
    mutationFn: () => request.post("/wallet/withdrawals", { ...form, amount: Number(form.amount) }),
    onSuccess: () => {
      setForm({ amount: "", bankName: "", bankAccount: "", accountName: "", note: "" });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });

  if (wallet.isLoading) return <div className="wallet"><div className="container"><p>Đang tải ví...</p></div></div>;
  if (wallet.isError) return <div className="wallet"><div className="container"><p>Chỉ tài khoản talent mới xem được ví.</p></div></div>;

  const data = wallet.data;

  return <div className="wallet"><div className="container">
    <div className="title"><div><span className="sh-badge product">Talent wallet</span><h1>Ví talent</h1><p>Tiền đơn hoàn thành được rút sau {data.holdDays || 10} ngày để bảo vệ giao dịch.</p></div><a href="/earnings">Xem doanh thu</a></div>
    <div className="wallet-summary">
      <article><small>Số dư khả dụng</small><strong>{money(data.available)} VND</strong></article>
      <article><small>Tiền đang giữ {data.holdDays || 10} ngày</small><strong>{money(data.heldBalance)} VND</strong></article>
      <article><small>Tiền đang chờ hoàn thành</small><strong>{money(data.pendingBalance)} VND</strong></article>
    </div>
    <div className="wallet-flow">
      <span>Buyer thanh toán</span><i />
      <span>Talent bàn giao</span><i />
      <span>Buyer xác nhận</span><i />
      <span>Giữ {data.holdDays || 10} ngày</span><i />
      <span>Khả dụng để rút</span>
    </div>
    {!!data.heldOrders?.length && <div className="hold-list">
      <h2>Đơn đã hoàn thành nhưng chưa tới ngày rút</h2>
      {data.heldOrders.map((order) => <article key={order._id}>
        <div>
          <strong>{order.gig?.title || "Đơn hàng"}</strong>
          <p>Mã đơn: {order.paymentCode}</p>
        </div>
        <div>
          <strong>{money(order.amount)} VND</strong>
          <span>Khả dụng từ {dateText(order.payoutAvailableAt)}</span>
        </div>
      </article>)}
    </div>}
    <form className="withdraw-form" onSubmit={(e) => { e.preventDefault(); withdrawal.mutate(); }}>
      <h2>Tạo yêu cầu rút tiền</h2>
      <p className="withdraw-hint">Chỉ rút được phần “Số dư khả dụng”. Tiền đang giữ sẽ tự chuyển sang khả dụng sau thời gian bảo vệ giao dịch.</p>
      <input type="number" placeholder="Số tiền" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
      <input placeholder="Tên ngân hàng" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} required />
      <input placeholder="Số tài khoản" value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} required />
      <input placeholder="Tên chủ tài khoản" value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} required />
      <textarea placeholder="Ghi chú" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      {withdrawal.isError && <p className="form-error">{withdrawal.error?.response?.data?.error || "Không tạo được yêu cầu rút tiền."}</p>}
      <button disabled={withdrawal.isLoading}>{withdrawal.isLoading ? "Đang gửi..." : "Gửi yêu cầu rút tiền"}</button>
    </form>
    <div className="withdraw-list">
      <h2>Lịch sử rút tiền</h2>
      {!data.withdrawals.length && <p>Chưa có yêu cầu rút tiền.</p>}
      {data.withdrawals.map((item) => <article key={item._id}>
        <div><strong>{money(item.amount)} VND</strong><p>{item.bankName} · {item.bankAccount} · {item.accountName}</p></div>
        <span>{statusLabels[item.status] || item.status}</span>
      </article>)}
    </div>
  </div></div>;
};

export default Wallet;
