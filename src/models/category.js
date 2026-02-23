import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String },
  superCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SuperCategory",
    required: true
  },
});

const Category = mongoose.model("Category", categorySchema);

export default Category;
