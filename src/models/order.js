import mongoose from "mongoose";
import Counter from "./counter.js";

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
  },

  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },

  deliveryPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DeliveryPartner",
  },

  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: true,
  },

  items: [
    {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      count: { type: Number, required: true },
      variation: {
        name: { type: String },
        price: { type: Number },
        discountPrice: { type: Number },
      },
      returnWindow: { type: Number, default: 0 },
      returnExpiresAt: { type: Date },
      returnStatus: {
        type: String,
        enum: ["none", "requested", "approved", "rejected", "completed"],
        default: "none",
      },
      returnReason: { type: String },
      deliveryStatus: {
        type: String,
        enum: ["pending", "shipped", "delivered"],
        default: "pending",
      },
      expectedDate: { type: Date },
      referredByReel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reel",
        default: null,
      },
      referrer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        default: null,
      },
    },
  ],

  orderType: {
    type: String,
    enum: ["quick", "choice"],
    default: "quick",
  },

  deliveryMode: {
    type: String,
    enum: ["speed", "slot"],
    default: "speed",
  },

  deliverySlot: {
    type: String,
    default: null,
  },

  deliveryLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String },
  },

  customerInfo: {
    name: { type: String },
    phone: { type: String },
  },

  pickupLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String },
  },

  deliveryPersonLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String },
  },

  status: {
    type: String,
    enum: ["available", "warehouse_processing", "dispatched", "in_transit", "reached_at_branch", "assigned", "confirmed", "arriving", "at_location", "delivered", "cancelled"],
    default: "available",
  },

  assignedAt: { type: Date },
  pickedUpAt: { type: Date },
  deliveredAt: { type: Date },
  deliveryTimeMinutes: { type: Number }, // Calculated duration from assignment/pickup to delivery
  returnWindow: { type: Number, default: 0 },
  returnExpiresAt: { type: Date },
  returnStatus: {
    type: String,
    enum: ["none", "requested", "approved", "rejected", "completed"],
    default: "none",
  },
  returnReason: { type: String },

  totalPrice: { type: Number, required: true },
  couponCode: { type: String, uppercase: true, trim: true },
  discountAmount: { type: Number, default: 0 },
  paymentMethod: {
    type: String,
    enum: ["COD", "Wallet", "Online", "Direct_UPI"],
    default: "COD",
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Refunded", "Pending Verification"],
    default: "Pending",
  },

  razorpay_payment_id: {
    type: String,
  },
  razorpay_order_id: {
    type: String,
  },
  razorpay_signature: {
    type: String,
  },
  razorpay_qr_id: {
    type: String,
  },
  razorpay_upi_string: {
    type: String,
  },

  driverEarning: { type: Number, default: 0 },
  codCollected: { type: Number, default: 0 },
  rewardCoinsEarned: { type: Number, default: 0 }, // Amount of SabJab Coins earned from this order

  deliveryOtp: { type: String },
  isHighValueOrder: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

/* ===========================
   AUTO INCREMENT ORDER ID
=========================== */

async function getNextSequenceValue(sequenceName) {
  const sequenceDocument = await Counter.findOneAndUpdate(
    { name: sequenceName },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );

  return sequenceDocument.sequence_value;
}

orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const sequenceValue = await getNextSequenceValue("orderId");
    this.orderId = `ORDR${sequenceValue.toString().padStart(5, "0")}`;
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
