import Product from "../models/products.js";
import { Seller } from "../models/user.js";

export const createApprovedProductChecker = (approvedSellerIds) => (product) => {
    if (!product || product.isApproved === false) return false;
    const sellerId = product?.sellerId?._id || product?.sellerId || null;
    if (!sellerId) return true;
    return approvedSellerIds.has(String(sellerId));
};

export const buildSellerVisibilityQuery = (approvedSellerIdList) => ({
    $or: [
        { sellerId: { $exists: false } },
        { sellerId: null },
        { sellerId: { $in: [...approvedSellerIdList] } },
    ],
});

export const hydrateHomeComponents = async (comps, shouldFilterChoice = false) => {
    if (!comps || comps.length === 0) return [];

    const approvedSellerIdList = await Seller.find({ isApproved: true }).distinct("_id");
    const approvedSellerIds = new Set(approvedSellerIdList.map((id) => String(id)));
    const isApprovedProduct = createApprovedProductChecker(approvedSellerIds);

    const filterApprovedProducts = (products = []) =>
        products.filter((product) => isApprovedProduct(product) && (!shouldFilterChoice || product?.isChoice === true));

    const sellerVisibilityQuery = buildSellerVisibilityQuery(approvedSellerIdList);
    const choiceProductFilter = shouldFilterChoice ? { isChoice: true } : {};

    return await Promise.all(comps.map(async (comp) => {
        if (comp.type === "BENTO_GRID") {
            const curated = [];
            if (isApprovedProduct(comp.bigDeal)) curated.push(comp.bigDeal);
            if (comp.miniDeals?.length) curated.push(...filterApprovedProducts(comp.miniDeals));
            const fallback = filterApprovedProducts(comp.products || []);
            const combined = [...curated, ...fallback];
            const seenIds = new Set();
            comp.resolvedProducts = combined.filter(p => {
                const id = String(p._id || p.id || p);
                if (!id || seenIds.has(id)) return false;
                seenIds.add(id);
                return true;
            });
        } else if (comp.type === "TIME_BASED_SCROLLER") {
            if (comp.timeSlots?.length > 0) {
                comp.timeSlots = await Promise.all(comp.timeSlots.map(async (slot) => {
                    if (slot.products?.length > 0) {
                        slot.resolvedProducts = await Product.find({
                            _id: { $in: slot.products },
                            isApproved: true,
                            ...choiceProductFilter,
                            ...sellerVisibilityQuery,
                        }).lean();
                    }
                    return slot;
                }));
            }
        } else if (comp.type === "TRIPLE_SECTION_GRID") {
            if (comp.sections?.length > 0) {
                comp.sections = await Promise.all(comp.sections.map(async (sec) => {
                    if (sec.products?.length > 0) {
                        sec.products = await Product.find({
                            _id: { $in: sec.products },
                            isApproved: true,
                            ...choiceProductFilter,
                            ...sellerVisibilityQuery,
                        }).lean();
                    }
                    return sec;
                }));
            }
        } else if (comp.type === "CATEGORY_GRID_FOUR_IMAGES" || comp.type === "GROCERY_LIST_2X3") {
            if (comp.categories?.length > 0) {
                comp.resolvedCategories = await Promise.all(comp.categories.map(async (catModel) => {
                    const itemId = catModel._id || catModel.id;
                    const parentCatId = catModel.category?._id || catModel.category ||
                        catModel.superCategory?._id || catModel.superCategory || null;
                    const productQuery = {
                        isAvailable: true,
                        isApproved: true,
                        ...choiceProductFilter,
                        $and: [
                            sellerVisibilityQuery,
                            { $or: [{ category: itemId }, { subCategory: itemId }] },
                        ],
                    };
                    const [count, products] = await Promise.all([
                        Product.countDocuments(productQuery),
                        Product.find(productQuery).sort({ createdAt: -1 }).limit(4).select("image").lean()
                    ]);
                    return { ...catModel, parentCategoryId: parentCatId, productCount: count, previewImages: products.map(p => p.image).filter(Boolean) };
                }));
            } else {
                comp.resolvedCategories = [];
            }
        } else if (comp.type === "CATEGORY_STRIP") {
            comp.resolvedCategories = comp.categories || [];
        } else if (comp.type === "FEATURED_DEALS") {
            const isAvailableBigDeal = comp.bigDeal && 
                isApprovedProduct(comp.bigDeal) && 
                comp.bigDeal.isAvailable !== false && 
                (comp.bigDeal.stock === undefined || comp.bigDeal.stock > 0);
            
            if (!isAvailableBigDeal) {
                comp.bigDeal = null;
            }

            if (comp.miniDeals?.length > 0) {
                comp.miniDeals = comp.miniDeals.filter(p => 
                    isApprovedProduct(p) && 
                    p.isAvailable !== false && 
                    (p.stock === undefined || p.stock > 0)
                );
            }

            comp.resolvedProducts = [
                ...(comp.bigDeal ? [comp.bigDeal] : []),
                ...(comp.miniDeals || [])
            ];
        } else if (["PRODUCT_GRID", "PRODUCT_SCROLLER", "CATEGORY_CLUSTERS", "STORY_STRIP", "GRADIENT_HERO", "RAMZAN_SPECIAL", "RAMZAN_SPECIAL2", "HAPPY_HOLI", "DIWALI_SPECIAL", "CHRISTMAS_SPECIAL", "PRODUCT_GRID_3X2", "MINI_VIDEO", "AISLE_2X2_GRID", "PROMOTION_PAGINATION", "TIME_BASED_SCROLLER"].includes(comp.type)) {
            comp.resolvedProducts = filterApprovedProducts(comp.products || []);
        }
        return comp;
    }));
};
