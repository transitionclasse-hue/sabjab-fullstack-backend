import HomeComponent from "../models/homeComponent.js";
import Product from "../models/products.js";
import Occasion from "../models/occasion.js";
import StoreStatus from "../models/storeStatus.js";

export const getHomeLayout = async (req, reply) => {
    try {
        const { variationId } = req.query;

        // 1. Find the target variation (requested or default)
        let variation;
        if (variationId) {
            variation = await Occasion.findById(variationId).populate("components").lean();
        }

        if (!variation) {
            variation = await Occasion.findOne({ isDefault: true }).populate("components").lean() ||
                await Occasion.findOne({ isActive: true }).populate("components").sort({ order: 1 }).lean();
        }

        // 2. Fetch components explicitly assigned to this variation
        let components = [];
        if (variation) {
            components = await HomeComponent.find({
                _id: { $in: variation.components.map(c => c._id || c) },
                isActive: true
            })
                .populate("bigDeal")
                .populate("miniDeals")
                .populate("products")
                .lean();

            // Restore Order from variation.components array
            const orderMap = variation.components.map(c => String(c._id || c));
            components.sort((a, b) => orderMap.indexOf(String(a._id)) - orderMap.indexOf(String(b._id)));
        }

        // 3. Dynamic Fallback for components
        const hydratedComponents = await Promise.all(components.map(async (comp) => {
            if (["PRODUCT_GRID", "PRODUCT_SCROLLER", "CATEGORY_CLUSTERS", "BENTO_GRID", "STORY_STRIP", "GRADIENT_HERO"].includes(comp.type)) {
                if (!comp.products || comp.products.length === 0) {
                    const fallback = await Product.find({ isAvailable: true }).sort({ createdAt: -1 }).limit(20).lean();
                    comp.resolvedProducts = fallback;
                } else {
                    comp.resolvedProducts = comp.products;
                }
            } else if (comp.type === "FEATURED_DEALS") {
                if (!comp.bigDeal && (!comp.miniDeals || comp.miniDeals.length === 0)) {
                    const bestDeals = await Product.find({ isAvailable: true, discountPrice: { $gt: 0 } }).sort({ createdAt: -1 }).limit(5);
                    if (bestDeals.length > 0) {
                        comp.bigDeal = bestDeals[0];
                        comp.miniDeals = bestDeals.slice(1, 5);
                    }
                }
            }
            return comp;
        }));

        // 4. Fetch ALL Occasions for the strip
        const occasions = await Occasion.find({ isActive: true }).select("-components").sort({ order: 1 }).lean();

        // 5. Fetch Store Status
        const storeStatus = await StoreStatus.findOne({ key: "primary" }).lean();

        // 6. Build unified response
        return reply.send({
            variation: variation ? {
                id: variation._id,
                name: variation.name,
                themeColor: variation.themeColor,
                themeMode: variation.themeMode || 'auto',
                nameAlignment: variation.nameAlignment || 'left',
                showBanner: variation.showBanner,
                banner: variation.banner,
                icon: variation.icon
            } : null,
            layout: hydratedComponents,
            categories: occasions, // Restored for frontend
            customCategories: occasions, // Fallback for various strip implementations
            storeStatus
        });

    } catch (error) {
        console.error("Home Layout Fetch Error:", error);
        return reply.status(500).send({ message: "An error occurred fetching home layout", error });
    }
};
