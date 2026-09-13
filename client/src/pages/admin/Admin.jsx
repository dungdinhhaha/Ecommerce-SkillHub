import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import request from "../../utils/request.utils";
import "./Admin.scss";

const labels = {
  pending_payment: "Chờ thanh toán",
  in_progress: "Đang thực hiện",
  submitted: "Đã bàn giao",
  revision_requested: "Yêu cầu sửa",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  disputed: "Tranh chấp",
};
const moneyStatusLabels = { pending: "Chờ xử lý", approved: "Đã duyệt", rejected: "Từ chối", paid: "Đã chuyển tiền" };
const approvalLabels = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối" };
const listingTypeLabels = { skill_service: "Dịch vụ kỹ năng", digital_product: "Sản phẩm số" };
const accountStatusLabels = { active: "Đang hoạt động", blocked: "Đã khóa" };
const ADMIN_PAGE_SIZE = 20;

const money = (value) => Number(value || 0).toLocaleString("vi-VN");
const dateTime = (value) => value ? new Date(value).toLocaleString("vi-VN") : "Chưa có";

const getMoneyStats = (items = []) => items.reduce((stats, item) => {
  stats.count += 1;
  stats.total += Number(item.amount || 0);
  stats[item.status] = (stats[item.status] || 0) + 1;
  return stats;
}, { count: 0, total: 0, pending: 0, approved: 0, rejected: 0, paid: 0 });

const replacePagedItem = (old, updated, variables) => {
  if (!old?.items) return old;
  return {
    ...old,
    items: old.items.map((item) => item._id === variables.id ? { ...item, ...updated, approvalStatus: variables.status } : item),
  };
};

