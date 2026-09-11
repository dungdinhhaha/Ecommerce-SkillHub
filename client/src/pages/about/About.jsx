import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./About.scss";

const About = () => {
  const [sent, setSent] = useState(false);
  const handleContactSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    e.currentTarget.reset();
  };

  return <div className="about-page">
    <section className="about-hero">
      <div className="container">
        <div>
          <span className="sh-badge product">Về SkillHub</span>
          <h1>SkillHub giúp ý tưởng của bạn thành sản phẩm nhanh hơn</h1>
          <p>Một nơi để tìm template, source code, tài liệu, hoặc thuê người có kỹ năng làm website, thiết kế, content, video và học tập. Ít vòng vo hơn, nhiều lựa chọn thực tế hơn.</p>
          <div className="about-actions">
            <Link className="sh-btn" to="/gigs">Khám phá marketplace</Link>
            <Link className="sh-btn secondary" to="/add">Trở thành talent</Link>
          </div>
        </div>
        <div className="about-card-stack">
          <article><strong>Marketplace số</strong><span>Sản phẩm số và dịch vụ kỹ năng trong cùng một nền tảng</span></article>
          <article><strong>Talent Việt</strong><span>Người bán là sinh viên, freelancer và người có kỹ năng thực tế</span></article>
          <article><strong>Nhận online</strong><span>Tìm kiếm, trao đổi, bàn giao và tải lại sản phẩm ngay trên web</span></article>
        </div>
      </div>
    </section>
    <section className="about-section">
      <div className="container">
        <h2>Khách hàng dùng SkillHub để làm gì?</h2>
        <div className="about-grid">
          {[
            ["Tìm tài nguyên dùng ngay", "Mẫu CV, slide, source code, UI kit, ebook và tài liệu học tập giúp tiết kiệm thời gian bắt đầu."],
            ["Thuê người làm phần khó", "Khi cần website, thiết kế, content hoặc video, bạn có thể chọn talent theo giá và mô tả rõ ràng."],
            ["Theo dõi tiến độ dễ hơn", "Yêu cầu, phản hồi và file bàn giao nằm trong cùng một đơn hàng, không bị trôi mất như chat riêng."],
            ["Lưu lại mọi thứ đã mua", "Sản phẩm số, kết quả bàn giao và lịch sử đơn hàng có thể xem lại khi cần."],
          ].map(([title, desc]) => <article key={title}><span>✓</span><h3>{title}</h3><p>{desc}</p></article>)}
        </div>
      </div>
    </section>
    <section className="about-section soft">
      <div className="container two-cols">
        <div>
          <h2>Dành cho buyer</h2>
          <p>SkillHub phù hợp với người cần làm nhanh: sinh viên cần tài liệu/template, chủ shop cần banner/content, nhóm dự án cần source code hoặc landing page.</p>
        </div>
        <div>
          <h2>Dành cho talent</h2>
          <p>Talent có thể đóng gói kỹ năng thành listing dễ hiểu, xây dựng hồ sơ uy tín và biến các sản phẩm số đã làm thành nguồn thu lâu dài.</p>
        </div>
      </div>
    </section>
    <section className="about-section contact-section" id="contact">
      <div className="container contact-layout">
        <div className="contact-copy">
          <span className="sh-badge product">Liên hệ SkillHub</span>
          <h2>Cần hỗ trợ đơn hàng, thanh toán hoặc hợp tác?</h2>
          <p>Gửi thông tin cho SkillHub, đội hỗ trợ sẽ ưu tiên các vấn đề liên quan đến đơn hàng, thanh toán, bàn giao file và tranh chấp.</p>
          <div className="contact-info">
            <p><strong>Email</strong><span>support@skillhub.local</span></p>
            <p><strong>Thời gian</strong><span>8:00 - 21:00 hằng ngày</span></p>
            <p><strong>Địa chỉ</strong><span>Khu Công nghệ phần mềm, Đại học Quốc gia TP.HCM, Thủ Đức, TP.HCM</span></p>
          </div>
        </div>
        <form className="contact-form" onSubmit={handleContactSubmit}>
          <label>Họ tên<input name="name" placeholder="Nguyễn Văn A" required /></label>
          <label>Email<input name="email" type="email" placeholder="ban@email.com" required /></label>
          <label>Chủ đề<select name="topic" defaultValue="order"><option value="order">Hỗ trợ đơn hàng</option><option value="payment">Thanh toán</option><option value="seller">Trở thành talent</option><option value="other">Khác</option></select></label>
          <label>Nội dung<textarea name="message" placeholder="Mô tả vấn đề bạn cần SkillHub hỗ trợ..." required /></label>
          <button type="submit">Gửi liên hệ</button>
          {sent && <small>Đã ghi nhận nội dung liên hệ demo. Khi triển khai thật có thể nối email/API hỗ trợ.</small>}
        </form>
      </div>
    </section>
    <section className="about-section map-section">
      <div className="container">
        <div className="map-head">
          <span className="sh-badge service">Google Maps</span>
          <h2>Địa chỉ công ty</h2>
          <p>SkillHub đặt thông tin văn phòng demo tại TP.HCM để người dùng dễ liên hệ và tăng độ tin cậy.</p>
        </div>
        <div className="map-card">
          <iframe
            title="Bản đồ địa chỉ SkillHub"
            src="https://www.google.com/maps?q=Khu%20C%C3%B4ng%20ngh%E1%BB%87%20ph%E1%BA%A7n%20m%E1%BB%81m%20%C4%90HQG%20TPHCM&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  </div>;
};

export default About;
