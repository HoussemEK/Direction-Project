import Task from "../models/Task.js";
import Category from "../models/Category.js";
import Gamification from "../models/Gamification.js";
import Track from "../models/Track.js";

export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId })
      .populate("categories", "name color icon")
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

export const getTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).populate("categories", "name color icon");
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(task);
  } catch (err) {
    console.error("Get task error:", err);
    res.status(500).json({ error: "Failed to fetch task" });
  }
};

export const createTask = async (req, res) => {
  try {
    const { categories, ...taskData } = req.body;

    if (categories && categories.length > 0) {
      const validCategories = await Category.find({
        _id: { $in: categories },
        userId: req.userId,
      });
      if (validCategories.length !== categories.length) {
        return res
          .status(400)
          .json({ error: "One or more invalid category IDs" });
      }
    }

    const created = await Task.create({
      ...taskData,
      categories: categories || [],
      userId: req.userId,
    });

    if (categories && categories.length > 0) {
      await Category.updateMany(
        { _id: { $in: categories }, userId: req.userId },
        { $addToSet: { tasks: created._id } }
      );
    }

    const populated = await Task.findById(created._id).populate(
      "categories",
      "name color icon"
    );
    res.status(201).json(populated);
  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({ error: "Failed to create task" });
  }
};

export const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const { categories, ...updateData } = req.body;
    const wasCompleted = task.completed;
    const isNowCompleted = updateData.completed;

    if (categories !== undefined) {
      if (categories.length > 0) {
        const validCategories = await Category.find({
          _id: { $in: categories },
          userId: req.userId,
        });
        if (validCategories.length !== categories.length) {
          return res
            .status(400)
            .json({ error: "One or more invalid category IDs" });
        }
      }

      const oldCategories = task.categories.map((c) => c.toString());
      const newCategories = categories;

      const removedCategories = oldCategories.filter(
        (c) => !newCategories.includes(c)
      );
      const addedCategories = newCategories.filter(
        (c) => !oldCategories.includes(c)
      );

      if (removedCategories.length > 0) {
        await Category.updateMany(
          { _id: { $in: removedCategories } },
          { $pull: { tasks: task._id } }
        );
      }

      if (addedCategories.length > 0) {
        await Category.updateMany(
          { _id: { $in: addedCategories } },
          { $addToSet: { tasks: task._id } }
        );
      }

      updateData.categories = categories;
    }

    const updated = await Task.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("categories", "name color icon");

    // Award XP if task was just completed
    let gamificationResult = null;
    if (!wasCompleted && isNowCompleted === true) {
      try {
        let gamification = await Gamification.findOne({ userId: req.userId });
        if (!gamification) {
          gamification = await Gamification.create({ userId: req.userId });
        }

        // Determine XP based on priority
        let xpAmount;
        switch (task.priority) {
          case "high":
            xpAmount = Gamification.XP_REWARDS.TASK_COMPLETE_HIGH_PRIORITY;
            break;
          case "low":
            xpAmount = Gamification.XP_REWARDS.TASK_COMPLETE_LOW_PRIORITY;
            break;
          default:
            xpAmount = Gamification.XP_REWARDS.TASK_COMPLETE_MEDIUM_PRIORITY;
        }

        // Update streak
        const streakResult = gamification.updateStreak();
        if (streakResult.streakUpdated && !streakResult.streakBroken) {
          xpAmount += Gamification.XP_REWARDS.DAILY_STREAK_BONUS;
        }

        // Add XP
        const xpResult = gamification.addXP(xpAmount);

        // Update task counts
        gamification.totalTasksCompleted += 1;
        gamification.weeklyTasksCompleted += 1;

        // Check for new badges
        const newBadges = gamification.checkAndAwardBadges();

        // Check for time-based badges
        const hour = new Date().getHours();
        const earnedBadgeIds = gamification.badges.map((b) => b.id);

        if (hour < 8 && !earnedBadgeIds.includes("early_bird")) {
          const earlyBird = Gamification.BADGE_DEFINITIONS.EARLY_BIRD;
          gamification.badges.push({ ...earlyBird, earnedAt: new Date() });
          newBadges.push(earlyBird);
        }

        if (hour >= 22 && !earnedBadgeIds.includes("night_owl")) {
          const nightOwl = Gamification.BADGE_DEFINITIONS.NIGHT_OWL;
          gamification.badges.push({ ...nightOwl, earnedAt: new Date() });
          newBadges.push(nightOwl);
        }

        await gamification.save();

        gamificationResult = {
          ...xpResult,
          ...streakResult,
          newBadges,
        };
      } catch (gamErr) {
        console.error("Gamification update error:", gamErr);
      }

      // Update track progress if task is linked to a track
      if (task.trackId && task.trackLevel) {
        try {
          const track = await Track.findOne({
            _id: task.trackId,
            userId: req.userId,
          });

          if (track && track.status === "active") {
            // Count completed tasks for this track level
            const completedTasksInLevel = await Task.countDocuments({
              userId: req.userId,
              trackId: task.trackId,
              trackLevel: task.trackLevel,
              completed: true,
            });

            // Mark level as complete if 3+ tasks completed
            const levelIndex = track.levels.findIndex(
              (l) => l.levelNumber === task.trackLevel
            );
            if (levelIndex !== -1 && completedTasksInLevel >= 3) {
              track.levels[levelIndex].completed = true;
              track.levels[levelIndex].completedAt = new Date();
              await track.save();
            }
          }
        } catch (trackErr) {
          console.error("Track progress update error:", trackErr);
        }
      }
    }

    res.json({ ...updated.toObject(), gamification: gamificationResult });
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).json({ error: "Failed to update task" });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (task.categories && task.categories.length > 0) {
      await Category.updateMany(
        { _id: { $in: task.categories } },
        { $pull: { tasks: task._id } }
      );
    }

    await Task.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ error: "Failed to delete task" });
  }
};
