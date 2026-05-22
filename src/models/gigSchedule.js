import mongoose from "mongoose";

const gigScheduleSchema = new mongoose.Schema(
  {
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPartner",
      required: true,
    },
    date: {
      type: String, // format YYYY-MM-DD
      required: true,
    },
    startTime: {
      type: String, // e.g. "09:00"
      required: true,
    },
    endTime: {
      type: String, // e.g. "17:00"
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "rewarded", "penalized"],
      default: "pending",
    },
    pointsChange: {
      type: Number,
      default: 0,
    },
    evaluatedAt: {
      type: Date,
    },
    evaluationNotes: {
      type: String,
    },
  },
  { timestamps: true }
);

// Allow multiple shifts per driver per day by making the index non-unique
gigScheduleSchema.index({ deliveryPartner: 1, date: 1 });

const GigSchedule = mongoose.model("GigSchedule", gigScheduleSchema);
export default GigSchedule;
