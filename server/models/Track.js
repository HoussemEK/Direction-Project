import mongoose from "mongoose";

const levelSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    focusGoal: String,
    levelNumber: Number,
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { _id: false }
);

const trackSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    name: { type: String, default: "Focus" },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
    },
    currentLevel: Number,
    targetLevel: { type: Number, default: 5 },
    levels: [levelSchema],
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Track", trackSchema);
