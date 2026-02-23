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
      enum: ["manual_open", "manual_closed", "schedule"],
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
    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const StoreStatus = mongoose.model("StoreStatus", storeStatusSchema);

export default StoreStatus;
