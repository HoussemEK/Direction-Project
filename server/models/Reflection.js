import mongoose from "mongoose";

const reflectionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    text: String,
    mood: String,
    forDate: { type: Date, index: true },
  },
  { timestamps: true }
);

export default mongoose.model("Reflection", reflectionSchema);