const Admin = () => {
  const [tab, setTab] = useState("dashboard");
  const [filters, setFilters] = useState({ status: "", from: "", to: "", q: "" });
  const [orderSearchDraft, setOrderSearchDraft] = useState("");
  const [productFilters, setProductFilters] = useState({ status: "", type: "", cat: "", search: "" });
  const [productSearchDraft, setProductSearchDraft] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [listingPage, setListingPage] = useState(1);
  const [userFilters, setUserFilters] = useState({ role: "", status: "", search: "" });
  const [userSearchDraft, setUserSearchDraft] = useState("");
  const [withdrawalFilter, setWithdrawalFilter] = useState("");
  const [refundFilter, setRefundFilter] = useState("");
  const [voucherForm, setVoucherForm] = useState({ code: "", title: "", discountType: "percent", discountValue: "", maxDiscount: "", minOrderValue: "", usageLimit: "", expiresAt: "" });
  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "", description: "", sortOrder: 0 });
  const [adminNotes, setAdminNotes] = useState({});
  const queryClient = useQueryClient();

  const listings = useQuery({
    queryKey: ["admin-listings", listingPage],
    queryFn: () => request.get("/admin/listings", { params: { page: listingPage, limit: ADMIN_PAGE_SIZE } }).then((res) => ({ items: res.data.data, pagination: res.data.pagination })),
    enabled: tab === "listings",
    keepPreviousData: true,
  });
  const dashboard = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => request.get("/admin/dashboard").then((res) => res.data.data),
    enabled: tab === "dashboard",
  });
  const products = useQuery({
    queryKey: ["admin-products", productFilters, productPage],
    queryFn: () => request.get("/admin/products", { params: { ...productFilters, page: productPage, limit: ADMIN_PAGE_SIZE } }).then((res) => ({ items: res.data.data, pagination: res.data.pagination })),
    enabled: tab === "products",
    keepPreviousData: true,
  });
  const users = useQuery({
    queryKey: ["admin-users", userFilters],
    queryFn: () => request.get("/admin/users", { params: userFilters }).then((res) => res.data.data),
    enabled: tab === "users",
  });
  const orders = useQuery({
    queryKey: ["admin-orders", filters],
    queryFn: () => request.get("/admin/orders", { params: filters }).then((res) => res.data.data),
    enabled: tab === "orders",
  });
  const withdrawals = useQuery({
    queryKey: ["admin-withdrawals", withdrawalFilter],
    queryFn: () => request.get("/admin/withdrawals", { params: { status: withdrawalFilter } }).then((res) => res.data.data),
    enabled: tab === "withdrawals",
  });
  const refunds = useQuery({
    queryKey: ["admin-refunds", refundFilter],
    queryFn: () => request.get("/admin/refunds", { params: { status: refundFilter } }).then((res) => res.data.data),
    enabled: tab === "refunds",
  });
  const categories = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => request.get("/admin/categories").then((res) => res.data.data),
    enabled: tab === "categories",
  });
  const vouchers = useQuery({
    queryKey: ["admin-vouchers"],
    queryFn: () => request.get("/admin/vouchers").then((res) => res.data.data),
    enabled: tab === "vouchers",
  });
  const disputes = useQuery({
    queryKey: ["admin-disputes"],
    queryFn: () => request.get("/admin/disputes").then((res) => res.data.data),
    enabled: tab === "disputes",
  });

  const review = useMutation({
    mutationFn: ({ id, status }) => request.patch(`/admin/listings/${id}`, { status }),
    onSuccess: (res, variables) => {
      const label = approvalLabels[variables.status] || variables.status;
      alert(`Đã cập nhật listing: ${label}`);
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (err) => {
      alert(err.response?.data?.message || "Không cập nhật được listing. Vui lòng thử lại.");
    },
  });
  const updateOrder = useMutation({
    mutationFn: ({ id, status, adminNote }) => request.patch(`/admin/orders/${id}`, { status, adminNote }),
    onSuccess: (res, variables) => {
      alert(`Đã cập nhật đơn hàng: ${labels[variables.status] || variables.status}`);
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: (err) => {
      alert(err.response?.data?.message || "Không cập nhật được đơn hàng. Vui lòng thử lại.");
    },
  });
  const updateWithdrawal = useMutation({
    mutationFn: ({ id, status, adminNote }) => request.patch(`/admin/withdrawals/${id}`, { status, adminNote }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] }),
  });
  const createRefund = useMutation({
    mutationFn: ({ orderId, amount, reason }) => request.post(`/admin/orders/${orderId}/refunds`, { amount, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-refunds"] });
    },
  });
  const updateRefund = useMutation({
    mutationFn: ({ id, status, adminNote }) => request.patch(`/admin/refunds/${id}`, { status, adminNote }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-refunds"] }),
  });
  const updateUser = useMutation({
    mutationFn: ({ id, payload }) => request.patch(`/admin/users/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });
  const createCategory = useMutation({
    mutationFn: (payload) => request.post("/admin/categories", payload),
    onSuccess: () => {
      setCategoryForm({ name: "", slug: "", description: "", sortOrder: 0 });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
  const updateCategory = useMutation({
    mutationFn: ({ id, payload }) => request.patch(`/admin/categories/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
  const createVoucher = useMutation({
    mutationFn: (payload) => request.post("/admin/vouchers", payload),
    onSuccess: () => {
      setVoucherForm({ code: "", title: "", discountType: "percent", discountValue: "", maxDiscount: "", minOrderValue: "", usageLimit: "", expiresAt: "" });
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
    },
  });
  const updateVoucher = useMutation({
    mutationFn: ({ id, payload }) => request.patch(`/admin/vouchers/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] }),
  });

  const isError = listings.isError || orders.isError || dashboard.isError || withdrawals.isError || refunds.isError || products.isError || users.isError || categories.isError || disputes.isError || vouchers.isError;
  const navGroups = [
    { title: "Tổng quan", items: [{ id: "dashboard", label: "Dashboard", desc: "Doanh thu, đơn, rủi ro" }] },
    { title: "Marketplace", items: [
      { id: "listings", label: "Duyệt listing", desc: "Sản phẩm/dịch vụ chờ duyệt" },
      { id: "products", label: "Quản trị sản phẩm", desc: "Tìm, duyệt, khóa listing" },
      { id: "categories", label: "Danh mục", desc: "Navbar và homepage" },
      { id: "vouchers", label: "Khuyến mãi", desc: "Voucher và mã giảm giá" },
    ] },
    { title: "Giao dịch", items: [
      { id: "orders", label: "Đơn hàng", desc: "Theo dõi toàn bộ vòng đời" },
      { id: "disputes", label: "Tranh chấp", desc: "Case cần admin quyết định" },
      { id: "refunds", label: "Hoàn tiền", desc: "Phiếu hoàn/từ chối" },
      { id: "withdrawals", label: "Rút tiền", desc: "Talent yêu cầu thanh toán" },
    ] },
    { title: "Người dùng", items: [{ id: "users", label: "Tài khoản", desc: "Buyer, talent, admin, blocked" }] },
  ];
  const activeItem = navGroups.flatMap((group) => group.items).find((item) => item.id === tab);

  return <div className="admin sh-page"><div className="container">
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span>SkillHub Admin</span>
          <strong>Control room</strong>
        </div>
        {navGroups.map((group) => <nav key={group.title}>
          <small>{group.title}</small>
          {group.items.map((item) => <button className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)} key={item.id}>
            <span>{item.label}</span>
            <em>{item.desc}</em>
          </button>)}
        </nav>)}
      </aside>
      <main className="admin-content">
        <header className="admin-header">
          <div>
            <span className="sh-badge product">Quản trị vận hành</span>
            <h1>{activeItem?.label || "Quản trị SkillHub"}</h1>
            <p>{activeItem?.desc || "Theo dõi và xử lý hoạt động marketplace."}</p>
          </div>
        </header>
        {isError && <p className="admin-error">Bạn không có quyền truy cập hoặc máy chủ chưa sẵn sàng.</p>}
        {tab === "dashboard" && <DashboardPanel data={dashboard.data} isLoading={dashboard.isLoading} />}
        {tab === "listings" && <ListingsPanel listings={listings} review={review} page={listingPage} setPage={setListingPage} />}
        {tab === "products" && <ProductsPanel query={products} filters={productFilters} setFilters={setProductFilters} searchDraft={productSearchDraft} setSearchDraft={setProductSearchDraft} page={productPage} setPage={setProductPage} review={review} />}
        {tab === "categories" && <CategoriesPanel query={categories} form={categoryForm} setForm={setCategoryForm} createCategory={createCategory} updateCategory={updateCategory} />}
        {tab === "vouchers" && <VouchersPanel query={vouchers} form={voucherForm} setForm={setVoucherForm} createVoucher={createVoucher} updateVoucher={updateVoucher} />}
        {tab === "users" && <UsersPanel query={users} filters={userFilters} setFilters={setUserFilters} searchDraft={userSearchDraft} setSearchDraft={setUserSearchDraft} updateUser={updateUser} />}
        {tab === "orders" && <OrdersPanel orders={orders} filters={filters} setFilters={setFilters} searchDraft={orderSearchDraft} setSearchDraft={setOrderSearchDraft} adminNotes={adminNotes} setAdminNotes={setAdminNotes} updateOrder={updateOrder} createRefund={createRefund} />}
        {tab === "disputes" && <DisputesPanel query={disputes} adminNotes={adminNotes} setAdminNotes={setAdminNotes} updateOrder={updateOrder} createRefund={createRefund} />}
        {tab === "withdrawals" && <WithdrawalsPanel query={withdrawals} filter={withdrawalFilter} setFilter={setWithdrawalFilter} adminNotes={adminNotes} setAdminNotes={setAdminNotes} updateWithdrawal={updateWithdrawal} />}
        {tab === "refunds" && <RefundsPanel query={refunds} filter={refundFilter} setFilter={setRefundFilter} adminNotes={adminNotes} setAdminNotes={setAdminNotes} updateRefund={updateRefund} />}
      </main>
    </div>
  </div></div>;
};

const DashboardPanel = ({ data, isLoading }) => {
  if (isLoading) return <p>Đang tải dashboard...</p>;
  if (!data) return null;

  return <div className="admin-dashboard">
    <div className="dashboard-grid">
      <article><small>Tổng đơn đã thanh toán</small><strong>{data.totalPaidOrders}</strong></article>
      <article><small>Đơn hoàn thành</small><strong>{data.completedOrders}</strong></article>
      <article><small>Doanh thu đã thanh toán</small><strong>{money(data.paidRevenue)} VND</strong></article>
      <article><small>Phí nền tảng</small><strong>{money(data.platformFees)} VND</strong></article>
      <article><small>Talent đủ điều kiện trả</small><strong>{money(data.availableSellerPayouts)} VND</strong></article>
      <article><small>Đang giữ {data.payoutHoldDays || 10} ngày</small><strong>{money(data.heldSellerPayouts)} VND</strong></article>
      <article><small>Tỷ lệ tranh chấp</small><strong>{data.disputeRate}%</strong></article>
      <article><small>Tỷ lệ hoàn/hủy</small><strong>{data.refundRate}%</strong></article>
    </div>
    <div className="dashboard-columns">
      <DashboardList title="Top talent" items={data.topSellers} />
      <DashboardList title="Top danh mục" items={data.topCategories} />
      <div className="dashboard-list">
        <h3>Trạng thái đơn</h3>
        {Object.entries(data.statusCounts || {}).map(([name, count]) => <p key={name}><span>{labels[name] || name}</span><strong>{count}</strong></p>)}
      </div>
    </div>
    <RevenueChart items={data.revenueByDay} />
  </div>;
};

const DashboardList = ({ title, items = [] }) => <div className="dashboard-list">
  <h3>{title}</h3>
  {!items.length && <p>Chưa có dữ liệu</p>}
  {items.map((item) => <p key={item.name}><span>{item.name}</span><strong>{money(item.revenue)} VND</strong></p>)}
</div>;

const RevenueChart = ({ items = [] }) => {
  const max = Math.max(...items.map((item) => item.revenue), 1);
  return <div className="revenue-chart">
    <h3>Doanh thu theo ngày</h3>
    {!items.length && <p>Chưa có dữ liệu doanh thu.</p>}
    {items.slice(-14).map((item) => <div className="chart-row" key={item.date}>
      <span>{item.date}</span>
      <div><i style={{ width: `${Math.max((item.revenue / max) * 100, 3)}%` }} /></div>
      <strong>{money(item.revenue)} VND</strong>
    </div>)}
  </div>;
};

const AdminPagination = ({ pagination, onChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;
  const page = pagination.page || 1;
  const start = Math.max(page - 2, 1);
  const pages = Array.from({ length: Math.min(5, pagination.totalPages - start + 1) }, (_, index) => start + index);
  return <div className="admin-pagination">
    <button disabled={page <= 1} onClick={() => onChange(page - 1)}>Trước</button>
    {pages.map((item) => <button className={item === page ? "active" : ""} onClick={() => onChange(item)} key={item}>{item}</button>)}
    <button disabled={page >= pagination.totalPages} onClick={() => onChange(page + 1)}>Sau</button>
  </div>;
};

const ListingsPanel = ({ listings, review, setPage }) => {
  if (listings.isLoading) return <p>Đang tải...</p>;
  const data = listings.data?.items || [];
  const pagination = listings.data?.pagination;
  if (!data.length) return <p>Không có nội dung đang chờ duyệt.</p>;

  return <>
    <div className="admin-page-note">Đang xem {data.length}/{pagination?.total || data.length} listing chờ duyệt · 20 listing/trang</div>
    <div className="admin-list">{data.map((listing) => <article className="admin-card" key={listing._id}>
    <img src={listing.cover} alt="" />
    <div>
      <h2>{listing.title}</h2>
      <p>{listing.listingType === "digital_product" ? "Sản phẩm số" : "Dịch vụ kỹ năng"} · Người bán: {listing.userId?.username}</p>
      <p>{listing.shortDesc || listing.description}</p>
      <button disabled={review.isLoading} onClick={() => review.mutate({ id: listing._id, status: "approved" })}>Duyệt</button>
      <button disabled={review.isLoading} className="reject" onClick={() => review.mutate({ id: listing._id, status: "rejected" })}>Từ chối</button>
    </div>
  </article>)}</div>
    <AdminPagination pagination={pagination} onChange={setPage} />
  </>;
};

const ProductsPanel = ({ query, filters, setFilters, searchDraft, setSearchDraft, page, setPage, review }) => {
  const data = query.data?.items || [];
  const pagination = query.data?.pagination;
  const updateFilters = (next) => {
    setPage(1);
    setFilters(next);
  };
  const applySearch = () => updateFilters({ ...filters, search: searchDraft.trim() });
  return <div className="admin-management">
    <div className="money-panel-head">
      <div><h2>Quản trị sản phẩm/dịch vụ</h2><p>Xem toàn bộ listing trên SkillHub, lọc theo trạng thái, loại sản phẩm và danh mục.</p></div>
    </div>
    <div className="admin-filters">
      <input placeholder="Tìm theo tên sản phẩm/dịch vụ" value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") applySearch(); }} />
      <button onClick={applySearch}>Tìm</button>
      <select value={filters.status} onChange={(e) => updateFilters({ ...filters, status: e.target.value })}>
        <option value="">Tất cả trạng thái</option>
        {Object.entries(approvalLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <select value={filters.type} onChange={(e) => updateFilters({ ...filters, type: e.target.value })}>
        <option value="">Tất cả loại</option>
        {Object.entries(listingTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <input placeholder="Danh mục, ví dụ: web/design" value={filters.cat} onChange={(e) => updateFilters({ ...filters, cat: e.target.value })} />
      <button onClick={() => { setSearchDraft(""); updateFilters({ status: "", type: "", cat: "", search: "" }); }}>Xóa lọc</button>
    </div>
    <div className="admin-page-note">Đang xem {data.length}/{pagination?.total || data.length} listing · Trang {pagination?.page || page}/{pagination?.totalPages || 1}</div>
    {query.isLoading ? <p>Đang tải sản phẩm...</p> : !data.length ? <p>Chưa có sản phẩm/dịch vụ phù hợp.</p> : <div className="admin-table-list">
      {data.map((item) => <article className="product-row" key={item._id}>
        <img src={item.cover || "/img/noavatar.png"} alt="" />
        <div>
          <h3>{item.title}</h3>
          <p>{listingTypeLabels[item.listingType] || item.listingType} · Danh mục: {item.cat} · Giá: {money(item.price)} VND</p>
          <small>Talent: {item.userId?.username} · {item.userId?.email} · Đã bán: {item.sales || 0}</small>
          {item.rejectionReason && <em>Lý do từ chối: {item.rejectionReason}</em>}
        </div>
        <div className="row-actions">
          <span className={`pill ${item.approvalStatus}`}>{approvalLabels[item.approvalStatus] || item.approvalStatus}</span>
          <button disabled={review.isLoading} onClick={() => review.mutate({ id: item._id, status: "approved" })}>Duyệt</button>
          <button disabled={review.isLoading} className="reject" onClick={() => review.mutate({ id: item._id, status: "rejected" })}>Ẩn/Từ chối</button>
          <button disabled={review.isLoading} className="muted" onClick={() => review.mutate({ id: item._id, status: "pending" })}>Đưa về chờ duyệt</button>
        </div>
      </article>)}
    </div>}
    <AdminPagination pagination={pagination} onChange={setPage} />
  </div>;
};

const UsersPanel = ({ query, filters, setFilters, searchDraft, setSearchDraft, updateUser }) => {
  const data = query.data || [];
  const applySearch = () => setFilters({ ...filters, search: searchDraft.trim() });
  const clearFilters = () => {
    setSearchDraft("");
    setFilters({ role: "", status: "", search: "" });
  };

  return <div className="admin-management">
    <div className="money-panel-head">
      <div><h2>Quản trị người dùng</h2><p>Kiểm tra buyer, talent, admin; khóa/mở tài khoản và đổi vai trò demo.</p></div>
    </div>
    <div className="admin-filters">
      <input
        placeholder="Tìm username, email, số điện thoại, quốc gia"
        value={searchDraft}
        onChange={(e) => setSearchDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") applySearch(); }}
      />
      <button onClick={applySearch}>Tìm</button>
      <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
        <option value="">Tất cả vai trò</option>
        <option value="buyer">Buyer</option>
        <option value="talent">Talent</option>
        <option value="admin">Admin</option>
      </select>
      <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
        <option value="">Tất cả trạng thái</option>
        {Object.entries(accountStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <button onClick={clearFilters}>Xóa lọc</button>
    </div>
    {filters.search && <p className="filter-note">Đang tìm: “{filters.search}”</p>}
    {query.isLoading ? <p>Đang tải người dùng...</p> : !data.length ? <p>Chưa có người dùng phù hợp.</p> : <div className="admin-table-list">
      {data.map((user) => <article className="user-row" key={user._id}>
        <img src={user.img || "/img/noavatar.png"} alt="" />
        <div>
          <h3>{user.username}</h3>
          <p>{user.email} · {user.country}</p>
          <small>{user.isAdmin ? "Admin" : user.isSeller ? "Talent" : "Buyer"} · Tổng kiếm được: {money(user.totalEarned)} VND · Tham gia: {dateTime(user.createdAt)}</small>
        </div>
        <div className="row-actions">
          <span className={`pill ${user.accountStatus || "active"}`}>{accountStatusLabels[user.accountStatus || "active"]}</span>
          <button onClick={() => updateUser.mutate({ id: user._id, payload: { accountStatus: "active" } })}>Mở khóa</button>
          <button className="reject" onClick={() => updateUser.mutate({ id: user._id, payload: { accountStatus: "blocked" } })}>Khóa</button>
          <button className="muted" onClick={() => updateUser.mutate({ id: user._id, payload: { isSeller: !user.isSeller } })}>{user.isSeller ? "Gỡ talent" : "Cho làm talent"}</button>
        </div>
      </article>)}
    </div>}
  </div>;
};

const CategoriesPanel = ({ query, form, setForm, createCategory, updateCategory }) => {
  const data = query.data || [];
  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) return;
    createCategory.mutate({ ...form, sortOrder: Number(form.sortOrder || 0) });
  };
  return <div className="admin-management">
    <div className="money-panel-head">
      <div><h2>Quản trị danh mục</h2><p>Danh mục này được dùng động ở navbar, trang chủ và bộ lọc sản phẩm.</p></div>
    </div>
    <form className="category-form" onSubmit={submit}>
      <input placeholder="Tên danh mục" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input placeholder="Slug, ví dụ: web" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
      <input placeholder="Mô tả" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <input type="number" placeholder="Thứ tự" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
      <button>Thêm danh mục</button>
    </form>
    {query.isLoading ? <p>Đang tải danh mục...</p> : <div className="admin-table-list">
      {data.map((cat) => <article className="category-row" key={cat._id}>
        <div><h3>{cat.name}</h3><p>{cat.slug} · {cat.description || "Chưa có mô tả"}</p></div>
        <div className="row-actions">
          <span className={`pill ${cat.isActive ? "active" : "blocked"}`}>{cat.isActive ? "Đang hiện" : "Đã ẩn"}</span>
          <button onClick={() => updateCategory.mutate({ id: cat._id, payload: { isActive: true } })}>Hiện</button>
          <button className="reject" onClick={() => updateCategory.mutate({ id: cat._id, payload: { isActive: false } })}>Ẩn</button>
        </div>
      </article>)}
    </div>}
  </div>;
};

const VouchersPanel = ({ query, form, setForm, createVoucher, updateVoucher }) => {
  const data = query.data || [];
  const submit = (event) => {
    event.preventDefault();
    if (!form.code.trim() || !form.title.trim() || Number(form.discountValue) <= 0) return;
    createVoucher.mutate({
      ...form,
      code: form.code.toUpperCase(),
      discountValue: Number(form.discountValue || 0),
      maxDiscount: Number(form.maxDiscount || 0),
      minOrderValue: Number(form.minOrderValue || 0),
      usageLimit: Number(form.usageLimit || 0),
      expiresAt: form.expiresAt || null,
    });
  };

  return <div className="admin-management">
    <div className="money-panel-head">
      <div><h2>Quản trị khuyến mãi</h2><p>Tạo voucher để buyer nhập ở trang thanh toán. Voucher chỉ tính lượt dùng khi thanh toán thành công.</p></div>
    </div>
    <form className="voucher-form" onSubmit={submit}>
      <input placeholder="Mã voucher, ví dụ SKILLHUB10" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
      <input placeholder="Tên chương trình" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
        <option value="percent">Giảm theo %</option>
        <option value="fixed">Giảm số tiền</option>
      </select>
      <input type="number" placeholder={form.discountType === "percent" ? "Giảm %, ví dụ 10" : "Giảm VND"} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
      <input type="number" placeholder="Giảm tối đa VND" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
      <input type="number" placeholder="Đơn tối thiểu VND" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} />
      <input type="number" placeholder="Giới hạn lượt" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
      <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
      <button>Tạo voucher</button>
    </form>
    {query.isLoading ? <p>Đang tải voucher...</p> : !data.length ? <p>Chưa có voucher.</p> : <div className="admin-table-list">
      {data.map((voucher) => <article className="voucher-row" key={voucher._id}>
        <div>
          <h3>{voucher.code} · {voucher.title}</h3>
          <p>{voucher.discountType === "percent" ? `Giảm ${voucher.discountValue}%` : `Giảm ${money(voucher.discountValue)} VND`} {voucher.maxDiscount ? `· Tối đa ${money(voucher.maxDiscount)} VND` : ""}</p>
          <small>{voucher.ownerType === "seller" ? `Talent tự giảm: ${voucher.seller?.username || "Unknown"}` : "Nền tảng tài trợ"} · Đơn tối thiểu: {money(voucher.minOrderValue)} VND · Đã dùng: {voucher.usedCount}/{voucher.usageLimit || "∞"} · Hết hạn: {voucher.expiresAt ? new Date(voucher.expiresAt).toLocaleDateString("vi-VN") : "Không giới hạn"}</small>
        </div>
        <div className="row-actions">
          <span className={`pill ${voucher.isActive ? "active" : "blocked"}`}>{voucher.isActive ? "Đang bật" : "Đã tắt"}</span>
          <button onClick={() => updateVoucher.mutate({ id: voucher._id, payload: { isActive: true } })}>Bật</button>
          <button className="reject" onClick={() => updateVoucher.mutate({ id: voucher._id, payload: { isActive: false } })}>Tắt</button>
        </div>
      </article>)}
    </div>}
  </div>;
};

const DisputesPanel = ({ query, adminNotes, setAdminNotes, updateOrder, createRefund }) => {
  if (query.isLoading) return <p>Đang tải tranh chấp...</p>;
  const data = query.data || [];
  return <div className="admin-management">
    <div className="money-panel-head">
      <div><h2>Trung tâm tranh chấp</h2><p>Xem các đơn đang bị khóa tiền để quyết định hoàn tiền, hoàn một phần hoặc chốt hoàn thành.</p></div>
    </div>
    {!data.length ? <p>Không có tranh chấp đang mở.</p> : <div className="admin-orders">
      {data.map((order) => <AdminOrderCard key={order._id} order={order} adminNotes={adminNotes} setAdminNotes={setAdminNotes} updateOrder={updateOrder} createRefund={createRefund} />)}
    </div>}
  </div>;
};

const OrdersPanel = ({ orders, filters, setFilters, searchDraft, setSearchDraft, adminNotes, setAdminNotes, updateOrder, createRefund }) => {
  const applySearch = () => setFilters({ ...filters, q: searchDraft.trim() });
  const clearFilters = () => {
    setSearchDraft("");
    setFilters({ status: "", from: "", to: "", q: "" });
  };

  return <>
    <div className="admin-filters">
      <input
        className="admin-search-wide"
        placeholder="Tìm mã đơn, Gmail buyer/talent, ID khách, ID talent"
        value={searchDraft}
        onChange={(e) => setSearchDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") applySearch(); }}
      />
      <button onClick={applySearch}>Tìm đơn</button>
      <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
        <option value="">Tất cả trạng thái</option>
        {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
      <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
      <button onClick={clearFilters}>Xóa lọc</button>
    </div>
    {filters.q && <p className="filter-note">Đang tìm đơn: “{filters.q}”</p>}
    {orders.isLoading ? <p>Đang tải...</p> : !orders.data?.length ? <p>Chưa có đơn hàng phù hợp.</p> : <div className="admin-orders">{orders.data.map((order) => <AdminOrderCard key={order._id} order={order} adminNotes={adminNotes} setAdminNotes={setAdminNotes} updateOrder={updateOrder} createRefund={createRefund} />)}</div>}
  </>;
};

const AdminOrderCard = ({ order, adminNotes, setAdminNotes, updateOrder, createRefund }) => {
  const note = adminNotes[order._id] || order.adminNote || "";
  const confirmAction = (message) => window.confirm(`${message}\n\nMã đơn: ${order.paymentCode}\nGhi chú admin: ${note || "chưa nhập"}`);
  const sendStatus = (status) => {
    if (!confirmAction(`Xác nhận đổi trạng thái sang “${labels[status] || status}”?`)) return;
    updateOrder.mutate({ id: order._id, status, adminNote: note });
  };

  return <article className="admin-order">
    <div className="admin-order-main">
      <div>
        <strong>{order.paymentCode}</strong>
        <h3>{order.gig?.title}</h3>
        <p>{order.buyer?.username} → {order.seller?.username} · {money(order.price)} VND</p>
        <small>{order.sepayTransactionId ? `SePay: ${order.sepayTransactionId}` : "Chưa có giao dịch SePay"}</small>
      </div>
      <div className="admin-order-control">
        <span className="order-status">{labels[order.status] || order.status}</span>
        <select value={order.status} onChange={(e) => sendStatus(e.target.value)}>
          {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
    </div>
    <div className="admin-dispute-panel">
      <textarea value={note} onChange={(e) => setAdminNotes({ ...adminNotes, [order._id]: e.target.value })} placeholder="Ghi chú xử lý của admin: lý do tranh chấp, hướng xử lý, căn cứ quyết định..." />
      <div className="admin-quick-actions">
        <button onClick={() => sendStatus("disputed")}>Đưa vào tranh chấp</button>
        <button onClick={() => sendStatus("completed")}>Chốt hoàn thành</button>
        <button className="reject" onClick={() => sendStatus("cancelled")}>Hủy/hoàn tiền</button>
        <button className="reject" onClick={() => {
          if (!confirmAction("Tạo phiếu hoàn tiền toàn phần cho đơn này?")) return;
          createRefund.mutate({ orderId: order._id, amount: order.price, reason: note });
        }}>Tạo phiếu hoàn tiền</button>
      </div>
    </div>
    {(order.disputeReason || order.disputeFiles?.length > 0 || order.buyerNote || order.revisionFiles?.length > 0 || order.deliveryNote || order.deliveryFiles?.length > 0) && <div className="admin-evidence">
      {order.disputeReason && <p><strong>Lý do tranh chấp/hoàn tiền:</strong> {order.disputeReason}</p>}
      {order.buyerNote && <p><strong>Yêu cầu sửa:</strong> {order.buyerNote}</p>}
      {order.deliveryNote && <p><strong>Bàn giao:</strong> {order.deliveryNote}</p>}
      <FileLinks title="Bằng chứng tranh chấp" files={order.disputeFiles} />
      <FileLinks title="File góp ý" files={order.revisionFiles} />
      <FileLinks title="File bàn giao" files={order.deliveryFiles} />
    </div>}
    {order.timeline?.length > 0 && <div className="admin-timeline">
      <strong>Lịch sử đơn</strong>
      {[...order.timeline].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((item, index) => <div key={`${item.type}-${item.createdAt}-${index}`}><span>{new Date(item.createdAt).toLocaleString("vi-VN")}</span><p>{item.title}</p>{item.note && <small>{item.note}</small>}</div>)}
    </div>}
  </article>;
};

const MoneyStatusFilter = ({ value, onChange }) => <div className="money-filter">
  <select value={value} onChange={(e) => onChange(e.target.value)}>
    <option value="">Tất cả trạng thái</option>
    {Object.entries(moneyStatusLabels).map(([status, label]) => <option key={status} value={status}>{label}</option>)}
  </select>
</div>;

const MoneySummary = ({ items }) => {
  const stats = getMoneyStats(items);
  return <div className="money-summary">
    <article><small>Tổng yêu cầu</small><strong>{stats.count}</strong></article>
    <article><small>Tổng tiền</small><strong>{money(stats.total)} VND</strong></article>
    <article><small>Chờ xử lý</small><strong>{stats.pending}</strong></article>
    <article><small>Đã duyệt</small><strong>{stats.approved}</strong></article>
    <article><small>Đã chuyển</small><strong>{stats.paid}</strong></article>
  </div>;
};

const WithdrawalsPanel = ({ query, filter, setFilter, adminNotes, setAdminNotes, updateWithdrawal }) => {
  if (query.isLoading) return <p>Đang tải yêu cầu rút tiền...</p>;
  const data = query.data || [];

  return <div className="money-admin">
    <div className="money-panel-head">
      <div><h2>Quản trị rút tiền</h2><p>Duyệt yêu cầu, đối chiếu tài khoản ngân hàng, rồi đánh dấu đã chuyển sau khi admin chuyển khoản thủ công.</p></div>
      <MoneyStatusFilter value={filter} onChange={setFilter} />
    </div>
    <MoneySummary items={data} />
    {!data.length ? <p>Chưa có yêu cầu rút tiền.</p> : <div className="admin-money-list">{data.map((item) => <WithdrawalCard key={item._id} item={item} adminNotes={adminNotes} setAdminNotes={setAdminNotes} updateWithdrawal={updateWithdrawal} />)}</div>}
  </div>;
};

const WithdrawalCard = ({ item, adminNotes, setAdminNotes, updateWithdrawal }) => {
  const noteKey = `withdrawal-${item._id}`;
  const adminNote = adminNotes[noteKey] ?? item.adminNote ?? "";
  const update = (status) => {
    if (!window.confirm(`Xác nhận “${moneyStatusLabels[status] || status}” yêu cầu rút ${money(item.amount)} VND của ${item.seller?.username || "talent"}?\n\nGhi chú: ${adminNote || "chưa nhập"}`)) return;
    updateWithdrawal.mutate({ id: item._id, status, adminNote });
  };
  return <article className={`money-card ${item.status}`}>
    <div className="money-card-top">
      <div><span className={`money-badge ${item.status}`}>{moneyStatusLabels[item.status] || item.status}</span><h3>{money(item.amount)} VND</h3></div>
      <div className="money-dates"><span>Tạo: {dateTime(item.createdAt)}</span><span>Chuyển: {dateTime(item.paidAt)}</span></div>
    </div>
    <div className="money-detail-grid">
      <p><small>Talent</small><strong>{item.seller?.username}</strong><span>{item.seller?.email}</span></p>
      <p><small>Ngân hàng</small><strong>{item.bankName}</strong><span>{item.bankAccount}</span></p>
      <p><small>Chủ tài khoản</small><strong>{item.accountName}</strong><span>{item.note || "Không có ghi chú talent"}</span></p>
    </div>
    <textarea value={adminNote} onChange={(e) => setAdminNotes({ ...adminNotes, [noteKey]: e.target.value })} placeholder="Ghi chú admin: đã đối chiếu, mã giao dịch chuyển khoản, lý do từ chối..." />
    <div className="money-actions">
      <button onClick={() => update("approved")}>Duyệt</button>
      <button onClick={() => update("paid")}>Đã chuyển tiền</button>
      <button className="reject" onClick={() => update("rejected")}>Từ chối</button>
    </div>
  </article>;
};

const RefundsPanel = ({ query, filter, setFilter, adminNotes, setAdminNotes, updateRefund }) => {
  if (query.isLoading) return <p>Đang tải phiếu hoàn tiền...</p>;
  const data = query.data || [];

  return <div className="money-admin">
    <div className="money-panel-head">
      <div><h2>Quản trị hoàn tiền</h2><p>Theo dõi phiếu hoàn tiền theo đơn hàng, buyer, talent và trạng thái xử lý.</p></div>
      <MoneyStatusFilter value={filter} onChange={setFilter} />
    </div>
    <MoneySummary items={data} />
    {!data.length ? <p>Chưa có phiếu hoàn tiền.</p> : <div className="admin-money-list">{data.map((item) => <RefundCard key={item._id} item={item} adminNotes={adminNotes} setAdminNotes={setAdminNotes} updateRefund={updateRefund} />)}</div>}
  </div>;
};

const RefundCard = ({ item, adminNotes, setAdminNotes, updateRefund }) => {
  const noteKey = `refund-${item._id}`;
  const adminNote = adminNotes[noteKey] ?? item.adminNote ?? "";
  const update = (status) => {
    if (!window.confirm(`Xác nhận “${moneyStatusLabels[status] || status}” phiếu hoàn ${money(item.amount)} VND?\n\nMã đơn: ${item.order?.paymentCode || "không rõ"}\nGhi chú: ${adminNote || "chưa nhập"}`)) return;
    updateRefund.mutate({ id: item._id, status, adminNote });
  };
  return <article className={`money-card ${item.status}`}>
    <div className="money-card-top">
      <div><span className={`money-badge ${item.status}`}>{moneyStatusLabels[item.status] || item.status}</span><h3>{money(item.amount)} VND</h3></div>
      <div className="money-dates"><span>Tạo: {dateTime(item.createdAt)}</span><span>Hoàn: {dateTime(item.paidAt)}</span></div>
    </div>
    <div className="money-detail-grid">
      <p><small>Mã đơn</small><strong>{item.order?.paymentCode}</strong><span>Giá trị đơn: {money(item.order?.price)} VND</span></p>
      <p><small>Buyer</small><strong>{item.buyer?.username}</strong><span>{item.buyer?.email}</span></p>
      <p><small>Talent</small><strong>{item.seller?.username}</strong><span>{item.seller?.email}</span></p>
    </div>
    <div className="refund-reason"><small>Lý do hoàn tiền</small><p>{item.reason || "Chưa có lý do"}</p></div>
    <FileLinks title="Bằng chứng hoàn tiền" files={item.evidenceFiles} />
    <textarea value={adminNote} onChange={(e) => setAdminNotes({ ...adminNotes, [noteKey]: e.target.value })} placeholder="Ghi chú admin: căn cứ hoàn tiền, mã giao dịch chuyển khoản, lý do từ chối..." />
    <div className="money-actions">
      <button onClick={() => update("approved")}>Duyệt hoàn tiền</button>
      <button onClick={() => update("paid")}>Đã hoàn tiền</button>
      <button className="reject" onClick={() => update("rejected")}>Từ chối</button>
    </div>
  </article>;
};

const FileLinks = ({ title, files = [] }) => files.length ? <div className="admin-files"><strong>{title}:</strong>{files.map((file, index) => <a href={file} target="_blank" rel="noreferrer" key={file}>File {index + 1}</a>)}</div> : null;

export default Admin;
