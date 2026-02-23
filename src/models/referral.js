import mongoose from "mongoose";
import crypto from "crypto";

// =====================================================
// Referral Model - Track referral program
// =====================================================

const referralSchema = new mongoose.Schema(
  {
    referralCode: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
      index: true,
    },
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    referee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "used", "expired"],
      default: "active",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
    usedAt: {
      type: Date,
      default: null,
    },
    // Bonuses awarded
    referrerPoints: {
      type: Number,
      default: 0, // Will be set from config
    },
    refereePoints: {
      type: Number,
      default: 0, // Will be set from config
    },
    referrerDiscount: {
      type: Number,
      default: 0,
    },
    refereeDiscount: {
      type: Number,
      default: 0,
    },
    // Track first order of referee
    refereeFirstOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    bonusesAwarded: {
      type: Boolean,
      default: false,
    },
    bonusAwardedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Static method to generate unique referral code
referralSchema.statics.generateCode = async function () {
  let code;
  let exists = true;
  while (exists) {
    code = "SAB" + crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 7);
    exists = await this.findOne({ referralCode: code });
  }
  return code;
};

// Static method to create new referral
referralSchema.statics.createReferral = async function (
  referrerId,
  referrerPoints,
  refereePoints
) {
  const code = await this.generateCode();
  const referral = new this({
    referralCode: code,
    referrer: referrerId,
    referrerPoints,
    refereePoints,
  });
  await referral.save();
  return referral;
};

// Instance method to mark as used
referralSchema.methods.markAsUsed = async function (refereeId, firstOrderId = null) {
  if (this.status !== "active") {
    throw new Error("This referral code is no longer active");
  }
  if (new Date() > this.expiresAt) {
    this.status = "expired";
    await this.save();
    throw new Error("This referral code has expired");
  }
  this.referee = refereeId;
  this.status = "used";
  this.usedAt = new Date();
  if (firstOrderId) {
    this.refereeFirstOrderId = firstOrderId;
  }
  await this.save();
  return this;
};

// Instance method to mark bonuses as awarded
referralSchema.methods.markBonusesAwarded = async function () {
  this.bonusesAwarded = true;
  this.bonusAwardedAt = new Date();
  await this.save();
  return this;
};

// Index for finding referrals by code
referralSchema.index({ referrer: 1 });
referralSchema.index({ referee: 1 });
referralSchema.index({ status: 1 });

export default mongoose.model("Referral", referralSchema);
