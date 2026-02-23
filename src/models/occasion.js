import mongoose from "mongoose";

const occasionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    icon: {
        type: String,
        required: true,
        default: "https://via.placeholder.com/60"
    },
    banner: {
        type: String,
        required: true,
        default: "https://via.placeholder.com/400x140"
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 1
    }
});

const Occasion = mongoose.model("Occasion", occasionSchema);

export default Occasion;
