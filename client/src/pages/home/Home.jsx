import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import "./Home.scss";

import {
  TrustedBy,
  Featured,
  Slide,
  CatCard,
  Features,
  ProjectCard,
} from "../../components";
import GigCard from "../../components/gigCard/GigCard";
import { cards, projects } from "../../data";
import request from "../../utils/request.utils";

const Home = () => {
  const [showWelcome, setShowWelcome] = useState(false);
  const { data: newest = [] } = useQuery({
    queryKey: ["home-gigs-newest"],
    queryFn: () => request.get("/gigs?sort=createdAt").then((res) => res.data.data),
  });
  const { data: digital = [] } = useQuery({
    queryKey: ["home-gigs-digital"],
    queryFn: () => request.get("/gigs?type=digital_product&sort=createdAt").then((res) => res.data.data),
  });
  const { data: services = [] } = useQuery({
    queryKey: ["home-gigs-services"],
    queryFn: () => request.get("/gigs?type=skill_service&sort=sales").then((res) => res.data.data),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => request.get("/categories").then((res) => res.data.data),
    staleTime: 5 * 60 * 1000,
  });
  const browseGroups = [
    {
      title: "Theo loại giao dịch",
      items: [
        { label: "Sản phẩm số", desc: "Mua xong tải file/source/template", to: "/gigs?type=digital_product" },
        { label: "Dịch vụ kỹ năng", desc: "Thuê talent làm theo yêu cầu", to: "/gigs?type=skill_service" },
      ],
    },
    {
      title: "Theo danh mục",
      items: categories.map((cat) => ({ label: cat.name, desc: `${cat.description || "Khám phá danh mục"} · ${cat.count || 0} mục`, to: `/gigs?cat=${cat.slug}` })),
    },
  ];
  const voucherCode = "SKILLHUB20";
  useEffect(() => {
    const hasSeen = localStorage.getItem("skillhubWelcomeVoucherSeen");
    if (!hasSeen) {
      const timer = setTimeout(() => setShowWelcome(true), 450);
      return () => clearTimeout(timer);
    }
  }, []);
  const closeWelcome = () => {
    localStorage.setItem("skillhubWelcomeVoucherSeen", "true");
    setShowWelcome(false);
  };
  const copyVoucher = async () => {
    try {
      await navigator.clipboard.writeText(voucherCode);
      closeWelcome();
      window.location.href = `/gigs?search=${encodeURIComponent(voucherCode)}`;
    } catch (err) {
      closeWelcome();
      window.location.href = "/gigs";
    }
  };

  return (
    <div className="home">
      {showWelcome && <div className="welcome-modal" role="dialog" aria-modal="true" aria-label="Mã giảm giá chào mừng">
        <div className="welcome-backdrop" onClick={closeWelcome} />
        <div className="welcome-card">
          <button className="welcome-close" type="button" onClick={closeWelcome} aria-label="Đóng">×</button>
          <span className="welcome-badge">Chào mừng bạn đến với SkillHub</span>
          <h2>Tìm người giỏi, mua sản phẩm hay</h2>
          <p className="welcome-message">Giao dịch an tâm hơn với thanh toán bảo vệ, dữ liệu được giữ riêng tư và hỗ trợ khi cần.</p>
          <div className="welcome-code">
            <small>Mã giảm giá hôm nay</small>
            <strong>{voucherCode}</strong>
          </div>
          <div className="welcome-actions">
            <button type="button" onClick={copyVoucher}>Dùng mã ngay</button>
            <button className="ghost" type="button" onClick={closeWelcome}>Để sau</button>
          </div>
        </div>
      </div>}
      <Featured />
      <TrustedBy />
      <section className="browse-home">
        <div className="container">
          <div className="section-title">
            <h2>Khám phá SkillHub</h2>
            <p>Chọn nhanh theo sản phẩm số, dịch vụ kỹ năng hoặc nhóm nhu cầu.</p>
          </div>
          {browseGroups.map((group) => <div className="browse-group" key={group.title}>
            <h3>{group.title}</h3>
            <div className="browse-grid">
              {group.items.map((item) => <Link className="browse-card" to={item.to} key={item.to}>
                <strong>{item.label}</strong>
                <span>{item.desc}</span>
              </Link>)}
            </div>
          </div>)}
        </div>
      </section>
      <Slide slidesToShow={5} arrowsScroll={5}>
        {cards.map((card) => (
          <CatCard item={card} key={card.id} />
        ))}
      </Slide>
      <HomeGigSection title="Mới trên SkillHub" desc="Các sản phẩm/dịch vụ vừa được duyệt." items={newest.slice(0, 4)} />
      <HomeGigSection title="Sản phẩm số nổi bật" desc="Thanh toán xong là tải source/template/tài liệu." items={digital.slice(0, 4)} />
      <HomeGigSection title="Dịch vụ kỹ năng bán chạy" desc="Thuê talent làm theo yêu cầu, tiền được SkillHub giữ bảo vệ giao dịch." items={services.slice(0, 4)} />
      <Features />
      <Slide slidesToShow={4} arrowsScroll={4}>
        {projects.map((project) => (
          <ProjectCard item={project} key={project.id} />
        ))}
      </Slide>
    </div>
  );
};

const HomeGigSection = ({ title, desc, items }) => {
  if (!items.length) return null;
  return <section className="home-gigs">
    <div className="container">
      <div className="section-title">
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>
      <div className="home-gig-grid">
        {items.map((gig) => <GigCard item={gig} key={gig._id} />)}
      </div>
    </div>
  </section>;
};

export default Home;
