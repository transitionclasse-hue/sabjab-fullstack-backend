import mongoose from "mongoose";

const produceQuoteSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Farmer",
    required: true,
  },
  itemName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    enum: ["kg", "quintal", "tons", "pieces", "dozen"],
    default: "kg",
  },
  expectedPricePerUnit: {
    type: Number,
    required: true,
  },
  handoverTimeSlot: {
    type: String, // e.g. "Today 04:00 PM - 06:00 PM"
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "negotiating", "completed"],
    default: "pending",
  },
  managerNotes: {
    type: String,
    default: "",
  },
  negotiatedPricePerUnit: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

produceQuoteSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const ProduceQuote = mongoose.model("ProduceQuote", produceQuoteSchema);
