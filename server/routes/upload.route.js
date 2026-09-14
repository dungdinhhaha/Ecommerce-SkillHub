const router = require("express").Router();
const multer = require("multer");
const os = require("os");
const path = require("path");
const createError = require("../utils/createError");
const { uploadFile } = require("../controllers/upload.controller");

const MAX_UPLOAD_SIZE = 500 * 1024 * 1024;
const BLOCKED_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".com", ".scr", ".pif", ".msi", ".dll",
  ".ps1", ".vbs", ".js", ".jse", ".wsf", ".sh", ".jar", ".apk",
  ".dmg", ".deb", ".rpm",
];

const storage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${Math.random().toString(16).slice(2)}-${file.originalname}`.replace(/[^\w.\-]+/g, "_");
    cb(null, safeName);
  },
});

const uploader = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      return cb(createError(400, `File ${file.originalname} có định dạng ${ext} rủi ro cao. Vui lòng nén thành .zip hoặc dùng định dạng tài liệu an toàn.`));
    }
    cb(null, true);
  },
});

router.post("/", (req, res, next) => {
  uploader.single("file")(req, res, (err) => {
    if (err?.code === "LIMIT_FILE_SIZE") {
      return next(createError(400, "File vượt quá 500MB. Vui lòng nén lại hoặc chia nhỏ file."));
    }
    if (err) return next(err);
    return uploadFile(req, res, next);
  });
});

module.exports = router;
