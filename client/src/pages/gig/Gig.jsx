import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Slider } from "infinite-react-carousel";

import "./Gig.scss";

import { Reviews } from "../../components";
import GigCard from "../../components/gigCard/GigCard";
import request from "../../utils/request.utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { addCartItem } from "../../utils/cart.utils";

const Gig = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["gig"],
    queryFn: () => request.get(`/gigs/${id}`).then((res) => res.data.data),
  });
  const { data: wishlistItems = [], refetch: refetchWishlist } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => request.get("/wishlist").then((res) => res.data.data),
    enabled: !!currentUser,
  });
  const wishlist = useMutation({
    mutationFn: () => request.post(`/wishlist/${id}`),
    onSuccess: () => refetchWishlist(),
  });
  const { data: related = [] } = useQuery({
    queryKey: ["related-gigs", data?.cat, id],
    queryFn: () => request.get(`/gigs?cat=${data.cat}&sort=sales`).then((res) => res.data.data.filter((item) => item._id !== id).slice(0, 3)),
    enabled: !!data?.cat,
  });
  const rating = data?.starNumber ? Number(data.totalStars / data.starNumber).toFixed(1) : null;
  const roundedRating = rating ? Math.round(Number(rating)) : 0;
  const isDigital = data?.listingType === "digital_product";
  const promotion = data?.promotion;
  const displayPrice = promotion?.finalPrice || data?.salePrice || data?.price || 0;
  const isSaved = wishlist.data?.data?.data?.saved ?? wishlistItems.some((item) => item.gig?._id === id || item.gig === id);
  const requireLogin = (nextPath = `/gig/${id}`) => {
    if (currentUser) return false;
    navigate(`/login?redirect=${encodeURIComponent(nextPath)}`);
    return true;
  };
  const handleContactSeller = async () => {
    if (requireLogin(`/gig/${id}`)) return;
    if (currentUser?._id === data.userId?._id) {
      alert("Đây là listing của bạn, không thể tự nhắn tin với chính mình.");
      return;
    }
    try {
      const res = await request.post("/conversation", { to: data.userId._id, gigId: data._id });
      navigate(`/message/${res.data.data.id}`);
    } catch (err) {
      alert("Chưa mở được cuộc trò chuyện, thử lại sau nha.");
    }
  };
  const handleBuy = () => {
    if (requireLogin(`/pay/${data._id}`)) return;
    navigate(`/pay/${data._id}`);
  };
  const handleAddToCart = () => {
    const result = addCartItem(data);
    alert(result.exists ? "Listing này đã có trong giỏ hàng." : "Đã thêm vào giỏ hàng.");
  };
  const handleWishlist = () => {
    if (requireLogin(`/gig/${id}`)) return;
    wishlist.mutate();
  };
  useEffect(() => {
    if (!data) return;
    document.title = `${data.title} | SkillHub`;
    const schemaId = "skillhub-product-schema";
    document.getElementById(schemaId)?.remove();
    const script = document.createElement("script");
    script.id = schemaId;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: data.title,
      image: [data.cover, ...(data.images || [])].filter(Boolean),
      description: data.shortDesc || data.description,
      brand: { "@type": "Brand", name: "SkillHub" },
      offers: { "@type": "Offer", priceCurrency: "VND", price: displayPrice, availability: "https://schema.org/InStock" },
      aggregateRating: data.starNumber ? { "@type": "AggregateRating", ratingValue: rating, reviewCount: data.starNumber } : undefined,
    });
    document.head.appendChild(script);
    return () => document.getElementById(schemaId)?.remove();
  }, [data, rating, displayPrice]);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;

  return (
    <div className="gig">
      {!isLoading && data && (
        <div className="container">
          <div className="left">
            <span className="breadcrumbs">
              <button type="button" className="breadcrumb-button" onClick={() => navigate("/gigs")}>
                SkillHub
              </button>
              &gt; {isDigital ? "Sản phẩm số" : "Dịch vụ kỹ năng"} &gt; {data.cat}
            </span>
            <span className="listing-badge">{isDigital ? "Sản phẩm số - tải sau thanh toán" : "Dịch vụ kỹ năng - làm theo yêu cầu"}</span>
            {promotion && <span className="listing-badge sale">Đang khuyến mãi -{promotion.discountPercent}% · {promotion.title}</span>}
            <h1>{data.title}</h1>
            <div className="user">
              <img
                className="pp"
                src={data.userId.img || "/img/noavatar.png"}
                alt=""
              />
              <span>{data.userId.username}</span>
              {rating ? (
                <div className="stars">
                  {Array(roundedRating)
                    .fill()
                    .map((item, i) => (
                      <img src="/img/star.png" alt="" key={i} />
                    ))}
                  <span>{rating} ({data.starNumber} đánh giá)</span>
                </div>
              ) : (
                <div className="stars muted">Chưa có đánh giá</div>
              )}
            </div>
            <Slider slidesToShow={1} arrowsScroll={1} className="slider">
              <img src={data.cover} />
              {data.images.map((i, id) => (
                <img src={i} alt="" key={id} />
              ))}
            </Slider>
            <h2>{isDigital ? "Sản phẩm này gồm những gì?" : "Dịch vụ này làm gì?"}</h2>
            <p>{data.description}</p>
            <div className="trust-panel">
              <div><strong>Thanh toán bảo vệ</strong><span>SkillHub ghi nhận đơn bằng mã DH và theo dõi trạng thái thanh toán.</span></div>
              <div><strong>Giữ tiền 10 ngày</strong><span>Talent chỉ rút được sau thời gian bảo vệ giao dịch.</span></div>
              <div><strong>Tranh chấp minh bạch</strong><span>Buyer có thể gửi bằng chứng để admin xử lý hoàn tiền.</span></div>
            </div>
            <div className="faq">
              <h2>Câu hỏi thường gặp</h2>
              <details open><summary>Sau khi mua tôi nhận gì?</summary><p>{isDigital ? "Bạn được tải file sản phẩm số trong thư viện đã mua." : "Talent sẽ bàn giao kết quả trong trang đơn hàng."}</p></details>
              <details><summary>Nếu kết quả chưa đúng thì sao?</summary><p>Bạn có thể yêu cầu chỉnh sửa trong số lần sửa của gói, hoặc mở tranh chấp/hoàn tiền để admin xử lý.</p></details>
              <details><summary>Có được giao dịch ngoài nền tảng không?</summary><p>Không. Chat đã chặn số điện thoại/email/link liên hệ để bảo vệ cả buyer và talent.</p></details>
            </div>
            <div className="seller">
              <h2>Thông tin talent</h2>
              <div className="user">
                <img
                  src={data.userId.img ? data.userId.img : "/img/noavatar.png"}
                  alt=""
                />
                <div className="info">
                  <span>{data.userId.username}</span>
                  {rating ? (
                    <div className="stars">
                      {Array(roundedRating)
                        .fill()
                        .map((item, i) => (
                          <img src="/img/star.png" alt="" key={i} />
                        ))}
                      <span>
                        {rating} ({data.starNumber} đánh giá)
                      </span>
                    </div>
                  ) : (
                    <div className="stars muted">Chưa có đánh giá</div>
                  )}
                  <button onClick={handleContactSeller}>Nhắn tin với talent</button>
                </div>
              </div>
              <div className="box">
                <div className="items">
                  <div className="item">
                    <span className="title">Quốc gia</span>
                    <span className="desc">{data.userId.country}</span>
                  </div>
                  <div className="item">
                    <span className="title">Tham gia</span>
                    <span className="desc">
                      {new Date(data.userId.createdAt).toLocaleString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="item">
                    <span className="title">Loại listing</span>
                    <span className="desc">{isDigital ? "Sản phẩm số" : "Dịch vụ kỹ năng"}</span>
                  </div>
                  <div className="item">
                    <span className="title">Đã bán</span>
                    <span className="desc">{data.sales || 0} đơn</span>
                  </div>
                  <div className="item">
                    <span className="title">Ngôn ngữ</span>
                    <span className="desc">Tiếng Việt</span>
                  </div>
                </div>
                <hr />
                <p>{data.userId.description || data.userId.desc || "Talent chưa cập nhật mô tả hồ sơ."}</p>
              </div>
            </div>
            <Reviews data={data} />
            {!!related.length && <div className="related-products">
              <h2>Sản phẩm/dịch vụ liên quan</h2>
              <div>{related.map((gig) => <GigCard item={gig} key={gig._id} />)}</div>
            </div>}
          </div>
          <div className="right">
            <div className="price">
              <h3>{data.shortTitle}</h3>
              <div className="price-stack">
                {promotion && <small>{Number(promotion.originalPrice || data.price || 0).toLocaleString("vi-VN")}đ</small>}
                <h2>{Number(displayPrice).toLocaleString("vi-VN")}đ</h2>
              </div>
            </div>
            {promotion && <div className="promotion-note">
              <strong>Ưu đãi từ talent</strong>
              <span>Mã {promotion.code} đang giảm {Number(promotion.discountAmount).toLocaleString("vi-VN")}đ cho listing này.</span>
            </div>}
            <p>{data.shortDesc}</p>
            <div className="details">
              <div className="item">
                <img src="/img/clock.png" alt="" />
                <span>{isDigital ? "Tải ngay sau thanh toán" : `${data.deliveryTime} ngày bàn giao`}</span>
              </div>
              <div className="item">
                <img src="/img/recycle.png" alt="" />
                <span>{data.revisionNumber} lần chỉnh sửa</span>
              </div>
            </div>
            <div className="features">
              {data.features.map((feature, key) => (
                <div className="item" key={key}>
                  <img src="/img/greencheck.png" alt="" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <button onClick={handleBuy}>{isDigital ? "Mua và tải sản phẩm" : "Thuê talent ngay"}</button>
            <button className="cart-button" onClick={handleAddToCart}>Thêm vào giỏ hàng</button>
            <button className={`save-button ${isSaved ? "saved" : ""}`} onClick={handleWishlist} disabled={wishlist.isLoading}>{isSaved ? "Đã lưu yêu thích ✓" : "Lưu vào yêu thích"}</button>
            <small className="safe-note">Thanh toán qua SePay · Mã đơn riêng DH · Có hỗ trợ tranh chấp/hoàn tiền</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gig;
