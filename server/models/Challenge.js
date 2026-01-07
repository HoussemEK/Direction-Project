import mongoose from "mongoose";

const challengeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    title: String,
    description: String,
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    category: {
      type: String,
      enum: [
        "productivity",
        "wellness",
        "learning",
        "social",
        "creativity",
        "fitness",
      ],
      default: "productivity",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "active",
        "completed",
        "skipped",
        "expired",
      ],
      default: "pending",
    },
    weekOf: { type: Date, index: true },
    isTimed: {
      type: Boolean,
      default: false,
    },
    durationMinutes: {
      type: Number,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    xpAwarded: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// XP rewards based on difficulty
challengeSchema.statics.XP_REWARDS = {
  easy: 25,
  medium: 50,
  hard: 100,
};

// Category icons and colors
challengeSchema.statics.CATEGORIES = {
  productivity: { icon: "📊", color: "#3b82f6", label: "Productivity" },
  wellness: { icon: "🧘", color: "#10b981", label: "Wellness" },
  learning: { icon: "📚", color: "#8b5cf6", label: "Learning" },
  social: { icon: "👥", color: "#f59e0b", label: "Social" },
  creativity: { icon: "🎨", color: "#ec4899", label: "Creativity" },
  fitness: { icon: "💪", color: "#ef4444", label: "Fitness" },
};

// Timed challenge durations (in minutes)
challengeSchema.statics.TIMED_DURATIONS = {
  quick: 15,
  standard: 30,
  extended: 60,
  marathon: 120,
};

// Check if timed challenge has expired
challengeSchema.methods.isExpired = function () {
  if (!this.isTimed || !this.startedAt || !this.durationMinutes) return false;
  const endTime = new Date(
    this.startedAt.getTime() + this.durationMinutes * 60000
  );
  return new Date() > endTime;
};

// Get remaining time in seconds
challengeSchema.methods.getRemainingTime = function () {
  if (!this.isTimed || !this.startedAt || !this.durationMinutes) return null;
  const endTime = new Date(
    this.startedAt.getTime() + this.durationMinutes * 60000
  );
  const remaining = Math.max(0, Math.floor((endTime - new Date()) / 1000));
  return remaining;
};

// Calculate XP for this challenge
challengeSchema.methods.calculateXP = function () {
  let baseXP = this.constructor.XP_REWARDS[this.difficulty] || 50;

  // Bonus for timed challenges
  if (this.isTimed) {
    baseXP = Math.floor(baseXP * 1.5);
  }

  return baseXP;
};

export default mongoose.model("Challenge", challengeSchema);
