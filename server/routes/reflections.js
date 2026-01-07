
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  validateCreateReflection,
  validateUpdateReflection,
  validateDeleteReflection,
} from "../middleware/validate.js";
import {
  getReflections,
  getTodayReflection,
  getReflection,
  createReflection,
  updateReflection,
  deleteReflection,
} from "../controllers/reflections.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getReflections);
router.get("/today", getTodayReflection);
router.get("/:id", getReflection);
router.post("/", validateCreateReflection, createReflection);
router.patch("/:id", validateUpdateReflection, updateReflection);
router.delete("/:id", validateDeleteReflection, deleteReflection);

export default router;
