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
        enum: ["left", "right", "center"],
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
    searchAnimationType: { // NEW: Control how placeholders rotate
        type: String,
        enum: ["slide", "typewriter", "fade", "bullet", "static", "smart_type", "slot"],
        default: "slide"
    },
    searchAnimationSpeed: { // NEW: Duration in ms
        type: Number,
        default: 3000
    },

    topBarStyle: { // NEW: Top bar variation
        type: String,
        enum: ["standard", "nostalgic", "weather", "scooty", "glass_modern", "search_focused"],
        default: "glass_modern"
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
        borderRadiusBody: { type: Number, default: 24 }, // NEW: Top curvature for the main body
        isBodyTransparent: { type: Boolean, default: false }, // NEW: Transparency toggle
        hideTopBar: { type: Boolean, default: false },
        topBarColor: { type: String, default: "#ffffff" },
        topBarDarkColor: { type: String, default: "" }, // New: Top bar color in dark mode
        profileIcon: { type: String, default: "" },
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
        showSearchGap: { type: Boolean, default: true }, // NEW: Add spacing after the search area when topbar is visible
        hideIconBackground: { type: Boolean, default: false },
        showActiveLine: { type: Boolean, default: true }, // NEW: Toggle for Blinkit-style indicator
        activeLineColor: { type: String, default: "" }, // NEW: Custom color for indicator
        activeLineDarkColor: { type: String, default: "" }, // NEW: Dark mode color
        activeLineWidth: { type: Number, default: 32 }, // NEW: Custom width for indicator
        stripBackgroundColor: { type: String, default: "" }, // New: Color for the horizontal strip background
        stripBackgroundDarkColor: { type: String, default: "" }, 
        stripActiveColor: { type: String, default: "" }, // New: Color for the active category text/icon
        stripActiveDarkColor: { type: String, default: "" },
        stripInactiveColor: { type: String, default: "" }, // New: Color for the inactive category text/icon
        stripInactiveDarkColor: { type: String, default: "" },
        topBarBackgroundColor: { type: String, default: "" }, // New: Custom solid color for top bar
        searchSectionBackgroundColor: { type: String, default: "" }, // New: Background color for search bar area
        searchSectionBackgroundDarkColor: { type: String, default: "" }, // New: Background color for search bar area (Dark)
        searchBoxBackgroundColor: { type: String, default: "" }, // New: Color inside search input
        searchBoxBackgroundDarkColor: { type: String, default: "" }, // New: Color inside search input (Dark)
        searchBoxTextColor: { type: String, default: "" }, // New: Color for text inside search
        searchBoxTextDarkColor: { type: String, default: "" }, // New: Color for text inside search (Dark)
        searchBoxIconColor: { type: String, default: "" }, // New: Color for search icon
        searchBoxPlaceholderColor: { type: String, default: "" }, // New: Color for placeholder text
        // NEW: Migrated Appearance Settings
        primaryColor: { type: String, default: "" },
        cartBarColor: { type: String, default: "" },
        choiceCartBarColor: { type: String, default: "" },
        etaColor: { type: String, default: "" },
        footerStyle: { type: String, enum: ["standard", "floating", "minimal", "premium", "ultra"], default: "standard" },
        cartBarAnimationStyle: { type: String, enum: ["snappy", "spring_low_mass", "overshoot", "spring_legacy"], default: "snappy" },
        cartBarStyle: { type: String, enum: ["standard", "bumpy_pill"], default: "standard" },
        footerIconCount: { type: Number, enum: [3, 4, 5], default: 5 },
        footerShowHome: { type: Boolean, default: true },
        footerShowOrders: { type: Boolean, default: true },
        footerShowChoice: { type: Boolean, default: true },
        footerShowCategories: { type: Boolean, default: true },
        footerShowReOrder: { type: Boolean, default: true },
        footerShowReels: { type: Boolean, default: true },
        footerItems: {
            type: [{
                routeName: { type: String, enum: ["Home", "Orders", "Choice", "Categories", "ReOrder", "Reels"], default: "Home" },
                label: { type: String, default: "" },
                icon: { type: String, default: "" },
            }],
            default: []
        },
        checkoutStyle: { type: String, enum: ["standard", "unified"], default: "standard" },
        choiceCheckoutStyle: { type: String, enum: ["standard", "unified"], default: "standard" },
        contentBackgroundColor: { type: String, default: "" }, // NEW: Color for the rounded product area
        contentBackgroundDarkColor: { type: String, default: "" }, // NEW: Dark mode version
        showSpecialOccasion: { type: Boolean, default: true }, // NEW: Display badge next to search bar
        specialOccasionId: { type: String, default: "" }, // NEW: Link to category/layout ID
        isTopBarTransparent: { type: Boolean, default: false }, // NEW: Transparency toggle for header
        isSearchTransparent: { type: Boolean, default: false }, // NEW: Transparency toggle for search bar
        isOccasionTransparent: { type: Boolean, default: false }, // NEW: Transparency toggle for category strip
        showSearchGap: { type: Boolean, default: true }, // NEW: Add spacing after the search area
    },
    components: [{ // MODULAR: Ordered list of reusable components
        type: mongoose.Schema.Types.ObjectId,
        ref: "HomeComponent"
    }]
});

const Occasion = mongoose.model("Occasion", occasionSchema);

export default Occasion;
