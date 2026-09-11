import React from "react";
import { Link } from "react-router-dom";
import "./ProjectCard.scss";

const ProjectCard = ({ item }) => {
  return (
    <Link to={`/gigs?search=${encodeURIComponent(item.cat)}`} className="link">
      <div className="project-card">
        <img src={item.img} alt="" onError={(e) => { e.currentTarget.src = "/img/demo.png"; }} />
        <div className="info">
          <img src={item.pp} alt="" onError={(e) => { e.currentTarget.src = "/img/noavatar.png"; }} />
          <div className="texts">
            <h2>{item.cat}</h2>
            <span>{item.username}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
