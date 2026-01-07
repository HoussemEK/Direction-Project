import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateUserUpdate,
} from "../middleware/validate.js";
import {
  register,
  login,
  logout,
  refresh,
  getMe,
  updateMe,
  deleteUser,
} from "../controllers/user.js";

const router = Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/logout", authMiddleware, logout);
router.post("/refresh", validateRefreshToken, refresh);
router.get("/me", authMiddleware, getMe);
router.patch("/me", authMiddleware, validateUserUpdate, updateMe);
router.delete("/me", authMiddleware, deleteUser);

export default router;
