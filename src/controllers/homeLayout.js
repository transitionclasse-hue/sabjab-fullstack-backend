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

        const hydratedComponents = await Promise.all(components.map(async (comp) => {
            if (comp.type === "BENTO_GRID") {
                // HYBRID: Prioritize curated fields, then fill with generic products (deduplicated)
                const curated = [];
                if (comp.bigDeal) curated.push(comp.bigDeal);
                if (comp.miniDeals?.length) curated.push(...comp.miniDeals);

                const fallback = comp.products || [];
                const combined = [...curated, ...fallback];

                // Deduplicate by ID
                const seenIds = new Set();
                comp.resolvedProducts = combined.filter(p => {
                    const id = String(p._id || p.id || p);
                    if (!id || seenIds.has(id)) return false;
                    seenIds.add(id);
                    return true;
                });
            } else if (["PRODUCT_GRID", "PRODUCT_SCROLLER", "CATEGORY_CLUSTERS", "STORY_STRIP", "GRADIENT_HERO"].includes(comp.type)) {
                comp.resolvedProducts = comp.products || [];
            }
            return comp;
        }));

        // 4. Fetch ALL Occasions for the strip
        const occasions = await Occasion.find({ isActive: true }).select("-components").sort({ order: 1 }).lean();

        // 5. Fetch Store Status
        const storeStatus = await StoreStatus.findOne({ key: "primary" }).lean();

        // 6. Fetch Global Special Occasion
        const GlobalConfig = mongoose.models.GlobalConfig;
        const config = await GlobalConfig.findOne({ key: "header_special_occasion" }).lean();

        let specialOccasion = null;
        if (config && config.value) {
            specialOccasion = await Occasion.findById(config.value).select("name icon banner themeColor").lean();
        }

        // 7. Build unified response
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
            storeStatus,
            specialOccasion // ✅ NEW: Sent for the Search Bar area
        });

    } catch (error) {
        console.error("Home Layout Fetch Error:", error);
        return reply.status(500).send({ message: "An error occurred fetching home layout", error });
    }
};
