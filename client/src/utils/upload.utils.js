import request from "./request.utils";

const BLOCKED_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".com", ".scr", ".pif", ".msi", ".dll",
  ".ps1", ".vbs", ".js", ".jse", ".wsf", ".sh", ".jar", ".apk",
  ".dmg", ".deb", ".rpm",
];

export const MAX_UPLOAD_SIZE = 500 * 1024 * 1024;
export const MAX_UPLOAD_SIZE_LABEL = "500MB";

export const validateUploadFile = (file) => {
  if (!file) return "";
  const name = file.name || "";
  const lowerName = name.toLowerCase();
  const blocked = BLOCKED_EXTENSIONS.find((ext) => lowerName.endsWith(ext));
  if (blocked) {
    return `File ${name} có định dạng ${blocked} rủi ro cao. Vui lòng đóng gói tài nguyên hợp pháp trong .zip/.pdf/.docx/.pptx hoặc liên hệ admin để kiểm tra.`;
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return `File ${name} vượt quá ${MAX_UPLOAD_SIZE_LABEL}. Vui lòng nén lại hoặc chia nhỏ file.`;
  }
  return "";
};

const upload = async (file) => {
  const validationError = validateUploadFile(file);
  if (validationError) throw new Error(validationError);
  const data = new FormData();
  data.append("file", file);

  try {
    const res = await request.post("/upload", data);
    return res.data.data.url;
  } catch (err) {
    console.log(err);
    console.log(err.message);
    throw new Error(err.response?.data?.error || err.response?.data?.message || err.message || "Upload file chưa thành công.");
  }
};

export default upload;
