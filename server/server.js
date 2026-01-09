import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import tasksRouter from "./routes/tasks.js";
import tracksRouter from "./routes/tracks.js";
import aiRouter from "./routes/ai.js";
import userRouter from "./routes/user.js";
import challengesRouter from "./routes/challenges.js";
import reflectionsRouter from "./routes/reflections.js";
import gamificationRouter from "./routes/gamification.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [
  "http://localhost:5173",
];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

// TEST LOG: If you see this, server changes are being picked up
console.log('>>> SERVER LOADED WITH LATEST CHANGES <<<');

// Health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "direction-server" });
});

// Routes
app.use("/api/tasks", tasksRouter);
app.use("/api/tracks", tracksRouter);
app.use("/api/ai", aiRouter);
app.use("/api/user", userRouter);
app.use("/api/challenges", challengesRouter);
app.use("/api/reflections", reflectionsRouter);
app.use("/api/gamification", gamificationRouter);

// DB connect and start
async function start() {
  try {
    const uri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/direction_d";
    await mongoose.connect(uri, { dbName: undefined });
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
