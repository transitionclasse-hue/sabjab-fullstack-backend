import mongoose from "mongoose";

const customFeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    isEnabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const pricingConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "primary" },
    freeDeliveryEnabled: { type: Boolean, default: true },
    freeDeliveryThreshold: { type: Number, default: 199, min: 0 },
    baseDeliveryFee: { type: Number, default: 20, min: 0 },

    promiseProtectEnabled: { type: Boolean, default: false },
    promiseProtectFee: { type: Number, default: 0, min: 0 },

    smallCartFeeEnabled: { type: Boolean, default: false },
    smallCartThreshold: { type: Number, default: 99, min: 0 },
    smallCartFee: { type: Number, default: 0, min: 0 },

    rainSurgeEnabled: { type: Boolean, default: false },
    rainSurgeFee: { type: Number, default: 0, min: 0 },

    lateNightFeeEnabled: { type: Boolean, default: false },
    lateNightStartTime: { type: String, default: "23:00" },
    lateNightEndTime: { type: String, default: "05:00" },
    lateNightFee: { type: Number, default: 0, min: 0 },
    defaultDriverEarning: { type: Number, default: 30, min: 0 },

    customFees: { type: [customFeeSchema], default: [] },
  },
  { timestamps: true }
);

const PricingConfig = mongoose.model("PricingConfig", pricingConfigSchema);

export default PricingConfig;
