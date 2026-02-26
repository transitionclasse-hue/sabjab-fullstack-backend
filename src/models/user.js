import mongoose from "mongoose";

// ================= BASE USER =================
const userSchema = new mongoose.Schema({
  name: { type: String },
  role: {
    type: String,
    enum: ["Customer", "Admin", "DeliveryPartner"],
    required: true,
  },
  isActivated: { type: Boolean, default: false },
});

// ================= CUSTOMER =================
const customerSchema = new mongoose.Schema({
  ...userSchema.obj,
  phone: { type: Number, required: true, unique: true },
  // Added email with sparse:true to allow multiple nulls but unique values
  email: { type: String, unique: true, sparse: true },
  // Temporary storage for Email OTP fallback
  otp: { type: String },
  otpExpires: { type: Date },
  password: { type: String }, // NEW: Added for password auth
  role: { type: String, enum: ["Customer"], default: "Customer" },
  liveLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  address: { type: String },
  wishlist: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    }
  ],
  dateOfBirth: { type: Date },
  walletBalance: { type: Number, default: 0 },
  // Green Points System
  greenPointsBalance: { type: Number, default: 0 },
  // Referral System
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    default: null,
  },
  referralBonus: { type: Number, default: 0 },
  pushToken: { type: String, default: null },
  notificationsEnabled: { type: Boolean, default: true },
  bookmarkedRecipes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
    }
  ],
}, { timestamps: true });

// ================= DELIVERY PARTNER =================
const deliveryPartnerSchema = new mongoose.Schema({
  ...userSchema.obj,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: Number, required: true },
  role: {
    type: String,
    enum: ["DeliveryPartner"],
    default: "DeliveryPartner",
  },
  liveLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  address: { type: String },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
  },
  bankAccount: {
    bankName: { type: String },
    accountLast4: { type: String },
    ifsc: { type: String },
  },
  pushToken: { type: String, default: null },
  notificationsEnabled: { type: Boolean, default: true },
}, { timestamps: true });

// ================= ADMIN =================
const adminSchema = new mongoose.Schema({
  ...userSchema.obj,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["Admin"], default: "Admin" },
}, { timestamps: true });

// ================= MODELS =================
export const Customer = mongoose.model("Customer", customerSchema);
export const DeliveryPartner = mongoose.model("DeliveryPartner", deliveryPartnerSchema);
export const Admin = mongoose.model("Admin", adminSchema);
