import mongoose from "mongoose";

const superCategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    order: { type: Number, required: true, default: 0 },
    isChoice: { type: Boolean, default: false },
});

const SuperCategory = mongoose.model("SuperCategory", superCategorySchema);

export default SuperCategory;
