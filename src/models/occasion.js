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
    },
    themeColor: {
        type: String,
        default: "#22c55e"
    },
    showBanner: {
        type: Boolean,
        default: true
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    nameAlignment: { // New: Controls name position in UI
        type: String,
        enum: ["left", "right"],
        default: "left"
    },
    themeMode: { // New: Force Dark or Light theme for this occasion
        type: String,
        enum: ["dark", "light", "auto"],
        default: "auto"
    },
    components: [{ // ✅ MODULAR: Ordered list of reusable components
        type: mongoose.Schema.Types.ObjectId,
        ref: "HomeComponent"
    }]
});

const Occasion = mongoose.model("Occasion", occasionSchema);

export default Occasion;
