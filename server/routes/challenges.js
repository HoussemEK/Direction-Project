
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  validateCreateChallenge,
  validateUpdateChallenge,
  validateDeleteChallenge,
} from "../middleware/validate.js";
import {
  getMeta,
  getChallenges,
  getActiveChallenge,
  getChallenge,
  createChallenge,
  updateChallenge,
  completeChallenge,
  startChallenge,
  skipChallenge,
  deleteChallenge,
} from "../controllers/challenges.js";

const router = Router();

router.use(authMiddleware);

router.get("/meta", getMeta);
router.get("/", getChallenges);
router.get("/active", getActiveChallenge);
router.get("/:id", getChallenge);
router.post("/", validateCreateChallenge, createChallenge);
router.patch("/:id", validateUpdateChallenge, updateChallenge);
router.patch("/:id/complete", completeChallenge);
router.patch("/:id/start", startChallenge);
router.patch("/:id/skip", skipChallenge);
router.delete("/:id", validateDeleteChallenge, deleteChallenge);

export default router;
