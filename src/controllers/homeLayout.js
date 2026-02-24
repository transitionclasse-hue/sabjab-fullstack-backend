import HomeComponent from "../models/homeComponent.js";
import Product from "../models/products.js";

export const getHomeLayout = async (req, reply) => {
    try {
        const components = await HomeComponent.find({ isActive: true })
            .populate("bigDeal")
            .populate("miniDeals")
            .populate("products")
            .sort({ order: 1 })
            .lean();

        // Dynamic Fallback: If a component has no products/deals selected, fetch latest
        const finalComponents = await Promise.all(components.map(async (comp) => {
            if (comp.type === "PRODUCT_GRID" || comp.type === "PRODUCT_SCROLLER" || comp.type === "CATEGORY_CLUSTERS") {
                if (!comp.products || comp.products.length === 0) {
                    const latest = await Product.find({ isAvailable: true })
                        .sort({ createdAt: -1 })
                        .limit(8);
                    comp.products = latest;
                }
            } else if (comp.type === "FEATURED_DEALS") {
                if (!comp.bigDeal && (!comp.miniDeals || comp.miniDeals.length === 0)) {
                    const bestDeals = await Product.find({
                        isAvailable: true,
                        discountPrice: { $gt: 0 }
                    })
                        .sort({ createdAt: -1 })
                        .limit(5);

                    if (bestDeals.length > 0) {
                        comp.bigDeal = bestDeals[0];
                        comp.miniDeals = bestDeals.slice(1, 5);
                    }
                }
            }
            return comp;
        }));

        return reply.send(finalComponents);
    } catch (error) {
        console.error("Home Layout Fetch Error:", error);
        return reply.status(500).send({ message: "An error occurred fetching home layout", error });
    }
};
