import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  price: { type: Number, required: true },
  discountPrice: { type: Number },
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
  stock: {
    type: Number,
    default: 0,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
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
  next();
});

const Product = mongoose.model("Product", productSchema);

export default Product;
