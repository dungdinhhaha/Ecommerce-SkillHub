import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import request from "../../utils/request.utils";
import upload from "../../utils/upload.utils";
import "./Orders.scss";

const statusLabels = {
  pending_payment: "Chờ thanh toán", in_progress: "Đang thực hiện", submitted: "Đã bàn giao",
  revision_requested: "Đang yêu cầu sửa", completed: "Hoàn thành", cancelled: "Đã hủy", disputed: "Đang tranh chấp",
};

const Orders = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reviewing, setReviewing] = useState(null);
  const [delivering, setDelivering] = useState(null);
  const [revising, setRevising] = useState(null);
  const [disputing, setDisputing] = useState(null);
  const [searchDraft, setSearchDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openOrderId, setOpenOrderId] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["orders", searchTerm],
    queryFn: () => request.get("/gigs/order", { params: searchTerm ? { q: searchTerm } : {} }).then((res) => res.data.data),
    keepPreviousData: true,
  });
  const action = useMutation({
    mutationFn: ({ type, id, note, files }) => request({
      method: type === "complete" ? "patch" : "post",
      url: `/gigs/order/${id}/${type}`,
      data: { ...(note ? { note } : {}), ...(files ? { files } : {}) },
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
  const review = useMutation({
    mutationFn: ({ order, star, desc }) => request.post(`/gigs/${order.gig._id}/reviews`, { orderId: order._id, star, desc }),
    onSuccess: () => setReviewing(null),
  });
  const handleContact = async (order) => {
    const otherId = currentUser.isSeller ? order.buyer._id : order.seller._id;
    const conversationId = `${order.seller._id}${order.buyer._id}`;
    try {
      const res = await request.get(`/conversation/${conversationId}`); navigate(`/message/${res.data.data.id}`);
    } catch (err) {
      if (err.response?.status === 404) { const res = await request.post("/conversation", { to: otherId }); navigate(`/message/${res.data.data.id}`); }
    }
  };
  const openDeliveryFile = async (orderId, index) => {
    const res = await request.get(`/gigs/order/${orderId}/delivery-files/${index}`);
    window.open(res.data.data.url, "_blank");
  };
  if (isLoading) return <div className="orders"><div className="container"><p>Đang tải đơn hàng...</p></div></div>;
  if (isError) return <div className="orders"><div className="container"><p>Không thể tải đơn hàng.</p></div></div>;
  const stats = data.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});
  const filteredOrders = statusFilter === "all" ? data : data.filter((order) => order.status === statusFilter);
  const actionHint = currentUser.isSeller
    ? "Theo dõi đơn cần bàn giao, đơn buyer yêu cầu sửa và đơn đang tranh chấp."
    : "Theo dõi đơn đã mua, tải sản phẩm số, xác nhận hoàn thành hoặc yêu cầu hỗ trợ.";
  const applySearch = () => setSearchTerm(searchDraft.trim());
  const clearSearch = () => {
    setSearchDraft("");
    setSearchTerm("");
  };

  return <div className="orders"><div className="container">
    <div className="title"><h1>{currentUser.isSeller ? "Trung tâm đơn của talent" : "Trung tâm mua hàng"}</h1><span>{filteredOrders.length}/{data.length} đơn</span></div>
    <p className="orders-hint">{actionHint}</p>
    <div className="orders-search">
      <input
        value={searchDraft}
        onChange={(e) => setSearchDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") applySearch(); }}
        placeholder={currentUser.isSeller ? "Tìm mã đơn, tên/email buyer, tên sản phẩm, mã SePay..." : "Tìm mã đơn, talent, tên sản phẩm, mã SePay..."}
      />
      <button onClick={applySearch}>Tìm đơn</button>
      <button className="muted" onClick={clearSearch}>Xóa</button>
    </div>
    {searchTerm && <p className="orders-search-note">Đang tìm: “{searchTerm}”</p>}
    <div className="order-stats">
      <article className={statusFilter === "all" ? "active" : ""} onClick={() => setStatusFilter("all")}>
        <small>Tất cả đơn</small>
        <strong>{data.length}</strong>
      </article>
      {Object.entries(statusLabels).map(([status, label]) => <article key={status}>
        <button type="button" className={statusFilter === status ? "active" : ""} onClick={() => setStatusFilter(status)}>
        <small>{label}</small>
        <strong>{stats[status] || 0}</strong>
        </button>
      </article>)}
    </div>
    {!filteredOrders.length && <p>{data.length ? "Không có đơn nào trong trạng thái này." : "Bạn chưa có đơn hàng đã thanh toán."}</p>}
    <div className="order-list">{filteredOrders.map((order) => {
      const isOpen = openOrderId === order._id;
      return <article className={`order-card ${isOpen ? "open" : ""}`} key={order._id}>
      <button type="button" className="order-summary" onClick={() => setOpenOrderId(isOpen ? "" : order._id)}>
        <img className="image" src={order.gig?.cover || "/img/noavatar.png"} alt="" />
        <div>
          <strong>{order.gig?.title || "Đơn hàng"}</strong>
          <span>Mã {order.paymentCode} · {currentUser.isSeller ? "Buyer" : "Talent"}: {currentUser.isSeller ? order.buyer?.username : order.seller?.username}</span>
          <small>{order.sepayTransactionId ? `SePay: ${order.sepayTransactionId}` : `Tạo: ${new Date(order.createdAt).toLocaleString("vi-VN")}`}</small>
        </div>
        <div className="summary-right">
          <b>{Number(order.price).toLocaleString("vi-VN")} VND</b>
          <span className={`status ${order.status}`}>{statusLabels[order.status] || order.status}</span>
        </div>
      </button>
      {isOpen && <>
        <div className="order-head"><div><strong>Mã đơn: {order.paymentCode}</strong><small>Được tạo: {new Date(order.createdAt).toLocaleString("vi-VN")}</small></div><span className={`status ${order.status}`}>{statusLabels[order.status] || order.status}</span></div>
        <OrderStepper status={order.status} />
        <div className="order-body"><img className="image" src={order.gig?.cover || "/img/noavatar.png"} alt="" /><div className="order-info"><h2>{order.gig?.title}</h2><p>{currentUser.isSeller ? "Người mua" : "Talent"}: {currentUser.isSeller ? order.buyer?.username : order.seller?.username}</p><p className="price">{Number(order.price).toLocaleString("vi-VN")} VND</p>{order.sepayTransactionId && <small>Mã giao dịch SePay: {order.sepayTransactionId}</small>}</div>
          <div className="order-actions"><button onClick={() => navigate(`/orders/${order._id}`)}>Chi tiết</button><button onClick={() => handleContact(order)}>Nhắn tin</button>{currentUser.isSeller && ["in_progress", "revision_requested"].includes(order.status) && <button onClick={() => setDelivering(order)}>Gửi kết quả</button>}{!currentUser.isSeller && order.status === "submitted" && <><button onClick={() => action.mutate({ type: "complete", id: order._id })}>Xác nhận hoàn thành</button><button onClick={() => setRevising(order)}>Yêu cầu chỉnh sửa</button></>}{!currentUser.isSeller && ["in_progress", "submitted", "revision_requested", "completed"].includes(order.status) && <button className="danger" onClick={() => setDisputing(order)}>Yêu cầu hoàn tiền</button>}{!currentUser.isSeller && order.gig?.listingType === "digital_product" && <button onClick={async () => { const res = await request.get(`/gigs/order/${order._id}/download`); window.open(res.data.data.url, "_blank"); }}>Tải sản phẩm</button>}{!currentUser.isSeller && order.status === "completed" && <button onClick={() => setReviewing(order)}>Đánh giá</button>}</div>
        </div>
        {(order.disputeReason || order.disputeFiles?.length > 0) && <div className="delivery-box dispute-box">
        <strong>Yêu cầu hoàn tiền / tranh chấp</strong>
        {order.disputeReason && <p>{order.disputeReason}</p>}
        {order.disputeFiles?.length > 0 && <div className="delivery-files">{order.disputeFiles.map((fileUrl, index) => <a href={fileUrl} target="_blank" rel="noreferrer" key={fileUrl}>Bằng chứng {index + 1}</a>)}</div>}
        </div>}
        {(order.buyerNote || order.revisionFiles?.length > 0) && <div className="delivery-box revision-box">
        <strong>Yêu cầu chỉnh sửa gần nhất</strong>
        {order.buyerNote && <p>{order.buyerNote}</p>}
        {order.revisionFiles?.length > 0 && <div className="delivery-files">{order.revisionFiles.map((fileUrl, index) => <a href={fileUrl} target="_blank" rel="noreferrer" key={fileUrl}>File góp ý {index + 1}</a>)}</div>}
        </div>}
        {(order.deliveryNote || order.deliveryFiles?.length > 0) && <div className="delivery-box">
        <strong>Kết quả bàn giao</strong>
        {order.deliveryNote && <p>{order.deliveryNote}</p>}
        {order.deliveryFiles?.length > 0 && <div className="delivery-files">{order.deliveryFiles.map((fileUrl, index) => <button type="button" onClick={() => openDeliveryFile(order._id, index)} key={fileUrl}>Tải file {index + 1}</button>)}</div>}
        </div>}
        {order.timeline?.length > 0 && <Timeline items={order.timeline} />}
        {delivering?._id === order._id && <DeliveryForm
        isSubmitting={action.isLoading}
        onCancel={() => setDelivering(null)}
        onSubmit={(values) => action.mutate(
          { type: "delivery", id: order._id, ...values },
          { onSuccess: () => setDelivering(null) }
        )}
        />}
        {revising?._id === order._id && <RevisionForm
        isSubmitting={action.isLoading}
        onCancel={() => setRevising(null)}
        onSubmit={(values) => action.mutate(
          { type: "revision", id: order._id, ...values },
          { onSuccess: () => setRevising(null) }
        )}
        />}
        {disputing?._id === order._id && <RefundForm
        order={order}
        isSubmitting={action.isLoading}
        onCancel={() => setDisputing(null)}
        onSubmit={(values) => action.mutate(
          { type: "refund", id: order._id, ...values },
          { onSuccess: () => setDisputing(null) }
        )}
        />}
        {reviewing?._id === order._id && <ReviewForm onCancel={() => setReviewing(null)} onSubmit={(values) => review.mutate({ order, ...values })} />}
      </>}
    </article>;
    })}</div>
  </div></div>;
};

const OrderStepper = ({ status }) => {
  const steps = [
    { id: "pending_payment", label: "Đã tạo đơn" },
    { id: "in_progress", label: "Talent đang làm" },
    { id: "submitted", label: "Đã bàn giao" },
    { id: "completed", label: "Hoàn thành" },
  ];
  const statusIndex = status === "revision_requested" ? 1 : status === "disputed" ? 2 : Math.max(steps.findIndex((step) => step.id === status), 0);
  return <div className="order-stepper" aria-label="Tiến trình đơn hàng">
    {steps.map((step, index) => <div className={`step ${index <= statusIndex ? "done" : ""}`} key={step.id}>
      <span>{index + 1}</span>
      <p>{step.label}</p>
    </div>)}
    {status === "revision_requested" && <b className="step-note">Buyer đang yêu cầu chỉnh sửa</b>}
    {status === "disputed" && <b className="step-note danger">Đang chờ admin xử lý tranh chấp</b>}
  </div>;
};

const UploadNoteForm = ({ title, placeholder, submitLabel, requireNote = false, isSubmitting, onCancel, onSubmit }) => {
  const [note, setNote] = useState("");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if ((requireNote && !note.trim()) || (!requireNote && !note.trim() && !files.length)) {
      setError(requireNote ? "Nhập nội dung cần chỉnh sửa." : "Nhập mô tả hoặc chọn ít nhất 1 file bàn giao.");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const uploadedFiles = await Promise.all(files.map((file) => upload(file)));
      const validFiles = uploadedFiles.filter(Boolean);
      onSubmit({ note: note.trim(), files: validFiles });
    } catch (err) {
      setError(err.message || "Upload file chưa thành công, kiểm tra Cloudinary rồi thử lại.");
    } finally {
      setUploading(false);
    }
  };

  return <form className="delivery-form" onSubmit={handleSubmit}>
    <strong>{title}</strong>
    <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={placeholder} />
    <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
    {!!files.length && <small>{files.length} file đã chọn</small>}
    {error && <p className="form-error">{error}</p>}
    <div className="form-actions">
      <button type="submit" disabled={uploading || isSubmitting}>{uploading || isSubmitting ? "Đang gửi..." : submitLabel}</button>
      <button className="muted" type="button" onClick={onCancel}>Hủy</button>
    </div>
  </form>;
};

const DeliveryForm = (props) => <UploadNoteForm
  title="Gửi kết quả cho người mua"
  placeholder="Mô tả kết quả, hướng dẫn sử dụng hoặc ghi chú bàn giao"
  submitLabel="Gửi bàn giao"
  {...props}
/>;

const RevisionForm = (props) => <UploadNoteForm
  title="Yêu cầu talent chỉnh sửa"
  placeholder="Ghi rõ phần cần sửa, mong muốn mới, deadline hoặc lưu ý. Có thể đính kèm file mẫu/reference."
  submitLabel="Gửi yêu cầu sửa"
  requireNote
  {...props}
/>;

const RefundForm = ({ order, isSubmitting, onCancel, onSubmit }) => {
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState(order.price || 0);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const refundAmount = Number(amount || 0);
    if (!reason.trim()) {
      setError("Nhập lý do hoàn tiền/tranh chấp để admin có căn cứ xử lý.");
      return;
    }
    if (refundAmount <= 0 || refundAmount > order.price) {
      setError("Số tiền hoàn không hợp lệ.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const uploadedFiles = await Promise.all(files.map((file) => upload(file)));
      onSubmit({ note: reason.trim(), amount: refundAmount, files: uploadedFiles.filter(Boolean) });
    } catch (err) {
      setError(err.message || "Upload bằng chứng chưa thành công, thử lại nha.");
    } finally {
      setUploading(false);
    }
  };

  return <form className="delivery-form dispute-form" onSubmit={handleSubmit}>
    <strong>Yêu cầu hoàn tiền / mở tranh chấp</strong>
    <small>Đơn sẽ chuyển sang trạng thái tranh chấp, tiền talent bị khóa và admin sẽ xem bằng chứng để xử lý.</small>
    <input type="number" min="1" max={order.price} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Số tiền muốn hoàn" />
    <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Mô tả vấn đề: talent giao sai gì, thiếu gì, đã yêu cầu sửa chưa, mong muốn hoàn bao nhiêu..." />
    <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
    {!!files.length && <small>{files.length} file bằng chứng đã chọn</small>}
    {error && <p className="form-error">{error}</p>}
    <div className="form-actions">
      <button type="submit" disabled={uploading || isSubmitting}>{uploading || isSubmitting ? "Đang gửi..." : "Gửi cho admin xử lý"}</button>
      <button className="muted" type="button" onClick={onCancel}>Hủy</button>
    </div>
  </form>;
};

const Timeline = ({ items }) => <div className="order-timeline">
  <strong>Lịch sử đơn hàng</strong>
  {[...items].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((item, index) => <div className="timeline-item" key={`${item.type}-${item.createdAt}-${index}`}>
    <span className="dot" />
    <div>
      <p>{item.title}</p>
      <small>{new Date(item.createdAt).toLocaleString("vi-VN")}</small>
      {item.note && <em>{item.note}</em>}
      {item.files?.length > 0 && <div className="delivery-files">{item.files.map((fileUrl, fileIndex) => <a href={fileUrl} target="_blank" rel="noreferrer" key={fileUrl}>File {fileIndex + 1}</a>)}</div>}
    </div>
  </div>)}
</div>;

const ReviewForm = ({ onCancel, onSubmit }) => { const [star, setStar] = useState(5); const [desc, setDesc] = useState(""); return <div className="review-form"><strong>Đánh giá đơn hàng</strong><select value={star} onChange={(e) => setStar(Number(e.target.value))}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} sao</option>)}</select><textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Chia sẻ trải nghiệm của bạn" /><button onClick={() => desc.trim() && onSubmit({ star, desc })}>Gửi đánh giá</button><button className="muted" onClick={onCancel}>Hủy</button></div>; };

export default Orders;
