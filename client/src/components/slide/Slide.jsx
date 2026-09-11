import React from "react";
import "./Slide.scss";

const Slide = ({ children }) => {
  return (
    <div className="slide">
      <div className="container">
        <div className="slider-track">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Slide;
