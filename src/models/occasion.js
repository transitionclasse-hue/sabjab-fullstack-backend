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
    iconFilePath: { type: String }, // AdminJS metadata
    iconFilesToDelete: { type: [String] }, // AdminJS metadata
    banner: {
        type: String,
        default: "https://via.placeholder.com/400x140"
    },
    bannerFilePath: { type: String }, // AdminJS metadata
    bannerFilesToDelete: { type: [String] }, // AdminJS metadata
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    }],
    searchPlaceholders: [{ // NEW: Dynamic rotating placeholders in search bar
        type: String
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
    darkThemeColor: { // NEW: Explicit color for Dark/Midnight themes
        type: String,
        default: null
    },
    showBanner: {
        type: Boolean,
        default: true
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    isChoice: {
        type: Boolean,
        default: false
    },
    isSpecialOccasion: {
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
        enum: ["none", "light", "dark", "snow", "rain", "autumn", "heavyrain", "cinematicstorm", "rainspecialeffect"],
        default: "none"
    },
    searchBarStyle: { // NEW: Explicit search bar control
        type: String,
        enum: ["standard", "glassmorphic", "frosty", "neon", "pill", "standard_solo", "pill_solo"],
        default: "standard"
    },
    topBarStyle: { // NEW: Top bar variation
        type: String,
        enum: ["standard", "nostalgic", "weather", "scooty"],
        default: "standard"
    },
    ultraConfig: { // Deep customization for any Occasion
        topGradientColor: { type: String, default: "" },
        topGradientDarkColor: { type: String, default: "" }, // New: Dark version
        middleGradientColor: { type: String, default: "" },
        middleGradientDarkColor: { type: String, default: "" }, // New: Dark version
        bottomGradientColor: { type: String, default: "" },
        bottomGradientDarkColor: { type: String, default: "" }, // New: Dark version
        gradientStops: { type: String, default: "0,0.5,1" },
        titleFontSize: { type: Number, default: 24 },
        borderRadiusGlobal: { type: Number, default: 16 },
        hideTopBar: { type: Boolean, default: false },
        topBarColor: { type: String, default: "#ffffff" },
        topBarDarkColor: { type: String, default: "" }, // New: Top bar color in dark mode
        etaBgColor: { type: String, default: "" }, // New: Per-occasion ETA box color
        etaBgDarkColor: { type: String, default: "" }, // New: ETA box color in dark mode
        etaTextColor: { type: String, default: "" }, // New: Per-occasion ETA text color
        etaTextDarkColor: { type: String, default: "" }, // New: ETA text color in dark mode
        navActiveTextColor: { type: String, default: "" }, // New: Active occasion text color
        navActiveTextDarkColor: { type: String, default: "" }, // New: Active text color in dark mode
        navInactiveTextColor: { type: String, default: "" }, // New: Inactive occasion text color
        navInactiveTextDarkColor: { type: String, default: "" }, // New: Inactive text color in dark mode
        addressColor: { type: String, default: "" }, // New: Color for the address/location text
        addressDarkColor: { type: String, default: "" }, // New: Color for the address/location text in dark mode
        showOccasionStrip: { type: Boolean, default: true }, // NEW: Global toggle for occasion strip
    },
    components: [{ // MODULAR: Ordered list of reusable components
        type: mongoose.Schema.Types.ObjectId,
        ref: "HomeComponent"
    }]
});

const Occasion = mongoose.model("Occasion", occasionSchema);

export default Occasion;
