import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: "🏆" },
  earnedAt: { type: Date, default: Date.now },
  category: {
    type: String,
    enum: ["tasks", "streaks", "challenges", "milestones", "special"],
    default: "milestones",
  },
});

const gamificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    totalTasksCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalChallengesCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActiveDate: {
      type: Date,
      default: null,
    },
    badges: [badgeSchema],
    weeklyXP: {
      type: Number,
      default: 0,
      min: 0,
    },
    weeklyTasksCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    weekStartDate: {
      type: Date,
      default: null,
    },
    dailyRewardClaimed: {
      type: Date,
      default: null,
    },
    weeklyRewardClaimed: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// XP required for each level (exponential growth)
gamificationSchema.statics.getXPForLevel = function (level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

// Calculate level from total XP
gamificationSchema.statics.calculateLevel = function (totalXP) {
  let level = 1;
  let xpRequired = 100;
  let xpAccumulated = 0;

  while (xpAccumulated + xpRequired <= totalXP) {
    xpAccumulated += xpRequired;
    level++;
    xpRequired = Math.floor(100 * Math.pow(1.5, level - 1));
  }

  return {
    level,
    currentLevelXP: totalXP - xpAccumulated,
    xpForNextLevel: xpRequired,
    totalXP,
  };
};

// XP rewards configuration
gamificationSchema.statics.XP_REWARDS = {
  TASK_COMPLETE: 10,
  TASK_COMPLETE_HIGH_PRIORITY: 20,
  TASK_COMPLETE_MEDIUM_PRIORITY: 15,
  TASK_COMPLETE_LOW_PRIORITY: 10,
  CHALLENGE_COMPLETE_EASY: 25,
  CHALLENGE_COMPLETE_MEDIUM: 50,
  CHALLENGE_COMPLETE_HARD: 100,
  DAILY_STREAK_BONUS: 5,
  WEEKLY_STREAK_BONUS: 50,
  REFLECTION_SUBMITTED: 5,
  DAILY_GOAL_MET: 25,
  WEEKLY_GOAL_MET: 100,
};

// Badge definitions
gamificationSchema.statics.BADGE_DEFINITIONS = {
  FIRST_TASK: {
    id: "first_task",
    name: "First Step",
    description: "Complete your first task",
    icon: "🎯",
    category: "tasks",
  },
  TASK_MASTER_10: {
    id: "task_master_10",
    name: "Task Master",
    description: "Complete 10 tasks",
    icon: "✅",
    category: "tasks",
  },
  TASK_MASTER_50: {
    id: "task_master_50",
    name: "Task Champion",
    description: "Complete 50 tasks",
    icon: "🏅",
    category: "tasks",
  },
  TASK_MASTER_100: {
    id: "task_master_100",
    name: "Task Legend",
    description: "Complete 100 tasks",
    icon: "👑",
    category: "tasks",
  },
  STREAK_3: {
    id: "streak_3",
    name: "On Fire",
    description: "Maintain a 3-day streak",
    icon: "🔥",
    category: "streaks",
  },
  STREAK_7: {
    id: "streak_7",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "⚡",
    category: "streaks",
  },
  STREAK_30: {
    id: "streak_30",
    name: "Monthly Master",
    description: "Maintain a 30-day streak",
    icon: "💎",
    category: "streaks",
  },
  FIRST_CHALLENGE: {
    id: "first_challenge",
    name: "Challenge Accepted",
    description: "Complete your first challenge",
    icon: "🎮",
    category: "challenges",
  },
  CHALLENGE_5: {
    id: "challenge_5",
    name: "Challenge Seeker",
    description: "Complete 5 challenges",
    icon: "🎯",
    category: "challenges",
  },
  LEVEL_5: {
    id: "level_5",
    name: "Rising Star",
    description: "Reach level 5",
    icon: "⭐",
    category: "milestones",
  },
  LEVEL_10: {
    id: "level_10",
    name: "Shining Star",
    description: "Reach level 10",
    icon: "🌟",
    category: "milestones",
  },
  EARLY_BIRD: {
    id: "early_bird",
    name: "Early Bird",
    description: "Complete a task before 8 AM",
    icon: "🌅",
    category: "special",
  },
  NIGHT_OWL: {
    id: "night_owl",
    name: "Night Owl",
    description: "Complete a task after 10 PM",
    icon: "🦉",
    category: "special",
  },
};

// Check and award badges
gamificationSchema.methods.checkAndAwardBadges = function () {
  const newBadges = [];
  const BADGES = this.constructor.BADGE_DEFINITIONS;
  const earnedBadgeIds = this.badges.map((b) => b.id);

  // Task milestones
  if (this.totalTasksCompleted >= 1 && !earnedBadgeIds.includes("first_task")) {
    newBadges.push(BADGES.FIRST_TASK);
  }
  if (
    this.totalTasksCompleted >= 10 &&
    !earnedBadgeIds.includes("task_master_10")
  ) {
    newBadges.push(BADGES.TASK_MASTER_10);
  }
  if (
    this.totalTasksCompleted >= 50 &&
    !earnedBadgeIds.includes("task_master_50")
  ) {
    newBadges.push(BADGES.TASK_MASTER_50);
  }
  if (
    this.totalTasksCompleted >= 100 &&
    !earnedBadgeIds.includes("task_master_100")
  ) {
    newBadges.push(BADGES.TASK_MASTER_100);
  }

  // Streak milestones
  if (this.currentStreak >= 3 && !earnedBadgeIds.includes("streak_3")) {
    newBadges.push(BADGES.STREAK_3);
  }
  if (this.currentStreak >= 7 && !earnedBadgeIds.includes("streak_7")) {
    newBadges.push(BADGES.STREAK_7);
  }
  if (this.currentStreak >= 30 && !earnedBadgeIds.includes("streak_30")) {
    newBadges.push(BADGES.STREAK_30);
  }

  // Challenge milestones
  if (
    this.totalChallengesCompleted >= 1 &&
    !earnedBadgeIds.includes("first_challenge")
  ) {
    newBadges.push(BADGES.FIRST_CHALLENGE);
  }
  if (
    this.totalChallengesCompleted >= 5 &&
    !earnedBadgeIds.includes("challenge_5")
  ) {
    newBadges.push(BADGES.CHALLENGE_5);
  }

  // Level milestones
  if (this.level >= 5 && !earnedBadgeIds.includes("level_5")) {
    newBadges.push(BADGES.LEVEL_5);
  }
  if (this.level >= 10 && !earnedBadgeIds.includes("level_10")) {
    newBadges.push(BADGES.LEVEL_10);
  }

  // Add new badges
  for (const badge of newBadges) {
    this.badges.push({ ...badge, earnedAt: new Date() });
  }

  return newBadges;
};

// Update streak
gamificationSchema.methods.updateStreak = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!this.lastActiveDate) {
    this.currentStreak = 1;
    this.lastActiveDate = today;
    return { streakUpdated: true, newStreak: 1 };
  }

  const lastActive = new Date(this.lastActiveDate);
  lastActive.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { streakUpdated: false, newStreak: this.currentStreak };
  } else if (diffDays === 1) {
    this.currentStreak += 1;
    this.lastActiveDate = today;
    if (this.currentStreak > this.longestStreak) {
      this.longestStreak = this.currentStreak;
    }
    return { streakUpdated: true, newStreak: this.currentStreak };
  } else {
    this.currentStreak = 1;
    this.lastActiveDate = today;
    return { streakUpdated: true, newStreak: 1, streakBroken: true };
  }
};

// Add XP and check for level up
gamificationSchema.methods.addXP = function (amount) {
  const oldLevel = this.level;
  this.xp += amount;
  this.weeklyXP += amount;

  const levelInfo = this.constructor.calculateLevel(this.xp);
  this.level = levelInfo.level;

  const leveledUp = this.level > oldLevel;
  const levelsGained = this.level - oldLevel;

  return {
    xpGained: amount,
    totalXP: this.xp,
    leveledUp,
    levelsGained,
    newLevel: this.level,
    ...levelInfo,
  };
};

const Gamification = mongoose.model("Gamification", gamificationSchema);

export default Gamification;
