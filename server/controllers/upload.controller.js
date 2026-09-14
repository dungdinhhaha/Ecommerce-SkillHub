const fs = require("fs");
const { v2: cloudinary } = require("cloudinary");
const createError = require("../utils/createError");

const MAX_UPLOAD_SIZE = 500 * 1024 * 1024;
const MAX_UPLOAD_SIZE_LABEL = "500MB";

const removeTempFile = (path) => {
  if (!path) return;
  fs.promises.unlink(path).catch(() => {});
};

exports.uploadFile = async (req, res, next) => {
  if (!req.file) return next(createError(400, "Vui lòng chọn file để upload."));
  if (req.file.size > MAX_UPLOAD_SIZE) {
    removeTempFile(req.file.path);
    return next(createError(400, `File vượt quá ${MAX_UPLOAD_SIZE_LABEL}. Vui lòng nén lại hoặc chia nhỏ file.`));
  }
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    removeTempFile(req.file.path);
    return next(createError(500, "Server chưa cấu hình Cloudinary để upload file."));
  }

  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });

    const result = await cloudinary.uploader.upload_large(req.file.path, {
      resource_type: "auto",
      folder: "skillhub_uploads",
      use_filename: true,
      unique_filename: true,
      chunk_size: 20 * 1024 * 1024,
    });

    res.status(201).json({
      success: true,
      data: {
        url: result.secure_url,
        originalName: req.file.originalname,
        size: req.file.size,
        resourceType: result.resource_type,
      },
    });
  } catch (err) {
    next(createError(400, err.message || "Upload file chưa thành công."));
  } finally {
    removeTempFile(req.file.path);
  }
};
