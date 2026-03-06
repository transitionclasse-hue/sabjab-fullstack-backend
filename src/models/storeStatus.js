import mongoose from "mongoose";

const storeStatusSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "primary",
    },
    mode: {
      type: String,
      enum: ["manual_open", "manual_closed", "schedule", "high_demand", "rain_surge", "unavailable", "high_traffic"],
      default: "schedule",
      required: true,
    },
    openingTime: {
      type: String,
      default: "09:00",
    },
    closingTime: {
      type: String,
      default: "22:00",
    },
    alertBeforeMinutes: {
      type: Number,
      default: 30,
      min: 1,
    },
    etaBoxColor: {
      type: String,
      default: "#6366F1",
    },
    etaTextColor: { // NEW: Explicit text color
      type: String,
      default: "#ffffff",
    },
    etaBoxDarkColor: { // NEW: Box color for Dark theme
      type: String,
      default: "#4F46E5",
    },
    etaTextDarkColor: { // NEW: Text color for Dark theme
      type: String,
      default: "#ffffff",
    },
    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const StoreStatus = mongoose.model("StoreStatus", storeStatusSchema);

export default StoreStatus;
