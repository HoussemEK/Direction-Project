import Challenge from "../models/Challenge.js";
import Gamification from "../models/Gamification.js";

function getCelebrationMessage(difficulty) {
  const messages = {
    easy: ["Nice work! 🎉", "Good job! ✨", "Well done! 👏"],
    medium: ["Impressive! 🌟", "You're on fire! 🔥", "Fantastic effort! 💪"],
    hard: ["AMAZING! 🏆", "You're a champion! 👑", "Legendary performance! ⚡"],
  };
  const diffMessages = messages[difficulty] || messages.medium;
  return diffMessages[Math.floor(Math.random() * diffMessages.length)];
}

export const getMeta = (req, res) => {
  res.json({
    categories: Challenge.CATEGORIES,
    xpRewards: Challenge.XP_REWARDS,
    timedDurations: Challenge.TIMED_DURATIONS,
  });
};

export const getChallenges = async (req, res) => {
  try {
    const { status, weekOf } = req.query;
    const filter = { userId: req.userId };

    if (status) {
      filter.status = status;
    }

    if (weekOf) {
      const startOfWeek = new Date(weekOf);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      filter.weekOf = { $gte: startOfWeek, $lt: endOfWeek };
    }

    const challenges = await Challenge.find(filter).sort({ createdAt: -1 });
    res.json(challenges);
  } catch (err) {
    console.error("Get challenges error:", err);
    res.status(500).json({ error: "Failed to fetch challenges" });
  }
};

export const getActiveChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findOne({
      userId: req.userId,
      status: { $in: ["active", "accepted", "pending"] },
    }).sort({ createdAt: -1 });

    if (!challenge) {
      return res.status(404).json({ error: "No active challenge found" });
    }
    res.json(challenge);
  } catch (err) {
    console.error("Get active challenge error:", err);
    res.status(500).json({ error: "Failed to fetch active challenge" });
  }
};

export const getChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }
    res.json(challenge);
  } catch (err) {
    console.error("Get challenge error:", err);
    res.status(500).json({ error: "Failed to fetch challenge" });
  }
};

export const createChallenge = async (req, res) => {
  try {
    const challengeData = {
      ...req.body,
      userId: req.userId,
      weekOf: req.body.weekOf || new Date(),
    };

    // If timed challenge is created as active, set startedAt immediately
    if (req.body.isTimed && req.body.status === "active") {
      challengeData.startedAt = new Date();
    }

    const created = await Challenge.create(challengeData);
    res.status(201).json(created);
  } catch (err) {
    console.error("Create challenge error:", err);
    res.status(500).json({ error: "Failed to create challenge" });
  }
};

export const updateChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    const updated = await Challenge.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json(updated);
  } catch (err) {
    console.error("Update challenge error:", err);
    res.status(500).json({ error: "Failed to update challenge" });
  }
};

export const completeChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    if (challenge.status === "completed") {
      return res.status(400).json({ error: "Challenge already completed" });
    }

    // Check if timed challenge expired
    if (challenge.isTimed && challenge.isExpired()) {
      challenge.status = "expired";
      await challenge.save();
      return res
        .status(400)
        .json({ error: "Challenge has expired", challenge });
    }

    challenge.status = "completed";
    challenge.completedAt = new Date();

    // Calculate and award XP
    const xpAmount = challenge.calculateXP();
    challenge.xpAwarded = xpAmount;

    let gamificationResult = null;
    try {
      let gamification = await Gamification.findOne({ userId: req.userId });
      if (!gamification) {
        gamification = await Gamification.create({ userId: req.userId });
      }

      const xpResult = gamification.addXP(xpAmount);
      gamification.totalChallengesCompleted += 1;

      const newBadges = gamification.checkAndAwardBadges();
      await gamification.save();

      gamificationResult = {
        ...xpResult,
        newBadges,
        totalChallengesCompleted: gamification.totalChallengesCompleted,
      };
    } catch (gamErr) {
      console.error("Gamification update error:", gamErr);
    }

    await challenge.save();

    res.json({
      challenge,
      gamification: gamificationResult,
      celebration: {
        type: challenge.difficulty,
        xpAwarded: xpAmount,
        message: getCelebrationMessage(challenge.difficulty),
      },
    });
  } catch (err) {
    console.error("Complete challenge error:", err);
    res.status(500).json({ error: "Failed to complete challenge" });
  }
};

export const startChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    if (!challenge.isTimed) {
      return res.status(400).json({ error: "This is not a timed challenge" });
    }

    if (challenge.startedAt) {
      return res.status(400).json({ error: "Challenge already started" });
    }

    challenge.startedAt = new Date();
    challenge.status = "accepted";
    await challenge.save();

    res.json({
      ...challenge.toObject(),
      remainingTime: challenge.getRemainingTime(),
    });
  } catch (err) {
    console.error("Start challenge error:", err);
    res.status(500).json({ error: "Failed to start challenge" });
  }
};

export const skipChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    challenge.status = "skipped";
    await challenge.save();
    res.json(challenge);
  } catch (err) {
    console.error("Skip challenge error:", err);
    res.status(500).json({ error: "Failed to skip challenge" });
  }
};

export const deleteChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    await Challenge.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error("Delete challenge error:", err);
    res.status(500).json({ error: "Failed to delete challenge" });
  }
};
