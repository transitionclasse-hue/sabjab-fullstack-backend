import mongoose from "mongoose";

const slotPromotionSchema = new mongoose.Schema({
  referenceAddress: { type: String },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  slotLabel: { type: String, required: true }, // e.g. "09:00 AM - 11:00 AM"
  dayLabel: { type: String }, // e.g. "Tomorrow", "Saturday" or null for recurring
  promotionType: { type: String, enum: ["discount", "gift"], required: true },
  discountAmount: { type: Number, default: 0 },
  giftName: { type: String, default: "" },
  radiusMeters: { type: Number, default: 50 },
  expiresAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

slotPromotionSchema.index({ location: "2dsphere" });

export const SlotPromotion = mongoose.model("SlotPromotion", slotPromotionSchema);
