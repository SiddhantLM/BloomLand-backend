const express = require("express");
const app = express();
const fileUpload = require("express-fileupload");
const cors = require("cors");
const MongoStore = require("connect-mongo");
const db = require("./config/database");
const passport = require("passport");
const session = require("express-session");
require("dotenv").config();
require("./utils/scheduler");

db.connectDB();

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:4000",
          ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
  // res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});
app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "hdshivuhiohiohbioehiobefiobhioe",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.DATABASE_URL,
      ttl: 60 * 60 * 24,
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/event");
const registration_requests = require("./routes/registrationRequest");
const event_requests = require("./routes/eventRequest");
const adminRoutes = require("./routes/admin");
const ticketRoutes = require("./routes/ticket");
const blogRoutes = require("./routes/blog");
const paymentRoutes = require("./routes/payment");
const newsletterRoutes = require("./routes/newsletter");
app.use("/api/auth", authRoutes);
app.use("/api/event", eventRoutes);
app.use("/api/registration_requests", registration_requests);
app.use("/api/event_requests", event_requests);
app.use("/api/admin", adminRoutes);
app.use("/api/ticket", ticketRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/newsletter", newsletterRoutes);

app.listen(process.env.PORT || 4000, (req, res) => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
