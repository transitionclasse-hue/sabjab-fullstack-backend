import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: false, // Optional for AdminJS upload flow
    },
    imageFilePath: { type: String }, // AdminJS metadata
    imageFilesToDelete: { type: [String] }, // AdminJS metadata
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    isChoice: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
});

const SubCategory = mongoose.model("SubCategory", subCategorySchema);
export default SubCategory;
