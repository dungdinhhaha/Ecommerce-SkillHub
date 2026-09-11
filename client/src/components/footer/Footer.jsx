import React from "react";
import { Link } from "react-router-dom";
import "./Footer.scss";

const Footer = () => {
  const categories = [
    ["Thiết kế", "/gigs?cat=design"],
    ["Lập trình & công nghệ", "/gigs?cat=web"],
    ["Content & SEO", "/gigs?cat=writing"],
    ["Video & media", "/gigs?cat=video"],
    ["Tài liệu học tập", "/gigs?cat=education"],
    ["Sản phẩm số", "/gigs?type=digital_product"],
  ];

  return (
    <div className="footer">
      <div className="container">
        <div className="footer-intro">
          <div>
            <h2>SkillHub<span>.</span></h2>
            <p>Marketplace mua bán sản phẩm số và dịch vụ kỹ năng cho sinh viên, freelancer và nhóm dự án nhỏ.</p>
          </div>
          <Link className="footer-cta" to="/gigs">Khám phá ngay</Link>
        </div>
        <div className="top">
          <div className="item">
            <h2>Danh mục</h2>
            {categories.map(([label, to]) => <Link className="link" to={to} key={label}>{label}</Link>)}
          </div>
          <div className="item">
            <h2>SkillHub</h2>
            <Link className="link" to="/about">Về chúng tôi</Link>
            <Link className="link" to="/about#contact">Liên hệ</Link>
            <Link className="link" to="/about#buyer">Quy trình mua dịch vụ</Link>
            <Link className="link" to="/about#talent">Quy trình bán kỹ năng</Link>
            <Link className="link" to="/policy#fees">Phí nền tảng</Link>
            <Link className="link" to="/policy#support">Trung tâm hỗ trợ</Link>
          </div>
          <div className="item">
            <h2>Pháp lý</h2>
            <Link className="link" to="/policy#owner">Chủ quản nền tảng</Link>
            <Link className="link" to="/policy#terms">Điều khoản dịch vụ</Link>
            <Link className="link" to="/policy#privacy">Bảo mật dữ liệu</Link>
            <Link className="link" to="/policy#electronic-contract">Giao dịch điện tử</Link>
            <Link className="link" to="/policy#refund">Chính sách hoàn tiền</Link>
            <Link className="link" to="/policy#copyright">Quy định bản quyền</Link>
            <Link className="link" to="/policy#dispute">Quy định tranh chấp</Link>
          </div>
          <div className="item">
            <h2>Cộng đồng</h2>
            <Link className="link" to="/add">Trở thành talent</Link>
            <Link className="link" to="/policy#buyer">Quyền/nghĩa vụ buyer</Link>
            <Link className="link" to="/policy#talent">Quyền/nghĩa vụ talent</Link>
            <Link className="link" to="/policy#content">Tiêu chuẩn nội dung</Link>
            <Link className="link" to="/policy#off-platform">Chống giao dịch ngoài</Link>
            <Link className="link" to="/policy#rating">Đánh giá & uy tín</Link>
            <Link className="link" to="/wishlist">Danh sách yêu thích</Link>
          </div>
          <div className="item contact">
            <h2>Liên hệ hỗ trợ</h2>
            <Link className="link" to="/about#contact">Gửi form liên hệ</Link>
            <span>Email: support@skillhub.vn</span>
            <span>Thời gian: 8:00 - 21:00</span>
            <span>Ưu tiên xử lý: đơn hàng, thanh toán, bàn giao file, khiếu nại và tranh chấp</span>
          </div>
        </div>
        <hr />
        <div className="bottom">
          <div className="left">
            <h2>SkillHub</h2>
            <span>© SkillHub Marketplace 2026</span>
          </div>
          <div className="right">
            <div className="link">
              <img src="/img/language.png" alt="" />
              <span>Tiếng Việt</span>
            </div>
            <div className="link">
              <img src="/img/coin.png" alt="" />
              <span>VND</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
