import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  validateCreateTrack,
  validateUpdateTrack,
  validateDeleteTrack,
} from "../middleware/validate.js";
import {
  getTracks,
  getTrack,
  createTrack,
  updateTrack,
  completeTrack,
  deleteTrack,
} from "../controllers/tracks.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getTracks);
router.get("/:id", getTrack);
router.post("/", validateCreateTrack, createTrack);
router.patch("/:id", validateUpdateTrack, updateTrack);
router.patch("/:id/complete", completeTrack);
router.delete("/:id", validateDeleteTrack, deleteTrack);

export default router;
