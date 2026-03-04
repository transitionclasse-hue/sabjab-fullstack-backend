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
    themeMode: { // New: Force Dark or Light theme for this occasion
        type: String,
        enum: ["dark", "light", "auto"],
        default: "auto"
    },
    homeScreenVersion: { // ✅ NEW: Phase 7 Dynamic Routing Control
        type: String,
        enum: ["HomeScreen", "HomeScreen2", "HomeScreen3", "HomeScreen4", "HomeScreen5", "HomeScreen6", "HomeScreen7", "HomeScreen8", "HomeScreen9", "HomeScreen10"],
        default: "HomeScreen"
    },
    ultraConfig: { // ✅ NEW: Deep customization specifically for HomeScreen10
        topGradientColor: { type: String, default: "" },
        bottomGradientColor: { type: String, default: "" },
        middleGradientColor: { type: String, default: "" },
        gradientStops: { type: String, default: "0,0.5,1" },
        titleFontSize: { type: Number, default: 24 },
        borderRadiusGlobal: { type: Number, default: 16 },
        hideTopBar: { type: Boolean, default: false },
        topBarColor: { type: String, default: "#ffffff" }
    },
    weatherEffect: { // ✅ Controls weather effect on HomeScreen7 topbar
        type: String,
        enum: ["none", "rain", "snow", "autumn", "rainspecialeffect"],
        default: "none"
    },
    components: [{ // ✅ MODULAR: Ordered list of reusable components
        type: mongoose.Schema.Types.ObjectId,
        ref: "HomeComponent"
    }]
});

const Occasion = mongoose.model("Occasion", occasionSchema);

export default Occasion;
