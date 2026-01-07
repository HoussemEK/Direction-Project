import { Router } from "express";
import axios from "axios";

const router = Router();

router.post("/proxy", async (req, res) => {
  try {
    const { path, payload } = req.body; // e.g., path="/generate/insight"
    const base = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
    const url = `${base}${path}`;
    const { data } = await axios.post(url, payload || {});
    res.json(data);
  } catch (err) {
    console.error("AI proxy error:", err.message);
    res.status(502).json({ error: "AI service unavailable" });
  }
});

export default router;
