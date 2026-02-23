import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema(
  {
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPartner",
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    txnId: { type: String },
    completedAt: { type: Date },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

payoutSchema.index({ deliveryPartner: 1, status: 1 });
payoutSchema.index({ deliveryPartner: 1, createdAt: -1 });

const Payout = mongoose.model("Payout", payoutSchema);
export default Payout;
