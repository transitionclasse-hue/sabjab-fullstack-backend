import mongoose from "mongoose";

const homeComponentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: [
            "CATEGORY_STRIP",
            "CATEGORY_CLUSTERS",
            "FEATURED_DEALS",
            "PRODUCT_SCROLLER",
            "PRODUCT_GRID",
            "PROMO_BANNER",
            "IMAGE_CAROUSEL",
            "BENTO_GRID",    // ✅ NEW: 1 Large + 2 Small
            "STORY_STRIP",   // ✅ NEW: Circular entries
            "GRADIENT_HERO", // ✅ NEW: High-impact section
            "RAMZAN_SPECIAL", // ✅ NEW: Festive special layout
            "RAMZAN_SPECIAL2", // ✅ NEW: Animated spiritual layout
            "HAPPY_HOLI",      // ✅ NEW: Vibrant Holi layout
            "DIWALI_SPECIAL",   // ✅ NEW: Sparking Diwali layout
            "CHRISTMAS_SPECIAL", // ✅ NEW: Snowy Christmas layout
            "TRIPLE_SECTION_GRID", // ✅ NEW: Side-by-side collections
            "CATEGORY_GRID_FOUR_IMAGES", // ✅ NEW: Grid of categories showing 4 product images each
            "PRODUCT_GRID_3X2", // ✅ NEW: 3 columns, 2 rows of products
            "MINI_VIDEO", // ✅ NEW: Floating mini video promotion
            "AISLE_2X2_GRID", // ✅ NEW: 2by2 style from design
            "PROMOTION_PAGINATION", // ✅ NEW: 4 pagination promo style
            "GROCERY_LIST_2X3", // ✅ NEW: 2by3 category list style
            "TIME_BASED_SCROLLER", // ✅ NEW: Changes based on time of day
            "REORDER_SCROLLER" // ✅ NEW: Dynamic order history scroller
        ],
        required: true,
    },
    subTitle: { // NEW: For descriptive headers
        type: String,
    },
    buttonText: { // NEW: For CTA buttons
        type: String,
    },
    videoUrl: { // NEW: URL for video (MINI_VIDEO)
        type: String,
    },
    videoFilePath: { type: String }, // AdminJS metadata
    videoFilesToDelete: { type: [String] }, // AdminJS metadata
    videoThumbnail: { // NEW: Optional thumbnail for video
        type: String,
    },
    // Used explicitly for "FEATURED_DEALS" section type
    bigDeal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    },
    miniDeals: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
        }
    ],
    products: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
        }
    ],
    categories: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SubCategory",
        }
    ],
    timeSlots: [ // ✅ NEW: For Time-Based Product Scroller
        {
            startTime: String, // HH:mm format
            endTime: String,   // HH:mm format
            title: String,
            products: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                }
            ],
            categoryId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "SubCategory",
            }
        }
    ],
    bannerImage: {
        type: String,
    },
    bannerFilePath: { type: String }, // AdminJS metadata
    bannerFilesToDelete: { type: [String] }, // AdminJS metadata
    carouselImages: [
        {
            type: String,
        }
    ],
    themeColor: {
        type: String,
        default: null,
    },
    darkThemeColor: { // NEW: Explicit color for Dark/Midnight themes
        type: String,
        default: null,
    },
    themeMode: { // ✅ NEW: Per-component theme variations
        type: String,
        enum: ["light", "dark", "glass"],
        default: "glass",
    },
    weatherEffect: { // ✅ NEW: Per-component weather overlay (snow, rain, autumn, etc.)
        type: String,
        enum: ["none", "snow", "rain", "heavyrain", "rainspecialeffect", "cinematicstorm", "autumn"],
        default: "none",
    },
    backgroundColor: { // NEW: Custom background for the whole component section
        type: String,
        default: null,
    },
    darkBackgroundColor: { // NEW: Custom background for dark mode
        type: String,
        default: null,
    },
    sections: [
        {
            title: String,
            subtitle: String,
            color: String,
            products: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                }
            ],
            categoryId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Category",
            }
        }
    ],
    isActive: {
        type: Boolean,
        default: true,
    },
    // Ultra Styling
    borderRadius: {
        type: Number,
        default: null,
    },
    spacingTop: {
        type: Number,
        default: null,
    },
    spacingBottom: {
        type: Number,
        default: null,
    },
    isFullWidth: {
        type: Boolean,
        default: true,
    },
    titleFont: {
        type: String,
        default: null,
    },
    titleColor: {
        type: String,
        default: null,
    },
    revolveTitle: {
        type: Boolean,
        default: false,
    },
    badgeBgColor: {
        type: String,
        default: null,
    },
    badgeTextColor: {
        type: String,
        default: null,
    },
    badgeTiltAngle: {
        type: Number,
        default: null,
    }
});

const HomeComponent = mongoose.model("HomeComponent", homeComponentSchema);

export default HomeComponent;
