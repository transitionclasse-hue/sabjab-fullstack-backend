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
            "PROMO_BANNER", // ✅ New: Large Promotional Banner
            "IMAGE_CAROUSEL" // ✅ New: Image Slider 
        ],
        required: true,
    },
    order: {
        type: Number,
        required: true,
        default: 1,
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
    isActive: {
        type: Boolean,
        default: true,
    },
    variation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Occasion",
        required: true
    }
});

const HomeComponent = mongoose.model("HomeComponent", homeComponentSchema);

export default HomeComponent;
