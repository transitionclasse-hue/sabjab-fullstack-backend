import mongoose from "mongoose";

// =====================================================
// GreenPointsConfig - Admin configurable settings
// =====================================================

const greenPointsConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "primary",
      unique: true,
    },
    // Earning rules per activity
    earnRules: {
      plasticBottles: {
        pointsPerUnit: { type: Number, default: 5 },
        description: { type: String, default: "Points per plastic bottle returned" },
        enabled: { type: Boolean, default: false },
      },
      organicWaste: {
        pointsPerUnit: { type: Number, default: 2 },
        description: { type: String, default: "Points per kg of organic waste" },
        enabled: { type: Boolean, default: false },
      },
      ecoPackaging: {
        pointsPerOrder: { type: Number, default: 3 },
        description: { type: String, default: "Points per order with eco-packaging" },
        enabled: { type: Boolean, default: false },
      },
      referral: {
        pointsPerReferral: { type: Number, default: 10 },
        bonusForReferee: { type: Number, default: 10 },
        trigger: {
          type: String,
          enum: ["signup", "first_purchase"],
          default: "signup"
        },
        awardTo: {
          type: String,
          enum: ["referrer", "referee", "both"],
          default: "both"
        },
        description: { type: String, default: "Points for successful referral" },
        enabled: { type: Boolean, default: false },
      },
      sustainablePurchase: {
        pointsPerHundred: { type: Number, default: 1 },
        description: { type: String, default: "Points per ₹100 spent on sustainable products" },
        enabled: { type: Boolean, default: false },
      },
      communityEvents: {
        pointsPerEvent: { type: Number, default: 15 },
        description: { type: String, default: "Points per community event attendance" },
        enabled: { type: Boolean, default: false },
      },
    },

    // Redemption rules per reward
    redeemRules: {
      discount50: {
        pointsRequired: { type: Number, default: 100 },
        discountAmount: { type: Number, default: 50 },
        description: { type: String, default: "₹50 Discount" },
        enabled: { type: Boolean, default: true },
      },
      discount100: {
        pointsRequired: { type: Number, default: 200 },
        discountAmount: { type: Number, default: 100 },
        description: { type: String, default: "₹100 Discount" },
        enabled: { type: Boolean, default: true },
      },
      freeDelivery: {
        pointsRequired: { type: Number, default: 75 },
        description: { type: String, default: "Free delivery on next order" },
        enabled: { type: Boolean, default: true },
      },
      ecoProductBundle: {
        pointsRequired: { type: Number, default: 150 },
        bundleValue: { type: Number, default: 500 },
        description: { type: String, default: "Exclusive eco-friendly products" },
        enabled: { type: Boolean, default: false },
      },
      treePlanted: {
        pointsRequired: { type: Number, default: 50 },
        description: { type: String, default: "Plant 1 tree on customer's behalf" },
        enabled: { type: Boolean, default: false },
      },
    },

    // System settings
    settings: {
      maxPointsPerOrder: { type: Number, default: 1000 },
      pointsExpiryDays: { type: Number, default: 365 }, // 0 = never expires
      minPointsToRedeem: { type: Number, default: 50 },
      enableLeaderboard: { type: Boolean, default: true },
      enableNotifications: { type: Boolean, default: true },
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Static method to get or create default config
greenPointsConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne({ key: "primary" });
  if (!config) {
    config = new this({ key: "primary" });
    await config.save();
  }
  return config;
};

export default mongoose.model("GreenPointsConfig", greenPointsConfigSchema);
