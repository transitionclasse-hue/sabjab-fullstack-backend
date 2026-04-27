import mongoose from "mongoose";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

// ================= BASE USER =================
const userSchema = new mongoose.Schema({
  name: { type: String },
  role: {
    type: String,
    enum: ["Customer", "Admin", "DeliveryPartner", "Seller", "SubManager"],
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
  username: { type: String, unique: true, sparse: true }, // NEW: Added for flexible identity
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
  sensitiveMode: { type: Boolean, default: true },
}, { timestamps: true });

customerSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  next();
});

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
  notificationSound: { type: String, default: "default" }, // NEW: Custom sound selection
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  batteryLevel: { type: Number, default: 100 },
  walletBalance: { type: Number, default: 0 },
  cashInHand: { type: Number, default: 0 },
  codLimit: { type: Number, default: null }, // NEW: Falls back to global PricingConfig
}, { timestamps: true });

deliveryPartnerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  next();
});

// ================= ADMIN =================
const adminSchema = new mongoose.Schema({
  ...userSchema.obj,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["Admin", "SubManager"], default: "Admin" },
  pushToken: { type: String, default: null },
  notificationsEnabled: { type: Boolean, default: true },
  
  // Extra Profile Fields for Manager App
  department: { type: String },
  employeeId: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  emergencyContact: { type: String },
  joiningDate: { type: String },
  workShift: { type: String },
  managerLevel: { type: String },
  profileImage: { type: String },
}, { timestamps: true });

adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  next();
});

// ================= SELLER =================
const sellerSchema = new mongoose.Schema({
  ...userSchema.obj,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: Number },
  role: { type: String, enum: ["Seller"], default: "Seller" },
  isApproved: { type: Boolean, default: false }, // Admin must approve before they can go live
  phoneVerified: { type: Boolean, default: false },
  businessName: { type: String },
  businessAddress: { type: String },
  gstNumber: { type: String },
  bankAccount: {
    bankName: { type: String },
    accountNumber: { type: String },
    ifsc: { type: String },
  },
  walletBalance: { type: Number, default: 0 },
  pushToken: { type: String, default: null },
  notificationsEnabled: { type: Boolean, default: true },
}, { timestamps: true });

sellerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  next();
});

// ================= MODELS =================
export const Customer = mongoose.model("Customer", customerSchema);
export const DeliveryPartner = mongoose.model("DeliveryPartner", deliveryPartnerSchema);
export const Admin = mongoose.model("Admin", adminSchema);
export const Seller = mongoose.model("Seller", sellerSchema);
