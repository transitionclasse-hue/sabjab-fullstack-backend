import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  image: { type: String }, // Primary Image
  imageFilePath: { type: String }, // AdminJS metadata
  imageFilesToDelete: { type: [String] }, // AdminJS metadata
  images: [{ type: String }], // Additional Images (Gallery)
  imagesFilePath: { type: [String] }, // AdminJS metadata
  imagesFilesToDelete: { type: [String] }, // AdminJS metadata

  video: { type: String }, // Product Video
  videoThumbnail: { type: String }, // NEW: Thumbnail for product video
  price: { type: Number, required: true },
  discountPrice: { type: Number },
  costPrice: { type: Number }, // Private Purchase/Cost Price
  quantity: { type: String, required: true },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubCategory",
  },
  superCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SuperCategory",
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  stock: {
    type: Number,
  },
  variations: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      discountPrice: { type: Number },
      stock: { type: Number, default: 0 },
      image: { type: String },
      isAvailable: { type: Boolean, default: true },
    },
  ],
  isSensitive: { type: Boolean, default: false },
  isChoice: { type: Boolean, default: false },
  userStockLimit: { type: Number, default: null },

  // Seller System Fields
  isApproved: { type: Boolean, default: true }, // Defaults to true for Admin created products. Sellers will explicitly create with false
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Seller",
    default: null
  }
});

// Pre-save hook to convert category string to ObjectId
productSchema.pre('save', function (next) {
  if (this.category && typeof this.category === 'string') {
    try {
      this.category = new mongoose.Types.ObjectId(this.category);
    } catch (error) {
      return next(new Error('Invalid category ID format'));
    }
  }
  if (this.subCategory && typeof this.subCategory === 'string') {
    try {
      this.subCategory = new mongoose.Types.ObjectId(this.subCategory);
    } catch (error) {
      return next(new Error('Invalid subCategory ID format'));
    }
  }
  if (this.superCategory && typeof this.superCategory === 'string') {
    try {
      this.superCategory = new mongoose.Types.ObjectId(this.superCategory);
    } catch (error) {
      return next(new Error('Invalid superCategory ID format'));
    }
  }

  // Calculate total stock from variations if they exist
  if (this.variations && this.variations.length > 0) {
    this.stock = this.variations.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  }

  next();
});

// Pre-update hook for findOneAndUpdate
productSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
  const update = this.getUpdate();
  if (update.category && typeof update.category === 'string') {
    try {
      update.category = new mongoose.Types.ObjectId(update.category);
    } catch (error) {
      return next(new Error('Invalid category ID format'));
    }
  }
  if (update.subCategory && typeof update.subCategory === 'string') {
    try {
      update.subCategory = new mongoose.Types.ObjectId(update.subCategory);
    } catch (error) {
      return next(new Error('Invalid subCategory ID format'));
    }
  }
  if (update.superCategory && typeof update.superCategory === 'string') {
    try {
      update.superCategory = new mongoose.Types.ObjectId(update.superCategory);
    } catch (error) {
      return next(new Error('Invalid superCategory ID format'));
    }
  }

  // Calculate total stock from variations if they are being updated
  if (update.variations && Array.isArray(update.variations) && update.variations.length > 0) {
    update.stock = update.variations.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  }

  next();
});

const Product = mongoose.model("Product", productSchema);

export default Product;
