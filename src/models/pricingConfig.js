import mongoose from "mongoose";

const customFeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    isEnabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const slotSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    isEnabled: { type: Boolean, default: true },
  },
  { _id: true }
);

const incentiveSlotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    isEnabled: { type: Boolean, default: true },
  },
  { _id: true }
);

const pricingConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "primary" },
    freeDeliveryEnabled: { type: Boolean, default: true },
    freeDeliveryThreshold: { type: Number, default: 199, min: 0 },
    baseDeliveryFee: { type: Number, default: 20, min: 0 },
    speedDeliveryEnabled: { type: Boolean, default: true },

    // Choice Delivery Config
    choiceDeliveryFee: { type: Number, default: 40, min: 0 },
    choiceFreeDeliveryEnabled: { type: Boolean, default: true },
    choiceFreeDeliveryThreshold: { type: Number, default: 499, min: 0 },

    promiseProtectEnabled: { type: Boolean, default: false },
    promiseProtectFee: { type: Number, default: 0, min: 0 },

    deliveryBagEnabled: { type: Boolean, default: false },
    deliveryBagFee: { type: Number, default: 0, min: 0 },

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
    defaultDriverCodLimit: { type: Number, default: 2000, min: 0 }, // NEW: Fallback COD limit

    // Driver pay: flat or distance-based (store → customer)
    driverEarningMode: { type: String, enum: ["flat", "distance"], default: "flat" },
    driverRateAmount: { type: Number, default: 0, min: 0 },
    driverRateUnit: { type: String, enum: ["km", "100m"], default: "km" },
    driverBaseEarning: { type: Number, default: 0, min: 0 },
    driverMinEarning: { type: Number, default: 0, min: 0 },
    driverMaxEarning: { type: Number, default: 0, min: 0 },
    driverIncentiveEnabled: { type: Boolean, default: false },
    driverIncentiveAmount: { type: Number, default: 0, min: 0 },
    driverIncentiveSlots: { type: [incentiveSlotSchema], default: [] },

    // Reward Rules (SabJab Coins)
    rewardCoinsEnabled: { type: Boolean, default: true },
    rewardCoinsPercentage: { type: Number, default: 1, min: 0, max: 100 }, // X% of purchase
    minAmountForCoins: { type: Number, default: 1, min: 0 }, // Minimum order value to earn coins

    customFees: { type: [customFeeSchema], default: [] },
    cartBarColor: { type: String, default: "#1A1A1A" },
    choiceCartBarColor: { type: String, default: "#6D28D9" },
    etaColor: { type: String, default: "#1A1A1A" },
    footerStyle: { type: String, enum: ['standard', 'floating', 'minimal', 'premium', 'ultra'], default: 'standard' },
    cartBarAnimationStyle: { type: String, enum: ["snappy", "spring_low_mass", "overshoot", "spring_legacy"], default: "snappy" },
    cartBarStyle: { type: String, enum: ["standard", "bumpy_pill"], default: "standard" },
    checkoutStyle: { type: String, enum: ['standard', 'unified'], default: 'standard' },
    choiceCheckoutStyle: { type: String, enum: ['standard', 'unified'], default: 'standard' },
    primaryColor: { type: String, default: '#4CAF50' },
    deliverySlots: {
      type: [slotSchema],
      default: [
        { label: "09:00 AM - 11:00 AM", isEnabled: true },
        { label: "11:00 AM - 01:00 PM", isEnabled: true },
        { label: "01:00 PM - 03:00 PM", isEnabled: true },
        { label: "03:00 PM - 05:00 PM", isEnabled: true },
        { label: "05:00 PM - 07:00 PM", isEnabled: true },
        { label: "07:00 PM - 09:00 PM", isEnabled: true },
      ],
    },
    // Payment Collection Config
    companyUpiId: { type: String, default: "" },
    companyName: { type: String, default: "SabJab" },
    hideRazorpayTopbar: { type: Boolean, default: false },
    qrCodeAmountPrefill: { type: Boolean, default: true },
    driverQrMode: { type: String, enum: ["direct_upi", "razorpay"], default: "direct_upi" },
    gstDetailsEnabled: { type: Boolean, default: false },
    giftPackagingFee: { type: Number, default: 30, min: 0 },
    themeWaveEffectEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const PricingConfig = mongoose.model("PricingConfig", pricingConfigSchema);

export default PricingConfig;
