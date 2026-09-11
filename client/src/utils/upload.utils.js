import axios from "axios";

const BLOCKED_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".com", ".scr", ".pif", ".msi", ".dll",
  ".ps1", ".vbs", ".js", ".jse", ".wsf", ".sh", ".jar", ".apk",
  ".dmg", ".deb", ".rpm",
];

const MAX_UPLOAD_SIZE = 200 * 1024 * 1024;

export const validateUploadFile = (file) => {
  if (!file) return "";
  const name = file.name || "";
  const lowerName = name.toLowerCase();
  const blocked = BLOCKED_EXTENSIONS.find((ext) => lowerName.endsWith(ext));
  if (blocked) {
    return `File ${name} có định dạng ${blocked} rủi ro cao. Vui lòng đóng gói tài nguyên hợp pháp trong .zip/.pdf/.docx/.pptx hoặc liên hệ admin để kiểm tra.`;
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return `File ${name} vượt quá 200MB. Vui lòng nén lại hoặc chia nhỏ file.`;
  }
  return "";
};

const upload = async (file) => {
  const validationError = validateUploadFile(file);
  if (validationError) throw new Error(validationError);
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

  try {
    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`,
      data
    );
    const { secure_url } = res.data;
    return secure_url;
  } catch (err) {
    console.log(err);
    console.log(err.message);
  }
};

export default upload;
