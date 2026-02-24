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
            "GRADIENT_HERO"  // ✅ NEW: High-impact section
        ],
        required: true,
    },
    subTitle: { // NEW: For descriptive headers
        type: String,
    },
    buttonText: { // NEW: For CTA buttons
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
    isActive: {
        type: Boolean,
        default: true,
    }
});

const HomeComponent = mongoose.model("HomeComponent", homeComponentSchema);

export default HomeComponent;
