import React, { useState } from "react";
import "./Featured.scss";
import { useNavigate } from "react-router-dom";
import SearchBox from "../searchBox/SearchBox";

const popularLinks = [
  { label: "Website React", query: "react", cat: "web" },
  { label: "PowerPoint", query: "powerpoint", cat: "design" },
  { label: "Template CV", query: "cv", cat: "education" },
  { label: "Edit video", query: "video", cat: "video" },
];

const Featured = () => {
  const [input, setInput] = useState("");
  const navigate = useNavigate();
  const handleSearch = (keyword) => {
    navigate(keyword ? `/gigs?search=${encodeURIComponent(keyword)}` : "/gigs");
  };

  return (
    <div className="featured">
      <div className="container">
        <div className="left">
          <h1>
            Tìm người giỏi, mua sản phẩm hay
          </h1>
          <SearchBox className="hero-search" value={input} onChange={setInput} onSearch={handleSearch} placeholder="Tìm source code, PowerPoint, thiết kế logo..." />
          <div className="popular">
            <span>Gợi ý:</span>
            {popularLinks.map((item) => <button key={item.label} onClick={() => navigate(`/gigs?cat=${item.cat}&search=${encodeURIComponent(item.query)}`)}>{item.label}</button>)}
          </div>
        </div>
        <div className="right">
          <img src="/img/skillhub-hero-vietnamese-woman-bow.png" alt="Người phụ nữ Việt Nam mỉm cười chào mừng người dùng SkillHub" />
        </div>
      </div>
    </div>
  );
};

export default Featured;
