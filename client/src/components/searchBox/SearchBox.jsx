import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import request from "../../utils/request.utils";
import "./SearchBox.scss";

const SearchBox = ({ value, onChange, onSearch, placeholder = "Tìm trên SkillHub", compact = false, className = "" }) => {
  const navigate = useNavigate();
  const [isFocused, setIsFocused] = useState(false);
  const keyword = value.trim();
  const recentSearches = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("skillhub_recent_searches") || "[]").slice(0, 4);
    } catch {
      return [];
    }
  }, [value]);
  const popularSearches = ["React website", "PowerPoint", "Template CV", "API Node.js"];
  const { data: suggestions = [] } = useQuery({
    queryKey: ["search-suggestions", keyword],
    queryFn: () => request.get(`/gigs?search=${encodeURIComponent(keyword)}&sort=createdAt`).then((res) => res.data.data.slice(0, 5)),
    enabled: keyword.length >= 2,
  });

  const submit = (event) => {
    event?.preventDefault();
    if (keyword) {
      const next = [keyword, ...recentSearches.filter((item) => item.toLowerCase() !== keyword.toLowerCase())].slice(0, 5);
      localStorage.setItem("skillhub_recent_searches", JSON.stringify(next));
    }
    if (onSearch) return onSearch(keyword);
    navigate(keyword ? `/gigs?search=${encodeURIComponent(keyword)}` : "/gigs");
  };
  const pickKeyword = (nextKeyword) => {
    onChange(nextKeyword);
    if (onSearch) return onSearch(nextKeyword);
    navigate(`/gigs?search=${encodeURIComponent(nextKeyword)}`);
  };
  const showHelper = isFocused && !keyword && (recentSearches.length || popularSearches.length);
  const showSuggestions = isFocused && !!suggestions.length;

  return <form className={`search-box ${compact ? "compact" : ""} ${className}`} onSubmit={submit} role="search" onFocus={() => setIsFocused(true)} onBlur={() => window.setTimeout(() => setIsFocused(false), 160)}>
    <div className="search-box-input">
      {!compact && <img src="/img/search.png" alt="Tìm kiếm" />}
      <input type="search" aria-label={placeholder} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete="off" />
      {!!value && <button className="search-clear" type="button" aria-label="Xóa từ khóa" onClick={() => onChange("")}>×</button>}
    </div>
    <button type="submit">{compact ? "Tìm" : "Tìm kiếm"}</button>
    {showHelper && <div className="search-suggestions helper">
      {!!recentSearches.length && <div className="suggest-section"><small>Tìm gần đây</small>{recentSearches.map((item) => <button type="button" key={item} onClick={() => pickKeyword(item)}><span>{item}</span></button>)}</div>}
      <div className="suggest-section"><small>Phổ biến trên SkillHub</small>{popularSearches.map((item) => <button type="button" key={item} onClick={() => pickKeyword(item)}><span>{item}</span></button>)}</div>
    </div>}
    {showSuggestions && <div className="search-suggestions">
      {suggestions.map((gig) => <button type="button" key={gig._id} onClick={() => navigate(`/gig/${gig._id}`)}>
        <img src={gig.cover || "/img/demo.png"} alt={gig.title || "Sản phẩm SkillHub"} onError={(e) => { e.currentTarget.src = "/img/demo.png"; }} />
        <span>{gig.title}</span>
        <strong>{Number(gig.salePrice || gig.price || 0).toLocaleString("vi-VN")}đ</strong>
      </button>)}
      <button type="submit" className="view-all">Xem tất cả kết quả cho “{keyword}”</button>
    </div>}
  </form>;
};

export default SearchBox;
