import React from "react";
import { Link } from "react-router-dom";
import "./Features.scss";

const buyerPoints = [
  ["Tải ngay tài nguyên dùng được", "Tìm source code, template, CV, ebook hoặc tài liệu mẫu để dùng ngay cho học tập, công việc và dự án."],
  ["Thuê talent phù hợp ngân sách", "So sánh giá, mô tả, thời gian bàn giao và đánh giá để chọn đúng người làm việc bạn cần."],
  ["Mọi trao đổi đều rõ ràng", "Yêu cầu, file bàn giao và phản hồi được lưu lại trong đơn hàng, giúp bạn theo dõi dễ hơn."],
];

const sellerPoints = [
  "Đưa kỹ năng của bạn lên một gian hàng riêng",
  "Bán template, source code, tài liệu hoặc dịch vụ theo yêu cầu",
  "Quản lý đơn, bàn giao và phản hồi khách hàng tập trung",
  "Tăng uy tín bằng đánh giá, số đơn hoàn thành và hồ sơ đẹp",
];

const Features = () => {
  return (
    <>
      <section className="features skillhub-flow">
        <div className="container">
          <div className="item">
            <span className="sh-badge product">Vì sao chọn SkillHub?</span>
            <h1>Cần file mẫu hay cần người làm? SkillHub giúp bạn bắt đầu nhanh hơn</h1>
            {buyerPoints.map(([title, desc]) => <div className="feature-line" key={title}>
              <img src="/img/check.png" alt="" />
              <div><strong>{title}</strong><p>{desc}</p></div>
            </div>)}
          </div>
          <div className="item flow-card">
            {["Tìm đúng nhu cầu", "Chọn sản phẩm/dịch vụ", "Trao đổi yêu cầu", "Nhận kết quả online", "Đánh giá trải nghiệm"].map((step, index) => <div className="flow-step" key={step}>
              <span>{index + 1}</span>
              <strong>{step}</strong>
            </div>)}
          </div>
        </div>
      </section>
      <section className="features bg-blue skillhub-business">
        <div className="container">
          <div className="item">
            <span className="sh-badge service">Dành cho người có kỹ năng</span>
            <h1>
              Biến thứ bạn giỏi thành sản phẩm có thể bán
            </h1>
            <p>
              Một bản CV đẹp, một template web, một bộ slide, một kỹ năng edit video — nếu nó giúp người khác tiết kiệm thời gian, nó có thể trở thành listing trên SkillHub.
            </p>
            {sellerPoints.map((point) => <div className="title" key={point}>
              <img src="/img/check.png" alt="" />
              {point}
            </div>)}
            <div className="button-container">
              <Link to="/add"><button>Đăng bán trên SkillHub</button></Link>
              <Link to="/about"><button className="secondary">Về chúng tôi</button></Link>
            </div>
          </div>
          <div className="item trust-visual">
            <div className="trust-card"><strong>Sản phẩm số</strong><span>Template, source code, ebook, tài liệu, UI kit</span></div>
            <div className="trust-card"><strong>Dịch vụ kỹ năng</strong><span>Website, thiết kế, content, video, học tập</span></div>
            <div className="trust-card"><strong>Hồ sơ uy tín</strong><span>Rating, lượt bán, portfolio và lịch sử hoàn thành</span></div>
            <div className="trust-card"><strong>Nhận online</strong><span>Mua, trao đổi, bàn giao và tải lại trong cùng một nơi</span></div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Features;
