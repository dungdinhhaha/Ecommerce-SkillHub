import React from "react";
import "./TrustedBy.scss";

const TrustedBy = () => {
  return (
    <div className="trusted-by">
      <div className="container">
        <span className="promise-kicker">Lời hứa từ SkillHub</span>
        <p>
          Tụi mình sẽ luôn cố gắng để mỗi đơn hàng được rõ ràng, an toàn và làm bạn hài lòng hơn sau từng lần trải nghiệm.
        </p>
        <div className="promise-pills">
          <span>Giữ tiền bảo vệ</span>
          <span>Lắng nghe phản hồi</span>
          <span>Đồng hành đến khi ổn</span>
        </div>
      </div>
    </div>
  );
};

export default TrustedBy;
