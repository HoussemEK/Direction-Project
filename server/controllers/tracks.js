import Track from "../models/Track.js";

export const getTracks = async (req, res) => {
  try {
    const tracks = await Track.find({ userId: req.userId }).sort({
      updatedAt: -1,
    });
    res.json(tracks);
  } catch (err) {
    console.error("Get tracks error:", err);
    res.status(500).json({ error: "Failed to fetch tracks" });
  }
};

export const getTrack = async (req, res) => {
  try {
    const track = await Track.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!track) {
      return res.status(404).json({ error: "Track not found" });
    }
    res.json(track);
  } catch (err) {
    console.error("Get track error:", err);
    res.status(500).json({ error: "Failed to fetch track" });
  }
};

export const createTrack = async (req, res) => {
  try {
    const created = await Track.create({
      ...req.body,
      userId: req.userId,
    });
    res.status(201).json(created);
  } catch (err) {
    console.error("Create track error:", err);
    res.status(500).json({ error: "Failed to create track" });
  }
};

export const updateTrack = async (req, res) => {
  try {
    const track = await Track.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!track) {
      return res.status(404).json({ error: "Track not found" });
    }

    const updated = await Track.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json(updated);
  } catch (err) {
    console.error("Update track error:", err);
    res.status(500).json({ error: "Failed to update track" });
  }
};

export const completeTrack = async (req, res) => {
  try {
    const track = await Track.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!track) {
      return res.status(404).json({ error: "Track not found" });
    }

    if (track.status === "completed") {
      return res.status(400).json({ error: "Track already completed" });
    }

    track.status = "completed";
    track.completedAt = new Date();
    await track.save();

    res.json(track);
  } catch (err) {
    console.error("Complete track error:", err);
    res.status(500).json({ error: "Failed to complete track" });
  }
};

export const deleteTrack = async (req, res) => {
  try {
    const track = await Track.findOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!track) {
      return res.status(404).json({ error: "Track not found" });
    }

    await Track.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error("Delete track error:", err);
    res.status(500).json({ error: "Failed to delete track" });
  }
};
