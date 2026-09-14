import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import "./Navbar.scss";
import request from "../../utils/request.utils";
import SearchBox from "../searchBox/SearchBox";

const Navbar = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navSearch, setNavSearch] = useState("");

  const { pathname } = useLocation();

  const isActive = () => {
    window.scrollY > 0 ? setActive(true) : setActive(false);
  };

  useEffect(() => {
    window.addEventListener("scroll", isActive);
    return () => {
      window.removeEventListener("scroll", isActive);
    };
  }, []);

  const handleLogout = async () => {
    await request.post("/auth/logout");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("accessToken");
    navigate("/");
  };
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const getAvatarSrc = (src) => {
    const value = String(src || "").trim();
    if (!value || value === "undefined" || value === "null") return "/img/noavatar.png";
    return value;
  };
  const useDefaultAvatar = (event) => {
    if (event.currentTarget.src.endsWith("/img/noavatar.png")) return;
    event.currentTarget.src = "/img/noavatar.png";
  };
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => request.get("/categories").then((res) => res.data.data),
    staleTime: 5 * 60 * 1000,
  });
  return (
    <div className={active || pathname !== "/" ? "navbar active" : "navbar"}>
      <div className="container">
        <button className="hamburger" onClick={() => setMobileOpen(true)} aria-label="Mở menu">☰</button>
        <div className="logo">
          <Link className="link" to="/">
            <span className="text">SkillHub</span>
            <span className="dot">.</span>
          </Link>
        </div>
        <SearchBox className="nav-search" compact value={navSearch} onChange={setNavSearch} onSearch={(keyword) => {
          navigate(keyword ? `/gigs?search=${encodeURIComponent(keyword)}` : "/gigs");
          setMobileOpen(false);
        }} placeholder="Tìm trên SkillHub" />
        <div className="links">
          <Link className="link" to="/gigs">
            <span>Khám phá</span>
          </Link>
          <Link className="link cart-link" to="/cart">
            <span>Giỏ hàng</span>
          </Link>
          {currentUser?.isAdmin && (
            <Link className="link" to="/admin">
              <span>Admin</span>
            </Link>
          )}
          {!currentUser && (
            <Link className="link" to="login">
              Đăng nhập
            </Link>
          )}
            
          {!currentUser?.isSeller && <Link className="link" to="/register"><span>Trở thành talent</span></Link>}
          {currentUser && (
            <div className="user" onClick={() => setOpen(!open)}>
              <img src={getAvatarSrc(currentUser?.img)} alt="" onError={useDefaultAvatar} />
              <span>{currentUser?.username}</span>
              <b>⌄</b>
              {open && (
                <div className="options">
                  <div className="account-mini">
                    <img src={getAvatarSrc(currentUser?.img)} alt="" onError={useDefaultAvatar} />
                    <div>
                      <strong>{currentUser?.username}</strong>
                      <small>{currentUser?.isAdmin ? "Quản trị viên" : currentUser?.isSeller ? "Talent" : "Buyer"}</small>
                    </div>
                  </div>
                  <Link className="link" to="account">
                    Thông tin tài khoản
                  </Link>
                  {currentUser?.isSeller && (
                    <>
                      <Link className="link" to="talent/dashboard">
                        Dashboard talent
                      </Link>
                      <Link className="link" to="mygigs">
                        Sản phẩm của tôi
                      </Link>
                      <Link className="link" to="add">
                        Đăng sản phẩm/dịch vụ
                      </Link>
                      <Link className="link" to="earnings">
                        Doanh thu
                      </Link>
                      <Link className="link" to="wallet">
                        Ví rút tiền
                      </Link>
                      <Link className="link" to="talent/vouchers">
                        Khuyến mãi của tôi
                      </Link>
                    </>
                  )}
                  <Link className="link" to="orders">
                    Đơn hàng
                  </Link>
                  {!currentUser?.isSeller && (
                    <Link className="link" to="library">
                      Thư viện đã mua
                    </Link>
                  )}
                  <Link className="link" to="messages">
                    Tin nhắn
                  </Link>
                  <Link className="link" to="wishlist">
                    Yêu thích
                  </Link>
                  {currentUser?.isAdmin && (
                    <Link className="link" to="admin">
                      Quản trị
                    </Link>
                  )}
                  <Link className="link" onClick={handleLogout}>
                    Đăng xuất
                  </Link>
                </div>
              )}
            </div>
          )}
          {!currentUser && (
            <Link className="link" to="/register">
              <button>Tham gia</button>
            </Link>
          )}
        </div>
      </div>
      {active ||
        (pathname !== "/" && (
          <>
            <hr />
            <div className="menu">
              {categories.map((cat) => <Link className="link" to={`/gigs?cat=${cat.slug}`} key={cat._id || cat.slug}><span>{cat.name}</span></Link>)}
            </div>
          </>
        ))}
      {mobileOpen && <div className="mobile-drawer" role="dialog" aria-modal="true">
        <div className="drawer-panel">
          <button className="drawer-close" onClick={() => setMobileOpen(false)}>Đóng</button>
          <SearchBox className="drawer-search" compact value={navSearch} onChange={setNavSearch} onSearch={(keyword) => {
            navigate(keyword ? `/gigs?search=${encodeURIComponent(keyword)}` : "/gigs");
            setMobileOpen(false);
          }} placeholder="Tìm sản phẩm/dịch vụ" />
          {currentUser ? (
            <div className="drawer-account">
              <img src={getAvatarSrc(currentUser?.img)} alt="" onError={useDefaultAvatar} />
              <div>
                <strong>{currentUser?.username}</strong>
                <small>{currentUser?.isAdmin ? "Quản trị viên" : currentUser?.isSeller ? "Talent" : "Buyer"}</small>
              </div>
            </div>
          ) : (
            <Link to="/login" onClick={() => setMobileOpen(false)}>Đăng nhập</Link>
          )}
          {currentUser && <Link to="/account" onClick={() => setMobileOpen(false)}>Thông tin tài khoản</Link>}
          <Link to="/gigs" onClick={() => setMobileOpen(false)}>Khám phá tất cả</Link>
          <Link to="/cart" onClick={() => setMobileOpen(false)}>Giỏ hàng</Link>
          {categories.map((cat) => <Link to={`/gigs?cat=${cat.slug}`} onClick={() => setMobileOpen(false)} key={cat._id || cat.slug}>{cat.name}</Link>)}
          {currentUser && <Link to="/orders" onClick={() => setMobileOpen(false)}>Đơn hàng</Link>}
          {currentUser?.isSeller && <Link to="/talent/dashboard" onClick={() => setMobileOpen(false)}>Dashboard talent</Link>}
          {currentUser?.isSeller && <Link to="/talent/vouchers" onClick={() => setMobileOpen(false)}>Khuyến mãi của tôi</Link>}
          {currentUser?.isAdmin && <Link to="/admin" onClick={() => setMobileOpen(false)}>Admin</Link>}
          {currentUser && <button className="drawer-logout" onClick={() => { setMobileOpen(false); handleLogout(); }}>Đăng xuất</button>}
        </div>
      </div>}
    </div>
  );
};

export default Navbar;
