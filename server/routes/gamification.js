
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getStats, getActivity } from "../controllers/gamification.js";

const router = Router();

router.use(authMiddleware);

router.get("/stats", getStats);
router.get("/activity", getActivity);

export default router;
