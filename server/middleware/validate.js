import { body, param, validationResult } from "express-validator";

export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
}

export const validateRegister = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  handleValidationErrors,
];

export const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

export const validateRefreshToken = [
  body("refreshToken").notEmpty().withMessage("Refresh token is required"),
  handleValidationErrors,
];

export const validateCreateTask = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 200 })
    .withMessage("Title must be at most 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must be at most 1000 characters"),
  body("completed")
    .optional()
    .isBoolean()
    .withMessage("Completed must be a boolean"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Invalid priority"),
  body("dueDate").optional().isISO8601().withMessage("Invalid date format"),
  body("categories")
    .optional()
    .isArray()
    .withMessage("Categories must be an array"),
  body("categories.*")
    .optional()
    .isMongoId()
    .withMessage("Invalid category ID"),
  body("trackId")
    .optional()
    .isMongoId()
    .withMessage("Invalid track ID"),
  body("trackLevel")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Track level must be a positive integer"),
  handleValidationErrors,
];

export const validateUpdateTask = [
  param("id").isMongoId().withMessage("Invalid task ID"),
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .isLength({ max: 200 })
    .withMessage("Title must be at most 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must be at most 1000 characters"),
  body("completed")
    .optional()
    .isBoolean()
    .withMessage("Completed must be a boolean"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Invalid priority"),
  body("dueDate").optional().isISO8601().withMessage("Invalid date format"),
  body("categories")
    .optional()
    .isArray()
    .withMessage("Categories must be an array"),
  body("categories.*")
    .optional()
    .isMongoId()
    .withMessage("Invalid category ID"),
  handleValidationErrors,
];

export const validateDeleteTask = [
  param("id").isMongoId().withMessage("Invalid task ID"),
  handleValidationErrors,
];

export const validateCreateTrack = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Track name is required")
    .isLength({ max: 100 })
    .withMessage("Track name must be at most 100 characters"),
  body("currentLevel")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Current level must be a positive integer"),
  body("levels").optional().isArray().withMessage("Levels must be an array"),
  body("levels.*.title")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Level title must be at most 100 characters"),
  body("levels.*.description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Level description must be at most 500 characters"),
  body("levels.*.levelNumber")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Level number must be a positive integer"),
  handleValidationErrors,
];

export const validateUpdateTrack = [
  param("id").isMongoId().withMessage("Invalid track ID"),
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Track name cannot be empty")
    .isLength({ max: 100 })
    .withMessage("Track name must be at most 100 characters"),
  body("currentLevel")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Current level must be a positive integer"),
  body("levels").optional().isArray().withMessage("Levels must be an array"),
  handleValidationErrors,
];

export const validateDeleteTrack = [
  param("id").isMongoId().withMessage("Invalid track ID"),
  handleValidationErrors,
];

export const validateMongoId = [
  param("id").isMongoId().withMessage("Invalid ID format"),
  handleValidationErrors,
];

export const validateUserUpdate = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("settings.gamificationEnabled")
    .optional()
    .isBoolean()
    .withMessage("gamificationEnabled must be a boolean"),
  body("settings.challengeFrequency")
    .optional()
    .isIn(["daily", "weekly", "off"])
    .withMessage("Invalid challenge frequency"),
  handleValidationErrors,
];

export const validateCreateCategory = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ max: 50 })
    .withMessage("Category name must be at most 50 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Description must be at most 200 characters"),
  body("color")
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage("Invalid color format (use hex like #FF5733)"),
  body("icon")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Icon must be at most 50 characters"),
  handleValidationErrors,
];

export const validateUpdateCategory = [
  param("id").isMongoId().withMessage("Invalid category ID"),
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Category name cannot be empty")
    .isLength({ max: 50 })
    .withMessage("Category name must be at most 50 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Description must be at most 200 characters"),
  body("color")
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage("Invalid color format (use hex like #FF5733)"),
  body("icon")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Icon must be at most 50 characters"),
  handleValidationErrors,
];

export const validateDeleteCategory = [
  param("id").isMongoId().withMessage("Invalid category ID"),
  handleValidationErrors,
];

export const validateCreateChallenge = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Challenge title is required")
    .isLength({ max: 200 })
    .withMessage("Title must be at most 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must be at most 1000 characters"),
  body("difficulty")
    .optional()
    .isIn(["easy", "medium", "hard"])
    .withMessage("Invalid difficulty"),
  body("status")
    .optional()
    .isIn(["active", "completed", "skipped"])
    .withMessage("Invalid status"),
  body("weekOf").optional().isISO8601().withMessage("Invalid date format"),
  handleValidationErrors,
];

export const validateUpdateChallenge = [
  param("id").isMongoId().withMessage("Invalid challenge ID"),
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .isLength({ max: 200 })
    .withMessage("Title must be at most 200 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must be at most 1000 characters"),
  body("difficulty")
    .optional()
    .isIn(["easy", "medium", "hard"])
    .withMessage("Invalid difficulty"),
  body("status")
    .optional()
    .isIn(["active", "completed", "skipped"])
    .withMessage("Invalid status"),
  body("weekOf").optional().isISO8601().withMessage("Invalid date format"),
  handleValidationErrors,
];

export const validateDeleteChallenge = [
  param("id").isMongoId().withMessage("Invalid challenge ID"),
  handleValidationErrors,
];

export const validateCreateReflection = [
  body("text")
    .trim()
    .notEmpty()
    .withMessage("Reflection text is required")
    .isLength({ max: 2000 })
    .withMessage("Text must be at most 2000 characters"),
  body("mood")
    .optional()
    .isIn(["energized", "balanced", "stretched", "depleted"])
    .withMessage("Invalid mood"),
  body("forDate").optional().isISO8601().withMessage("Invalid date format"),
  handleValidationErrors,
];

export const validateUpdateReflection = [
  param("id").isMongoId().withMessage("Invalid reflection ID"),
  body("text")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Text cannot be empty")
    .isLength({ max: 2000 })
    .withMessage("Text must be at most 2000 characters"),
  body("mood")
    .optional()
    .isIn(["energized", "balanced", "stretched", "depleted"])
    .withMessage("Invalid mood"),
  body("forDate").optional().isISO8601().withMessage("Invalid date format"),
  handleValidationErrors,
];

export const validateDeleteReflection = [
  param("id").isMongoId().withMessage("Invalid reflection ID"),
  handleValidationErrors,
];

export const validateUpdateProfile = [
  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio must be at most 500 characters"),
  body("avatar").optional().trim(),
  body("timezone").optional().trim(),
  body("dateFormat")
    .optional()
    .isIn(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"])
    .withMessage("Invalid date format"),
  body("weekStartsOn")
    .optional()
    .isIn(["sunday", "monday"])
    .withMessage("Invalid week start day"),
  body("notifications.email")
    .optional()
    .isBoolean()
    .withMessage("notifications.email must be a boolean"),
  body("notifications.push")
    .optional()
    .isBoolean()
    .withMessage("notifications.push must be a boolean"),
  body("notifications.dailyReminder")
    .optional()
    .isBoolean()
    .withMessage("notifications.dailyReminder must be a boolean"),
  body("notifications.weeklyDigest")
    .optional()
    .isBoolean()
    .withMessage("notifications.weeklyDigest must be a boolean"),
  body("productivity.dailyGoal")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("Daily goal must be between 1 and 20"),
  body("productivity.focusSessionMinutes")
    .optional()
    .isInt({ min: 5, max: 120 })
    .withMessage("Focus session must be between 5 and 120 minutes"),
  body("productivity.breakMinutes")
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage("Break must be between 1 and 30 minutes"),
  handleValidationErrors,
];
