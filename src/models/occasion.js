import mongoose from "mongoose";

const occasionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    icon: {
        type: String,
        default: "https://via.placeholder.com/60"
    },
    banner: {
        type: String,
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
    themeEffect: { // UNIFIED: Replaces old themeMode + weatherEffect
        type: String,
        enum: ["none", "light", "dark", "snow", "rain", "autumn", "heavyrain", "cinematicstorm"],
        default: "none"
    },
    searchBarStyle: { // NEW: Explicit search bar control
        type: String,
        enum: ["standard", "glassmorphic", "frosty", "neon"],
        default: "standard"
    },
    topBarStyle: { // NEW: Top bar variation
        type: String,
        enum: ["standard", "nostalgic", "weather"],
        default: "standard"
    },
    ultraConfig: { // Deep customization for any Occasion
        topGradientColor: { type: String, default: "" },
        middleGradientColor: { type: String, default: "" },
        bottomGradientColor: { type: String, default: "" },
        gradientStops: { type: String, default: "0,0.5,1" },
        titleFontSize: { type: Number, default: 24 },
        borderRadiusGlobal: { type: Number, default: 16 },
        hideTopBar: { type: Boolean, default: false },
        topBarColor: { type: String, default: "#ffffff" }
    },
    components: [{ // MODULAR: Ordered list of reusable components
        type: mongoose.Schema.Types.ObjectId,
        ref: "HomeComponent"
    }]
});

const Occasion = mongoose.model("Occasion", occasionSchema);

export default Occasion;
