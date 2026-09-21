import request from "./request.utils";

const getFileNameFromDisposition = (disposition = "", fallback = "skillhub-file") => {
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
  return asciiMatch?.[1] || fallback;
};

const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || "skillhub-file";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const downloadProtectedFile = async (url, fallbackName = "skillhub-file") => {
  const res = await request.get(url, { responseType: "blob" });
  const fileName = getFileNameFromDisposition(res.headers["content-disposition"], fallbackName);
  downloadBlob(res.data, fileName);
};
