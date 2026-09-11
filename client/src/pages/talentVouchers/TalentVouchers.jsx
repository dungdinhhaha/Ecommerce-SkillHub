import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import request from "../../utils/request.utils";
import "./TalentVouchers.scss";

const money = (value) => Number(value || 0).toLocaleString("vi-VN");

const TalentVouchers = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ code: "", title: "", discountType: "percent", discountValue: "", maxDiscount: "", minOrderValue: "", usageLimit: "", expiresAt: "" });
  const vouchers = useQuery({ queryKey: ["my-vouchers"], queryFn: () => request.get("/vouchers").then((res) => res.data.data) });
  const create = useMutation({
    mutationFn: (payload) => request.post("/vouchers", payload),
    onSuccess: () => {
      setForm({ code: "", title: "", discountType: "percent", discountValue: "", maxDiscount: "", minOrderValue: "", usageLimit: "", expiresAt: "" });
      queryClient.invalidateQueries({ queryKey: ["my-vouchers"] });
    },
  });
  const update = useMutation({
    mutationFn: ({ id, payload }) => request.patch(`/vouchers/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-vouchers"] }),
  });
  const submit = (e) => {
    e.preventDefault();
    if (form.discountType === "percent" && Number(form.discountValue || 0) > 30) {
      alert("Talent chỉ được tạo khuyến mãi tối đa 30%.");
      return;
    }
    create.mutate({
      ...form,
      code: form.code.toUpperCase(),
      discountValue: Number(form.discountValue || 0),
      maxDiscount: Number(form.maxDiscount || 0),
      minOrderValue: Number(form.minOrderValue || 0),
      usageLimit: Number(form.usageLimit || 0),
      expiresAt: form.expiresAt || null,
    });
  };
  const data = vouchers.data || [];

  return <main className="talent-vouchers">
    <div className="container">
      <section className="voucher-hero">
        <span className="sh-badge service">Quản lý khuyến mãi</span>
        <h1>Voucher của tôi</h1>
        <p>Tạo ưu đãi cho listing của bạn. Mỗi khuyến mãi giảm tối đa 30%, phần giảm giá sẽ trừ vào doanh thu talent nhận.</p>
      </section>
      <form className="talent-voucher-form" onSubmit={submit}>
        <input placeholder="Mã, ví dụ CODE10" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
        <input placeholder="Tên chương trình" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
          <option value="percent">Giảm theo %</option>
          <option value="fixed">Giảm số tiền</option>
        </select>
        <input type="number" max={form.discountType === "percent" ? 30 : undefined} placeholder={form.discountType === "percent" ? "Giảm % tối đa 30" : "Giảm VND"} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
        <input type="number" placeholder="Giảm tối đa VND" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
        <input type="number" placeholder="Đơn tối thiểu VND" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} />
        <input type="number" placeholder="Giới hạn lượt" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
        <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
        <button disabled={create.isLoading}>Tạo voucher</button>
      </form>
      {vouchers.isLoading ? <p>Đang tải voucher...</p> : !data.length ? <p>Chưa có voucher riêng.</p> : <div className="talent-voucher-list">
        {data.map((voucher) => <article key={voucher._id}>
          <div>
            <h3>{voucher.code} · {voucher.title}</h3>
            <p>{voucher.discountType === "percent" ? `Giảm ${voucher.discountValue}%` : `Giảm ${money(voucher.discountValue)} VND`} {voucher.maxDiscount ? `· Tối đa ${money(voucher.maxDiscount)} VND` : ""}</p>
            <small>Đã dùng {voucher.usedCount}/{voucher.usageLimit || "∞"} · Hết hạn: {voucher.expiresAt ? new Date(voucher.expiresAt).toLocaleDateString("vi-VN") : "Không giới hạn"}</small>
          </div>
          <button onClick={() => update.mutate({ id: voucher._id, payload: { isActive: !voucher.isActive } })}>{voucher.isActive ? "Tắt" : "Bật"}</button>
        </article>)}
      </div>}
    </div>
  </main>;
};

export default TalentVouchers;
