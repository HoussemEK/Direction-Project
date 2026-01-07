
import Reflection from "../models/Reflection.js";

export const getReflections = async (req, res) => {
  try {
    const { startDate, endDate, mood, limit } = req.query;
    const filter = { userId: req.userId };

    if (startDate || endDate) {
      filter.forDate = {};
      if (startDate) {
        filter.forDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.forDate.$lte = new Date(endDate);
      }
    }

    if (mood) {
      filter.mood = mood;
    }

    let query = Reflection.find(filter).sort({ forDate: -1, createdAt: -1 });

    if (limit) {
      query = query.limit(parseInt(limit, 10));
    }

    const reflections = await query;
    res.json(reflections);
  } catch (err) {
    console.error("Get reflections error:", err);
    res.status(500).json({ error: "Failed to fetch reflections" });
  }
};

export const getTodayReflection = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const reflection = await Reflection.findOne({
      userId: req.userId,
      forDate: { $gte: today, $lt: tomorrow },
    });

    if (!reflection) {
      return res.status(404).json({ error: "No reflection for today" });
    }
    res.json(reflection);
  } catch (err) {
    console.error("Get today's reflection error:", err);
    res.status(500).json({ error: "Failed to fetch today's reflection" });
  }
};

export const getReflection = async (req, res) => {
  try {
    const reflection = await Reflection.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!reflection) {
      return res.status(404).json({ error: "Reflection not found" });
    }
    res.json(reflection);
  } catch (err) {
    console.error("Get reflection error:", err);
    res.status(500).json({ error: "Failed to fetch reflection" });
  }
};

export const createReflection = async (req, res) => {
  try {
    const forDate = req.body.forDate ? new Date(req.body.forDate) : new Date();
    forDate.setHours(0, 0, 0, 0);

    const existingReflection = await Reflection.findOne({
      userId: req.userId,
      forDate: forDate,
    });

    if (existingReflection) {
      return res.status(409).json({
        error: "A reflection already exists for this date",
        existingId: existingReflection._id,
      });
    }

    const created = await Reflection.create({
      ...req.body,
      userId: req.userId,
      forDate: forDate,
    });
    res.status(201).json(created);
  } catch (err) {
    console.error("Create reflection error:", err);
    res.status(500).json({ error: "Failed to create reflection" });
  }
};

export const updateReflection = async (req, res) => {
  try {
    const reflection = await Reflection.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!reflection) {
      return res.status(404).json({ error: "Reflection not found" });
    }

    const updateData = { ...req.body };
    if (updateData.forDate) {
      const newDate = new Date(updateData.forDate);
      newDate.setHours(0, 0, 0, 0);

      const existingReflection = await Reflection.findOne({
        userId: req.userId,
        forDate: newDate,
        _id: { $ne: req.params.id },
      });

      if (existingReflection) {
        return res.status(409).json({
          error: "A reflection already exists for this date",
        });
      }
      updateData.forDate = newDate;
    }

    const updated = await Reflection.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    res.json(updated);
  } catch (err) {
    console.error("Update reflection error:", err);
    res.status(500).json({ error: "Failed to update reflection" });
  }
};

export const deleteReflection = async (req, res) => {
  try {
    const reflection = await Reflection.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!reflection) {
      return res.status(404).json({ error: "Reflection not found" });
    }

    await Reflection.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error("Delete reflection error:", err);
    res.status(500).json({ error: "Failed to delete reflection" });
  }
};
