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

payoutSchema.pre("save", function (next) {
  this._wasCompleted = this.isNew
    ? this.status === "completed"
    : this.isModified("status") && this.status === "completed";
  next();
});

payoutSchema.post("save", async function (doc) {
  if (doc._wasCompleted) {
    try {
      const { sendPushNotification } = await import("../utils/notification.js");
      await sendPushNotification(
        String(doc.deliveryPartner),
        "Payment Disbursed! 💰",
        `A payout of ₹${doc.amount} has been processed to your bank account.`,
        { payoutId: String(doc._id), type: "PAYOUT_PROCESSED" },
        "DeliveryPartner"
      );
    } catch (e) {
      console.error("Payout push notification failed:", e);
    }
  }
});

const Payout = mongoose.model("Payout", payoutSchema);
export default Payout;
