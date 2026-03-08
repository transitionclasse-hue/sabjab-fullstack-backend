import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String },
  imageFilePath: { type: String }, // AdminJS metadata
  imageFilesToDelete: { type: [String] }, // AdminJS metadata
  superCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SuperCategory",
    required: true
  },
  isSensitive: { type: Boolean, default: false },
  isChoice: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  canEarnCoins: { type: Boolean, default: true }, // Whether products in this category earn SabJab Coins
});

const Category = mongoose.model("Category", categorySchema);

export default Category;
