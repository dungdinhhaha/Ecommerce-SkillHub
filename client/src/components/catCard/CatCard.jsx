import React from "react";
import { Link } from "react-router-dom";
import "./CatCard.scss";

const CatCard = ({ item }) => {
  return (
    <Link className="cat-card-link" to={item.link || `/gigs?cat=${item.cat || ""}`}>
      <div className={`cat-card cat-${item.cat || item.id}`}>
        {item.img && <img src={item.img} alt={item.title} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
        <span className="icon">{item.icon || "✦"}</span>
        <span className="title">{item.title}</span>
        <span className="desc">{item.desc}</span>
      </div>
    </Link>
  );
};

export default CatCard;
