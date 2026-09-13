import React from "react";
import { useNavigate } from "react-router-dom";
import "./GigCard.scss";

const GigCard = ({ item }) => {
  const navigate = useNavigate();
  const rating = item.starNumber ? Number(item.totalStars / item.starNumber).toFixed(1) : null;
  const isDigital = item.listingType === "digital_product";
  const promotion = item.promotion;
  const displayPrice = promotion?.finalPrice || item.salePrice || item.price || 0;
  const originalPrice = promotion?.originalPrice || item.price || 0;
  const openGig = () => navigate(`/gig/${item._id}`);
  const openTalent = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (item.userId?._id) {
      navigate(`/talents/${item.userId._id}`);
    }
  };

  return (
    <article
      className="gig-card"
      key={item.id}
      role="link"
      tabIndex={0}
      onClick={openGig}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          openGig();
        }
      }}
    >
      <div className="cover-wrap">
        <img src={item.cover || "/img/demo.png"} alt={item.title || "Sản phẩm SkillHub"} onError={(e) => { e.currentTarget.src = "/img/demo.png"; }} />
        <span className={`sh-badge ${isDigital ? "product" : "service"}`}>{isDigital ? "Sản phẩm số" : "Dịch vụ"}</span>
        {promotion && <span className="sale-badge">-{promotion.discountPercent}%</span>}
      </div>
      <div className="info">
        <button className="user talent-link" type="button" onClick={openTalent}>
          <img src={item.userId?.img || "/img/noavatar.png"} alt={item.userId?.username || "Talent SkillHub"} onError={(e) => { e.currentTarget.src = "/img/noavatar.png"; }} />
          <span>{item.userId?.username || "Talent SkillHub"}</span>
        </button>
        <h3>{item.title}</h3>
        <p>{item.shortDesc}</p>
        <div className="star">
          <span className="star-icon" aria-hidden="true">★</span>
          {rating ? (
            <>
              <span>{rating}</span>
              <small>({item.starNumber} đánh giá)</small>
            </>
          ) : (
            <small>Chưa có đánh giá</small>
          )}
          <small>· {item.sales || 0} lượt bán</small>
          {item.deliveryTime && <small>· {item.deliveryTime} ngày</small>}
        </div>
      </div>
      <hr />
      <div className="details">
        <span className="cta">Xem chi tiết</span>
        <div className="price">
          <span>{promotion ? "ĐANG KHUYẾN MÃI" : item.listingType === "digital_product" ? "TẢI NGAY" : "GIÁ TỪ"}</span>
          {promotion && <small className="old-price">{Number(originalPrice).toLocaleString("vi-VN")}đ</small>}
          <h2>
            {Number(displayPrice).toLocaleString("vi-VN")}đ
          </h2>
        </div>
      </div>
    </article>
  );
};

export default GigCard;
