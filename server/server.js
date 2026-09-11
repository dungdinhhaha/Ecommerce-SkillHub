require("dotenv").config();
const express = require("express");
const http = require("http");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

// import routes
const authRouter = require("./routes/auth.route");
const userRotuer = require("./routes/user.route");
const gigRouter = require("./routes/gig.route");
const conversationRouter = require("./routes/conversation.route");
const adminRouter = require("./routes/admin.route");
const walletRouter = require("./routes/wallet.route");
const categoryRouter = require("./routes/category.route");
const wishlistRouter = require("./routes/wishlist.route");
const voucherRouter = require("./routes/voucher.route");
const { handleSepayWebhook } = require("./controllers/order.controller");

const app = express();
const server = http.createServer(app);
const ENV = process.env;
const PORT = ENV.PORT || 7000;
const DB_URI = ENV.DB_URI;
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...(ENV.CLIENT_URL ? ENV.CLIENT_URL.split(",").map((origin) => origin.trim()).filter(Boolean) : []),
];
const authAttempts = new Map();

const securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://vietqr.app",
      "media-src 'self' https://res.cloudinary.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "script-src 'self'",
      "frame-src https://www.google.com https://maps.google.com",
      `connect-src 'self' http://localhost:7000 http://127.0.0.1:7000 ws://localhost:7000 ws://127.0.0.1:7000 ${allowedOrigins.join(" ")} ${allowedOrigins.map((origin) => origin.replace(/^http/, "ws")).join(" ")} https://api.cloudinary.com`,
    ].join("; ")
  );
  next();
};

const authRateLimit = (req, res, next) => {
  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxAttempts = 20;
  const record = authAttempts.get(key) || { count: 0, resetAt: now + windowMs };
  if (record.resetAt < now) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }
  record.count += 1;
  authAttempts.set(key, record);
  if (record.count > maxAttempts) {
    return res.status(429).json({ success: false, error: "Bạn thử đăng nhập/đăng ký quá nhiều lần, vui lòng thử lại sau." });
  }
  next();
};

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("join_conversation", (conversationId) => {
    if (conversationId) socket.join(`conversation:${conversationId}`);
  });
  socket.on("leave_conversation", (conversationId) => {
    if (conversationId) socket.leave(`conversation:${conversationId}`);
  });
  socket.on("join_user", (userId) => {
    if (userId) socket.join(`user:${userId}`);
  });
});

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(securityHeaders);
ENV.NODE_ENV === "development" && app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use((req, res, next) => {
  req.io = io;
  next();
});

// mount routes
app.use("/api/auth", authRateLimit, authRouter);
app.use("/api/user", userRotuer);
app.use("/api/gigs", gigRouter);
app.use("/api/conversation", conversationRouter);
app.use("/api/admin", adminRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/vouchers", voucherRouter);
app.post("/api/webhooks/sepay", handleSepayWebhook);
app.get("/api/webhooks/sepay", (req, res) => {
  res.status(200).json({ success: true, message: "SkillHub SePay webhook is ready" });
});
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "SkillHub API is running" });
});

app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Internal Server Error";
  console.log(err);
  return res.status(errorStatus).json({ success: false, error: errorMessage });
});

server.listen(PORT, () => {
  console.log(`Server runnning on http://localhost:${PORT}/`);
  connectDB(DB_URI);
});
