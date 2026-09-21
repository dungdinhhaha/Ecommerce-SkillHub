import request from "./request.utils";

const getApiFileUrl = (path) => {
  if (/^https?:\/\//i.test(path)) return path;
  const baseUrl = request.defaults.baseURL || "";
  return `${baseUrl.replace(/\/$/, "")}/${String(path).replace(/^\//, "")}`;
};

const downloadByBrowser = (url) => {
  const link = document.createElement("a");
  link.href = url;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const downloadProtectedFile = async (url, fallbackName = "skillhub-file") => {
  downloadByBrowser(getApiFileUrl(url));
};
