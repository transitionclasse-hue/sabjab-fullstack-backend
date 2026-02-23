import mongoose from "mongoose";

// =====================================================
// GreenPoints Model - Track environmental rewards
// =====================================================

const greenPointTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["earn", "redeem"],
    required: true,
  },
  category: {
    type: String,
    enum: [
      "plastic_bottles",
      "organic_waste",
      "eco_packaging",
      "referral",
      "sustainable_purchase",
      "community_events",
      "discount_50",
      "discount_100",
      "free_delivery",
      "eco_products",
      "tree_planted",
    ],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: String,
  reference: String, // Order ID, Referral ID, etc.
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const greenPointsSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true,
    },
    totalBalance: {
      type: Number,
      default: 0,
    },
    lifetime: {
      type: Number,
      default: 0, // Total points ever earned
    },
    transactions: [greenPointTransactionSchema],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-update lastUpdated on save
greenPointsSchema.pre("save", function (next) {
  this.lastUpdated = new Date();
  next();
});

// Static method to get or create green points for a customer
greenPointsSchema.statics.getOrCreate = async function (customerId) {
  let record = await this.findOne({ customer: customerId });
  if (!record) {
    record = new this({ customer: customerId });
    await record.save();
  }
  return record;
};

// Instance method to earn points
greenPointsSchema.methods.earnPoints = async function (
  category,
  amount,
  description = "",
  reference = ""
) {
  this.totalBalance += amount;
  this.lifetime += amount;
  this.transactions.push({
    type: "earn",
    category,
    amount,
    description,
    reference,
  });
  await this.save();
  return this;
};

// Instance method to redeem points
greenPointsSchema.methods.redeemPoints = async function (
  category,
  amount,
  description = "",
  reference = ""
) {
  if (this.totalBalance < amount) {
    throw new Error("Insufficient green points");
  }
  this.totalBalance -= amount;
  this.transactions.push({
    type: "redeem",
    category,
    amount,
    description,
    reference,
  });
  await this.save();
  return this;
};

export default mongoose.model("GreenPoints", greenPointsSchema);
