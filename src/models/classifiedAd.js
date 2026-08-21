import mongoose from "mongoose";

const classifiedAdSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true },
    category: {
      type: String,
      enum: ["cars", "bikes", "properties", "mobiles", "books", "furniture", "jobs", "hobbies", "other"],
      required: true,
      default: "other",
    },
    subCategory: { type: String, default: "" },
    sellerType: {
      type: String,
      enum: ["individual", "shopkeeper"],
      default: "individual",
      required: true,
    },
    shopName: { type: String, default: "" },
    images: [{ type: String }],
    primaryImage: { type: String },
    video: { type: String, default: "" },
    videoThumbnail: { type: String, default: "" },
    hasVideo: { type: Boolean, default: false },
    phone: { type: String, required: true },
    location: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
    specs: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "sold", "expired", "pending"],
      default: "active",
    },
    isVerified: { type: Boolean, default: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  },
  { timestamps: true }
);

classifiedAdSchema.index({ category: 1, status: 1 });
classifiedAdSchema.index({ sellerType: 1 });
classifiedAdSchema.index({ createdAt: -1 });

export const ClassifiedAd = mongoose.model("ClassifiedAd", classifiedAdSchema);
