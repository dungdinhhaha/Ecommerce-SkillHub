import React from "react";
import { Link } from "react-router-dom";
import "./ProjectCard.scss";

const ProjectCard = ({ item }) => {
  const title = item.title || item.cat || "Listing SkillHub";
  const seller = item.userId?.username || item.username || "talent";
  const cover = item.cover || item.img || "/img/demo.png";
  const avatar = item.userId?.img || item.pp || "/img/noavatar.png";
  const to = item._id ? `/gig/${item._id}` : `/gigs?search=${encodeURIComponent(title)}`;

  return (
    <Link to={to} className="link">
      <div className="project-card">
        <img src={cover} alt={title} onError={(e) => { e.currentTarget.src = "/img/demo.png"; }} />
        <div className="info">
          <img src={avatar} alt={seller} onError={(e) => { e.currentTarget.src = "/img/noavatar.png"; }} />
          <div className="texts">
            <h2>{title}</h2>
            <span>{seller}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
