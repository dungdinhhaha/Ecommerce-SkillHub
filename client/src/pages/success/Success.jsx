import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Success = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const timer = window.setTimeout(() => navigate("/orders"), 2000);
    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <div>
      Thanh toán đã được tiếp nhận. Đang chuyển đến đơn hàng...
    </div>
  );
};

export default Success;
