require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const morgan = require("morgan");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const connectDB = require("./db");
const { SECRET } = require("./auth");

const authRoutes = require("./routes/auth");
const serviceRoutes = require("./routes/services");
const inventoryRoutes = require("./routes/inventory");
const reportRoutes = require("./routes/reports");
const notificationRoutes = require("./routes/notifications");
const userRoutes = require("./routes/users");
const pushRoutes = require("./routes/push");
const buildOrdersRouter = require("./routes/orders");

const app = express();
const server = http.createServer(app);

const configuredOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:5174").split(",").map((s) => s.trim()).filter(Boolean);
const localDevOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];
const allowedOrigins = [...new Set([...configuredOrigins, ...localDevOrigins])];
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
};

const io = new Server(server, { cors: { origin: (origin, callback) => {
  if (!origin || isAllowedOrigin(origin)) return callback(null, true);
  callback(new Error("Not allowed by CORS"));
} } });

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || isAllowedOrigin(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

// Socket.io: authenticate the connection with the same JWT used for the REST API,
// then join rooms so we can push targeted real-time events (per-user, per-role, per-order).
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(); // allow anonymous connections (e.g. public receipt page)
    socket.user = jwt.verify(token, SECRET);
    next();
  } catch (e) {
    next(); // treat invalid token as anonymous rather than rejecting the socket
  }
});

io.on("connection", (socket) => {
  if (socket.user) {
    socket.join(`user:${socket.user.id}`);
    socket.join(`role:${socket.user.role}`);
  }
  socket.on("watch:order", (orderId) => {
    if (orderId) socket.join(`order:${orderId}`);
  });
});

app.get("/api/health", (req, res) => res.json({ ok: true, service: "Laundry Management System API" }));

app.use("/api/auth", authRoutes);
app.use("/api/orders", buildOrdersRouter(io));
app.use("/api/services", serviceRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/push", pushRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    server.listen(PORT, () => console.log(`LMS backend running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("\n❌ Could not connect to MongoDB.");
    console.error("   Check MONGODB_URI in your .env file — see .env.example and DEPLOYMENT.md.");
    console.error(`   Underlying error: ${err.message}\n`);
    process.exit(1);
  });
