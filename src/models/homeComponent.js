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
            "MINI_VIDEO" // ✅ NEW: Floating mini video promotion
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
    bannerImage: {
        type: String,
    },
    carouselImages: [
        {
            type: String,
        }
    ],
    themeColor: {
        type: String,
        default: null,
    },
    themeMode: { // ✅ NEW: Per-component theme variations
        type: String,
        enum: ["light", "dark", "glass", "snow", "rain", "autumn"],
        default: "glass",
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
    }
});

const HomeComponent = mongoose.model("HomeComponent", homeComponentSchema);

export default HomeComponent;
