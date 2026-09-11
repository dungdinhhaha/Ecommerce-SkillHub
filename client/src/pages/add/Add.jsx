import React, { useEffect, useReducer, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { INIT_STATE, gigReducer } from "../../reducer/gigReducer";
import upload from "../../utils/upload.utils.js";
import "./Add.scss";
import request from "../../utils/request.utils";

const Add = () => {
  const savedDraft = (() => {
    try {
      return JSON.parse(localStorage.getItem("skillhub_listing_draft")) || {};
    } catch {
      return {};
    }
  })();
  const [singleFile, setSingleFile] = useState(undefined);
  const [files, setFiles] = useState([]);
  const [digitalFile, setDigitalFile] = useState(undefined);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [state, dispatch] = useReducer(gigReducer, { ...INIT_STATE, ...savedDraft });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => request.get("/categories").then((res) => res.data.data),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    localStorage.setItem("skillhub_listing_draft", JSON.stringify(state));
  }, [state]);

  const mutation = useMutation({
    mutationFn: (gig) =>
      request.post("/gigs", gig).then((res) => res.data.data),
    onSuccess: () => {
      localStorage.removeItem("skillhub_listing_draft");
      queryClient.invalidateQueries("myGigs");
      navigate("/mygigs");
    },
    onError: (err) => setError(err.response?.data?.error || "Không thể tạo listing"),
  });

  const handleChange = (e) => {
    dispatch({
      type: "CHANGE_INPUT",
      payload: { name: e.target.name, value: e.target.value },
    });
  };

  const handleFeature = (e) => {
    e.preventDefault();
    const feature = e.target[0].value.trim();
    if (!feature || state.features.includes(feature)) return;
    dispatch({
      type: "ADD_FEATURE",
      payload: feature,
    });
    e.target[0].value = "";
  };

  const handleUploads = async (e) => {
    e.preventDefault();
    setError("");
    if (!singleFile) {
      setError("Vui lòng chọn ảnh bìa trước khi upload.");
      return;
    }
    if (state.listingType === "digital_product" && !digitalFile) {
      setError("Sản phẩm số cần có file để người mua tải sau thanh toán.");
      return;
    }
    setUploading(true);
    try {
      const cover = await upload(singleFile);
      const images = await Promise.all(
        [...files].map(async (file) => await upload(file))
      );
      let digitalFileUrl = "";
      if (state.listingType === "digital_product" && digitalFile) {
        digitalFileUrl = await upload(digitalFile);
      }
      setUploading(false);
      dispatch({ type: "ADD_IMAGES", payload: {
        cover,
        images,
        digitalFileUrl,
        digitalFileName: digitalFile?.name || "",
      } });
    } catch (err) {
      setError(err.message || "Upload chưa thành công, kiểm tra Cloudinary rồi thử lại.");
      setUploading(false);
    }
  };

  const validateListing = () => {
    const required = [
      ["title", "Vui lòng nhập tiêu đề."],
      ["cat", "Vui lòng chọn danh mục."],
      ["description", "Vui lòng nhập mô tả chi tiết."],
      ["shortTitle", "Vui lòng nhập tên gói ngắn."],
      ["shortDesc", "Vui lòng nhập mô tả ngắn."],
      ["price", "Vui lòng nhập giá."],
    ];
    for (const [field, message] of required) {
      if (!String(state[field] || "").trim() || state[field] === 0) return message;
    }
    if (state.listingType !== "digital_product" && Number(state.deliveryTime) <= 0) return "Dịch vụ kỹ năng cần có thời gian bàn giao.";
    if (Number(state.revisionNumber) < 0) return "Số lần chỉnh sửa không hợp lệ.";
    if (!state.cover) return "Vui lòng upload ảnh bìa trước khi tạo.";
    if (state.listingType === "digital_product" && !state.digitalFileUrl) return "Vui lòng upload file sản phẩm số.";
    return "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const message = validateListing();
    if (message) {
      setError(message);
      return;
    }
    mutation.mutate(state);
  };

  return (
    <div className="add">
      <div className="container">
        <div className="add-hero">
          <span className="sh-badge service">Talent studio</span>
          <h1>Đăng sản phẩm/dịch vụ</h1>
          <p>Tạo listing rõ ràng, dễ duyệt và đủ thông tin để buyer quyết định nhanh.</p>
        </div>
        <div className="add-steps">
          {["Loại listing", "Thông tin", "Giá & file", "Preview"].map((label, index) => <button className={step === index + 1 ? "active" : step > index + 1 ? "done" : ""} onClick={() => setStep(index + 1)} key={label}>
            <span>{index + 1}</span>{label}
          </button>)}
        </div>
        <div className="sections">
          <div className="left">
            {step === 1 && <div className="step-panel">
              <h2>1. Chọn loại listing</h2>
              <p className="step-hint">Sản phẩm số là file/template tải về. Dịch vụ kỹ năng là talent làm theo yêu cầu buyer.</p>
              <label htmlFor="listingType">Loại listing</label>
              <select name="listingType" id="listingType" onChange={handleChange} value={state.listingType}>
                <option value="skill_service">Dịch vụ kỹ năng</option>
                <option value="digital_product">Sản phẩm số</option>
              </select>
              <label htmlFor="cat">Danh mục</label>
              <select name="cat" id="cat" onChange={handleChange} value={state.cat || ""}>
                <option disabled value="">Chọn danh mục</option>
                {categories.map((cat) => <option value={cat.slug} key={cat._id || cat.slug}>{cat.name}</option>)}
              </select>
              <button type="button" onClick={() => setStep(2)}>Tiếp tục</button>
            </div>}
            {step === 2 && <div className="step-panel">
            <h2>2. Thông tin cơ bản</h2>
            <p className="step-hint">
              Đây là phần buyer đọc để hiểu bạn bán gì, phù hợp với ai và kết quả họ sẽ nhận được.
            </p>
            <label htmlFor="title">Tiêu đề <small>Tên listing hiển thị trên marketplace</small></label>
            <input
              type="text"
              name="title"
              id="title"
              placeholder="Ví dụ: Thiết kế PowerPoint thuyết trình chuyên nghiệp"
              onChange={handleChange}
              value={state.title}
            />
            <label htmlFor="description">Mô tả chi tiết <small>Phạm vi, quyền lợi, điều kiện sử dụng/bàn giao</small></label>
            <textarea
              name="description"
              id="description"
              cols="30"
              rows="12"
              onChange={handleChange}
              value={state.description}
              placeholder="Mô tả phạm vi công việc/sản phẩm, người mua nhận được gì, điều kiện sử dụng..."
            ></textarea>
            <button type="button" onClick={() => setStep(3)}>Tiếp tục</button>
            </div>}
            {step === 3 && <div className="step-panel">
            <h2>3. Giá, gói và file</h2>
            <p className="step-hint">
              Đây là phần đóng gói để bán: ảnh/file, giá, thời gian bàn giao, số lần sửa và các dấu tích nổi bật buyer sẽ thấy ở trang chi tiết.
            </p>
            <div className="images">
              <div className="image-inputs">
                <label htmlFor="">
                  Ảnh bìa
                  <input
                    type="file"
                    name=""
                    id=""
                    onChange={(e) => setSingleFile(e.target.files[0])}
                  />
                </label>
                {state.listingType === "digital_product" && (
                  <label htmlFor="digitalFile">
                    File sản phẩm số
                    <input
                      type="file"
                      id="digitalFile"
                      onChange={(e) => setDigitalFile(e.target.files[0])}
                    />
                  </label>
                )}
                <label htmlFor="">
                  Ảnh mô tả thêm
                  <input
                    type="file"
                    name=""
                    id=""
                    multiple
                    onChange={(e) => setFiles(e.target.files)}
                  />
                </label>
              </div>
              <button
                onClick={handleUploads}
                disabled={uploading ? true : false}
              >
                {uploading ? "Đang upload..." : "Upload file"}
              </button>
            </div>
            <label htmlFor="shortTitle">Tên gói ngắn <small>Dòng tóm tắt của gói mua</small></label>
            <input
              type="text"
              name="shortTitle"
              id="shortTitle"
              placeholder="Ví dụ: Gói thiết kế 10 slide"
              onChange={handleChange}
              value={state.shortTitle}
            />
            <label htmlFor="shortDesc">Mô tả ngắn <small>1–2 câu lợi ích chính, hiện trên card/checkout</small></label>
            <textarea
              name="shortDesc"
              onChange={handleChange}
              id="shortDesc"
              cols="30"
              rows="10"
              value={state.shortDesc}
              placeholder="Tóm tắt nhanh lợi ích chính"
            ></textarea>
            <label htmlFor="deliveryTime">Thời gian bàn giao <small>Số ngày buyer dự kiến nhận kết quả</small></label>
            <input
              type="number"
              min={1}
              onChange={handleChange}
              name="deliveryTime"
              id="deliveryTime"
              value={state.deliveryTime || ""}
            />
            <label htmlFor="revisionNumber">
              Số lần chỉnh sửa <small>Số lượt buyer được yêu cầu sửa sau bàn giao</small>
            </label>
            <input type="number" min={0} id="revisionNumber" name="revisionNumber" onChange={handleChange} value={state.revisionNumber || ""} />
            <label htmlFor="featureInput">Điểm nổi bật <small>Mỗi dòng sẽ hiện bằng dấu tích xanh ở trang chi tiết</small></label>
            <form className="add" onSubmit={handleFeature}>
              <input type="text" name="" id="featureInput" placeholder="Ví dụ: Bao gồm file nguồn" />
              <button type="submit">Thêm</button>
            </form>
            <div className="feature-examples">
              {["File nguồn đầy đủ", "Hướng dẫn sử dụng", "Bàn giao đúng hạn", "Hỗ trợ sau bàn giao"].map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => dispatch({ type: "ADD_FEATURE", payload: item })}
                  disabled={state.features.includes(item)}
                >
                  + {item}
                </button>
              ))}
            </div>
            <div className="added-featurs">
              {state?.features?.map((f, i) => (
                <div className="feature" key={i}>
                  <button
                    onClick={() =>
                      dispatch({ type: "REMOVE_FEATURE", payload: f })
                    }
                  >
                    {f}
                    <span>X</span>
                  </button>
                </div>
              ))}
            </div>
            <label htmlFor="price">Giá bán <small>Nhập giá bằng VND, chưa cần dấu chấm</small></label>
            <input type="number" min={1} id="price" name="price" onChange={handleChange} value={state.price || ""} />
            <button type="button" onClick={() => setStep(4)}>Xem preview</button>
            </div>}
            {step === 4 && <div className="step-panel">
              <h2>4. Kiểm tra lần cuối</h2>
              <p className="step-hint">Nếu preview ổn, bấm tạo listing. Admin sẽ duyệt trước khi hiển thị công khai.</p>
              <button onClick={handleSubmit} disabled={mutation.isLoading || uploading}>
                {mutation.isLoading ? "Đang lưu..." : "Tạo listing"}
              </button>
              {error && <p className="form-error">{error}</p>}
            </div>}
          </div>
          <aside className="right preview-panel">
            <h2>Preview buyer sẽ thấy</h2>
            <div className="preview-card">
              <div className="preview-cover">{state.cover ? <img src={state.cover} alt="" /> : <span>Ảnh bìa</span>}</div>
              <span className={`sh-badge ${state.listingType === "digital_product" ? "product" : "service"}`}>{state.listingType === "digital_product" ? "Sản phẩm số" : "Dịch vụ kỹ năng"}</span>
              <h3>{state.title || "Tiêu đề listing của bạn"}</h3>
              <p>{state.shortDesc || "Mô tả ngắn sẽ xuất hiện trên card tìm kiếm."}</p>
              <div className="preview-meta"><span>{state.deliveryTime || 1} ngày</span><span>{state.revisionNumber || 0} lần sửa</span></div>
              {!!state.features?.length && (
                <ul className="preview-features">
                  {state.features.slice(0, 4).map((feature) => <li key={feature}>✓ {feature}</li>)}
                </ul>
              )}
              <strong>{Number(state.price || 0).toLocaleString("vi-VN")}đ</strong>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Add;
