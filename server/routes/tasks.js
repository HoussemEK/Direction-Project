
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  validateCreateTask,
  validateUpdateTask,
  validateDeleteTask,
} from "../middleware/validate.js";
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/tasks.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getTasks);
router.get("/:id", getTask);
router.post("/", validateCreateTask, createTask);
router.patch("/:id", validateUpdateTask, updateTask);
router.delete("/:id", validateDeleteTask, deleteTask);

export default router;
