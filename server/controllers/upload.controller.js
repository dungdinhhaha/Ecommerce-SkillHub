const fs = require("fs");
const { v2: cloudinary } = require("cloudinary");
const createError = require("../utils/createError");

const MAX_UPLOAD_SIZE = 500 * 1024 * 1024;
const MAX_UPLOAD_SIZE_LABEL = "500MB";
const LARGE_UPLOAD_THRESHOLD = 95 * 1024 * 1024;

const removeTempFile = (path) => {
  if (!path) return;
  fs.promises.unlink(path).catch(() => {});
};

const uploadToCloudinary = (filePath, fileSize) => {
  const options = {
    resource_type: "auto",
    folder: "skillhub_uploads",
    use_filename: true,
    unique_filename: true,
  };

  if (fileSize <= LARGE_UPLOAD_THRESHOLD) {
    return cloudinary.uploader.upload(filePath, options);
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_large(
      filePath,
      {
        ...options,
        chunk_size: 20 * 1024 * 1024,
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );
  });
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

    const result = await uploadToCloudinary(req.file.path, req.file.size);
    if (!result?.secure_url) {
      throw createError(502, "Cloudinary đã nhận file nhưng chưa trả về link tải. Vui lòng thử lại.");
    }

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
