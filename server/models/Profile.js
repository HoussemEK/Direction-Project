import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      maxlength: 500,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    dateFormat: {
      type: String,
      enum: ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"],
      default: "YYYY-MM-DD",
    },
    weekStartsOn: {
      type: String,
      enum: ["sunday", "monday"],
      default: "monday",
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: false },
      dailyReminder: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: true },
    },
    productivity: {
      dailyGoal: { type: Number, default: 5, min: 1, max: 20 },
      focusSessionMinutes: { type: Number, default: 25, min: 5, max: 120 },
      breakMinutes: { type: Number, default: 5, min: 1, max: 30 },
    },
  },
  { timestamps: true }
);



const Profile = mongoose.model("Profile", profileSchema);

export default Profile;
