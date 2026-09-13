import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import "./Gigs.scss";
import GigCard from "../../components/gigCard/GigCard";
import SearchBox from "../../components/searchBox/SearchBox";
import request from "../../utils/request.utils";
import { useEffect } from "react";

const PAGE_SIZE = 20;

const Gigs = () => {
  const [sort, setSort] = useState("createdAt");
  const { search } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);
  const [keyword, setKeyword] = useState(params.get("search") || "");
  const [category, setCategory] = useState(params.get("cat") || "");
  const [listingType, setListingType] = useState(params.get("type") || "");
  const [deliveryTime, setDeliveryTime] = useState(params.get("deliveryTime") || "");
  const [minSales, setMinSales] = useState(params.get("minSales") || "");
  const [minPrice, setMinPrice] = useState(params.get("min") || "");
  const [maxPrice, setMaxPrice] = useState(params.get("max") || "");
  const currentPage = Math.max(Number(params.get("page") || 1), 1);
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => request.get("/categories").then((res) => res.data.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data, isError, isLoading, isFetching } = useQuery({
    queryKey: ["gigs", search, sort, currentPage],
    queryFn: () => {
      const apiParams = new URLSearchParams(search);
      apiParams.set("sort", sort);
      apiParams.set("page", currentPage);
      apiParams.set("limit", PAGE_SIZE);
      return request
        .get(`/gigs?${apiParams.toString()}`)
        .then((res) => ({ items: res.data.data, pagination: res.data.pagination }));
    },
    keepPreviousData: true,
  });

  useEffect(() => {
    const nextParams = new URLSearchParams(search);
    setKeyword(nextParams.get("search") || "");
    setCategory(nextParams.get("cat") || "");
    setListingType(nextParams.get("type") || "");
    setDeliveryTime(nextParams.get("deliveryTime") || "");
    setMinSales(nextParams.get("minSales") || "");
    setMinPrice(nextParams.get("min") || "");
    setMaxPrice(nextParams.get("max") || "");
  }, [search, sort]);

  if (isLoading) return <h3 style={{ textAlign: "center" }}>Loading...</h3>;
  if (isError) return <h3 style={{ textAlign: "center" }}>Error</h3>;

  const handleFilter = (keywordOverride) => {
    const next = new URLSearchParams();
    const nextKeyword = typeof keywordOverride === "string" ? keywordOverride : keyword;
    if (nextKeyword.trim()) next.set("search", nextKeyword.trim());
    if (category) next.set("cat", category);
    if (listingType) next.set("type", listingType);
    if (deliveryTime) next.set("deliveryTime", deliveryTime);
    if (minSales) next.set("minSales", minSales);
    if (minPrice) next.set("min", minPrice);
    if (maxPrice) next.set("max", maxPrice);
    next.set("page", "1");
    navigate(`/gigs?${next.toString()}`);
  };

  const sortChangeHandler = (e) => {
    setSort(e.target.value);
    const next = new URLSearchParams(search);
    next.set("page", "1");
    navigate(`/gigs?${next.toString()}`);
  };
  const gigs = data?.items || [];
  const pagination = data?.pagination || { page: currentPage, total: gigs.length, totalPages: 1 };
  const goToPage = (page) => {
    const next = new URLSearchParams(search);
    next.set("page", String(page));
    navigate(`/gigs?${next.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const title = keyword || category || listingType ? "Kết quả tìm kiếm trên SkillHub" : "Khám phá sản phẩm và dịch vụ";
  const subtitle = [
    keyword ? `Từ khóa: “${keyword}”` : "",
    category ? `Danh mục: ${category}` : "",
    listingType ? `Loại: ${listingType === "digital_product" ? "Sản phẩm số" : "Dịch vụ kỹ năng"}` : "",
    deliveryTime ? `Giao trong ≤ ${deliveryTime} ngày` : "",
    minSales ? `Đã bán ≥ ${minSales}` : "",
  ].filter(Boolean).join(" · ");

  return (
    <div className="gigs">
      <div className="container">
        <span className="breadcrumbs">SKILLHUB &gt; MARKETPLACE</span>
        <h1>{title}</h1>
        <p>{subtitle || "Tìm sản phẩm số để tải ngay hoặc thuê talent làm dịch vụ theo yêu cầu."}</p>
        <div className="menu">
          <div className="filter-row primary-row">
            <div className="filter-field search-field">
              <label>Tìm kiếm</label>
              <SearchBox className="listing-search" compact value={keyword} onChange={setKeyword} onSearch={(nextKeyword) => { setKeyword(nextKeyword); handleFilter(nextKeyword); }} placeholder="Tìm source code, logo, PowerPoint..." />
            </div>
            <div className="filter-field">
              <label>Danh mục</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Tất cả danh mục</option>
                {categories.map((cat) => <option value={cat.slug} key={cat._id || cat.slug}>{cat.name}</option>)}
              </select>
            </div>
            <div className="filter-field">
              <label>Loại</label>
              <select value={listingType} onChange={(e) => setListingType(e.target.value)}>
                <option value="">Tất cả</option>
                <option value="digital_product">Sản phẩm số</option>
                <option value="skill_service">Dịch vụ kỹ năng</option>
              </select>
            </div>
          </div>
          <div className="filter-row secondary-row">
            <div className="filter-field price-field">
              <label>Khoảng giá</label>
              <div>
                <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Từ" />
                <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Đến" />
              </div>
            </div>
            <div className="filter-field">
              <label>Thời gian</label>
              <select value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)}>
                <option value="">Thời gian bất kỳ</option>
                <option value="1">Trong 1 ngày</option>
                <option value="3">Trong 3 ngày</option>
                <option value="7">Trong 7 ngày</option>
              </select>
            </div>
            <div className="filter-field">
              <label>Lượt bán</label>
              <select value={minSales} onChange={(e) => setMinSales(e.target.value)}>
                <option value="">Lượt bán bất kỳ</option>
                <option value="1">Đã có đơn</option>
                <option value="10">Từ 10 đơn</option>
              </select>
            </div>
            <div className="filter-field">
              <label>Sắp xếp</label>
              <select value={sort} onChange={sortChangeHandler}>
                <option value="createdAt">Mới nhất</option>
                <option value="promotion">Đang khuyến mãi</option>
                <option value="sales">Bán chạy</option>
                <option value="rating">Đánh giá cao</option>
                <option value="priceAsc">Giá thấp đến cao</option>
                <option value="priceDesc">Giá cao đến thấp</option>
              </select>
            </div>
            <button className="filter-submit" onClick={handleFilter}>Lọc/Tìm</button>
          </div>
        </div>
        <div className="result-count">
          <strong>{pagination.total || gigs.length || 0}</strong> kết quả phù hợp
          <span>Trang {pagination.page || 1}/{pagination.totalPages || 1} · {PAGE_SIZE} sản phẩm/trang</span>
          {isFetching && <span>Đang cập nhật...</span>}
        </div>
        <div className="cards">
          {gigs.length > 0 ? (
            gigs.map((gig) => <GigCard item={gig} key={gig._id} />)
          ) : (
            <div className="empty-state"><h3>Không tìm thấy kết quả phù hợp</h3><p>Thử bỏ bớt bộ lọc, dùng từ khóa ngắn hơn hoặc xem tất cả danh mục.</p><button onClick={() => navigate("/gigs")}>Xem tất cả</button></div>
          )}
        </div>
        {(pagination.totalPages || 1) > 1 && <div className="pagination">
          <button disabled={(pagination.page || 1) <= 1} onClick={() => goToPage((pagination.page || 1) - 1)}>Trước</button>
          {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).slice(Math.max((pagination.page || 1) - 3, 0), Math.max((pagination.page || 1) - 3, 0) + 5).map((page) => (
            <button className={page === (pagination.page || 1) ? "active" : ""} onClick={() => goToPage(page)} key={page}>{page}</button>
          ))}
          <button disabled={(pagination.page || 1) >= (pagination.totalPages || 1)} onClick={() => goToPage((pagination.page || 1) + 1)}>Sau</button>
        </div>}
      </div>
    </div>
  );
};

export default Gigs;
