import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Cart.scss";
import { clearCart, getCartItems, removeCartItem } from "../../utils/cart.utils";

const money = (value) => Number(value || 0).toLocaleString("vi-VN");

const Cart = () => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const [items, setItems] = useState(getCartItems);
  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.price || 0), 0), [items]);

  useEffect(() => {
    const sync = () => setItems(getCartItems());
    window.addEventListener("skillhub-cart-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("skillhub-cart-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const checkout = (id) => {
    if (!currentUser) {
      navigate(`/login?redirect=${encodeURIComponent(`/pay/${id}`)}`);
      return;
    }
    navigate(`/pay/${id}`);
  };

  const remove = (id) => setItems(removeCartItem(id));
  const clear = () => {
    clearCart();
    setItems([]);
  };

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-head">
          <div>
            <span className="sh-badge product">Giỏ hàng</span>
            <h1>Listing bạn đang quan tâm</h1>
            <p>Lưu sản phẩm số hoặc dịch vụ kỹ năng trước khi quyết định thanh toán.</p>
          </div>
          {!!items.length && <button className="clear-cart" onClick={clear}>Xoá giỏ hàng</button>}
        </div>

        {!items.length ? (
          <section className="cart-empty">
            <h2>Giỏ hàng đang trống</h2>
            <p>Thử tìm source code, template CV, thiết kế banner hoặc dịch vụ website phù hợp với nhu cầu của bạn.</p>
            <Link className="sh-btn" to="/gigs">Khám phá marketplace</Link>
          </section>
        ) : (
          <div className="cart-layout">
            <section className="cart-list">
              {items.map((item) => (
                <article className="cart-item" key={item._id}>
                  <Link to={`/gig/${item._id}`}>
                    <img src={item.cover || "/img/demo.png"} alt={item.title} onError={(e) => { e.currentTarget.src = "/img/demo.png"; }} />
                  </Link>
                  <div>
                    <span className="cart-type">{item.listingType === "digital_product" ? "Sản phẩm số" : "Dịch vụ kỹ năng"}</span>
                    <Link to={`/gig/${item._id}`}><h2>{item.title}</h2></Link>
                    <p>Talent: {item.seller}</p>
                    {item.originalPrice > item.price && <small className="old-price">{money(item.originalPrice)}đ</small>}
                    <strong>{money(item.price)}đ</strong>
                  </div>
                  <div className="cart-actions">
                    <button onClick={() => checkout(item._id)}>Thanh toán</button>
                    <button className="muted" onClick={() => remove(item._id)}>Xoá</button>
                  </div>
                </article>
              ))}
            </section>
            <aside className="cart-summary">
              <h2>Tạm tính</h2>
              <p><span>Số listing</span><strong>{items.length}</strong></p>
              <p><span>Tổng giá</span><strong>{money(total)}đ</strong></p>
              <small>SkillHub hiện thanh toán từng listing để mỗi đơn có mã DH và trạng thái riêng.</small>
              <button onClick={() => checkout(items[0]._id)}>Thanh toán listing đầu tiên</button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
