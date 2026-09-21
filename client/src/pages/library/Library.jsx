import React from "react";
import { useQuery } from "@tanstack/react-query";
import request from "../../utils/request.utils";
import { downloadProtectedFile } from "../../utils/download.utils";
import "./Library.scss";

const money = (value) => Number(value || 0).toLocaleString("vi-VN");

const Library = () => {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["digital-library"],
    queryFn: () => request.get("/gigs/order/digital-library").then((res) => res.data.data),
  });

  const download = async (orderId) => {
    await downloadProtectedFile(`/gigs/order/${orderId}/download`, "san-pham-so");
  };

  if (isLoading) return <div className="library"><div className="container"><p>Đang tải thư viện...</p></div></div>;
  if (isError) return <div className="library"><div className="container"><p>Không thể tải thư viện sản phẩm số.</p></div></div>;

  return <div className="library"><div className="container">
    <div className="title"><h1>Thư viện đã mua</h1><span>{data.length} sản phẩm số</span></div>
    {!data.length && <p>Bạn chưa mua sản phẩm số nào.</p>}
    <div className="library-grid">{data.map((item) => <article key={item.orderId}>
      <img src={item.gig.cover || "/img/noavatar.png"} alt="" />
      <div>
        <h2>{item.gig.title}</h2>
        <p>Mã đơn: {item.paymentCode}</p>
        <p>Talent: {item.seller?.username}</p>
        <small>{money(item.price)} VND · {item.gig.fileName || "File sản phẩm"}</small>
      </div>
      <button onClick={() => download(item.orderId)}>Tải lại</button>
    </article>)}</div>
  </div></div>;
};

export default Library;
