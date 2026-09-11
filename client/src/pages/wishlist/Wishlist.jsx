import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import GigCard from "../../components/gigCard/GigCard";
import request from "../../utils/request.utils";
import "./Wishlist.scss";

const Wishlist = () => {
  const queryClient = useQueryClient();
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => request.get("/wishlist").then((res) => res.data.data),
  });
  const toggle = useMutation({
    mutationFn: (gigId) => request.post(`/wishlist/${gigId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  if (isLoading) return <div className="wishlist"><div className="container"><p>Đang tải danh sách yêu thích...</p></div></div>;
  if (isError) return <div className="wishlist"><div className="container"><p>Bạn cần đăng nhập để xem danh sách yêu thích.</p></div></div>;

  return <div className="wishlist"><div className="container">
    <div className="title"><h1>Danh sách yêu thích</h1><span>{data.length} mục đã lưu</span></div>
    {!data.length && <div className="empty"><h2>Chưa lưu sản phẩm/dịch vụ nào</h2><p>Khi thấy gig phù hợp, bấm “Lưu” để quay lại sau.</p></div>}
    <div className="wishlist-grid">
      {data.map((item) => <div className="wish-item" key={item._id}>
        {item.gig && <GigCard item={item.gig} />}
        <button onClick={() => toggle.mutate(item.gig?._id)}>Bỏ lưu</button>
      </div>)}
    </div>
  </div></div>;
};

export default Wishlist;
