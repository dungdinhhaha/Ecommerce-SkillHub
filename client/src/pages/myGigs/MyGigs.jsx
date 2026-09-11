import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import "./MyGigs.scss";
import request from "../../utils/request.utils";

const MyGigs = () => {
  const queryClient = useQueryClient();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const mutation = useMutation({
    mutationFn: (id) =>
      request.delete(`/gigs/${id}`).then((res) => res.data.data),
    onSuccess: () => queryClient.invalidateQueries("myGigs"),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["myGigs"],
    queryFn: () =>
      request
        .get(`/gigs?userId=${currentUser._id}`)
        .then((res) => res.data.data),
  });

  if (isLoading) return <div className="my-gigs"><div className="container"><p>Đang tải listing...</p></div></div>;
  if (isError) return <div className="my-gigs"><div className="container"><p>Không tải được listing của bạn.</p></div></div>;

  const handleDelete = (id) => {
    mutation.mutate(id);
  };

  return (
    <div className="my-gigs">
      <div className="container">
        <div className="title">
          <div>
            <span className="sh-badge service">Talent listing</span>
            <h1>Sản phẩm/dịch vụ của tôi</h1>
            <p>Quản lý trạng thái duyệt, giá bán, lượt bán và nội dung đang hiển thị trên SkillHub.</p>
          </div>
          <Link to="/add">
            <button>Đăng listing mới</button>
          </Link>
        </div>
        <table>
          <tbody>
            <tr>
              <th>Hình</th>
              <th>Listing</th>
              <th>Loại</th>
              <th>Giá</th>
              <th>Lượt bán</th>
              <th>Thao tác</th>
            </tr>
            {data && data.length ? (
              data.map((gig) => (
                <tr key={gig._id}>
                  <td>
                    <img className="image" src={gig.cover} alt="" />
                  </td>
                  <td><strong>{gig.title}</strong><small>{gig.approvalStatus === "approved" ? "Đã duyệt" : gig.approvalStatus === "rejected" ? "Bị từ chối" : "Chờ duyệt"}</small></td>
                  <td>{gig.listingType === "digital_product" ? "Sản phẩm số" : "Dịch vụ"}</td>
                  <td>
                    {Number(gig.price || 0).toLocaleString("vi-VN")}đ
                  </td>
                  <td>{gig.sales}</td>
                  <td>
                    <img
                      className="delete"
                      src="./img/delete.png"
                      alt=""
                      onClick={() => handleDelete(gig._id)}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6">Chưa có listing nào. Hãy đăng sản phẩm số hoặc dịch vụ đầu tiên.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyGigs;
