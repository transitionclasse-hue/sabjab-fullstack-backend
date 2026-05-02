import mongoose from "mongoose";
import HomeComponent from "../models/homeComponent.js";
import Product from "../models/products.js";
import Category from "../models/category.js";
import SuperCategory from "../models/superCategory.js";
import Occasion from "../models/occasion.js";
import StoreStatus from "../models/storeStatus.js";
import GlobalConfig from "../models/globalConfig.js";
import { Seller } from "../models/user.js";
import { buildStoreStatusResponse } from "./storeStatus.js";

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isChoiceOnlyRequest = (value) => ["1", "true", "yes"].includes(String(value || "").toLowerCase());

const findVariationByIdentifier = async ({ identifier, populateComponents = false, select = "", requireChoice = false }) => {
    const normalized = String(identifier || "").trim();
    if (!normalized) return null;

    const buildQuery = (filter) => {
        let query = Occasion.findOne(filter);
        if (populateComponents) {
            query = query.populate("components");
        }
        if (select) {
            query = query.select(select);
        }
        return query.lean();
    };

    if (mongoose.Types.ObjectId.isValid(normalized)) {
        const byId = await buildQuery({
            _id: normalized,
            ...(requireChoice ? { isChoice: true, isActive: true } : {}),
        });
        if (byId) return byId;
    }

    const byName = await buildQuery({
        ...(requireChoice ? { isChoice: true, isActive: true } : {}),
        name: {
            $regex: `^${escapeRegex(normalized)}$`,
            $options: "i",
        }
    });

    if (byName) return byName;

    if (normalized.toLowerCase() === "choice") {
        let query = Occasion.findOne({
            isChoice: true,
            isActive: true,
        }).sort({ order: 1 });
        if (populateComponents) {
            query = query.populate("components");
        }
        if (select) {
            query = query.select(select);
        }
        return query.lean();
    }

    return null;
};

const createApprovedProductChecker = (approvedSellerIds) => (product) => {
    if (!product || product.isApproved === false) return false;
    const sellerId = product?.sellerId?._id || product?.sellerId || null;
    if (!sellerId) return true;
    return approvedSellerIds.has(String(sellerId));
};

const buildSellerVisibilityQuery = (approvedSellerIds) => ({
    $or: [
        { sellerId: { $exists: false } },
        { sellerId: null },
        { sellerId: { $in: [...approvedSellerIds] } },
    ],
});

export const getHomeLayout = async (req, reply) => {
    try {
        const { variationId, choiceOnly } = req.query;
        const shouldFilterChoice = isChoiceOnlyRequest(choiceOnly);
        const approvedSellerIdList = await Seller.find({ isApproved: true }).distinct("_id");
        const approvedSellerIds = new Set(approvedSellerIdList.map((id) => String(id)));
        const isApprovedProduct = createApprovedProductChecker(approvedSellerIds);
        const filterApprovedProducts = (products = []) =>
            products.filter((product) => isApprovedProduct(product) && (!shouldFilterChoice || product?.isChoice === true));
        const sellerVisibilityQuery = buildSellerVisibilityQuery(approvedSellerIdList);
        const choiceProductFilter = shouldFilterChoice ? { isChoice: true } : {};

        // 1. Find the target variation (requested or default)
        let variation;
        if (variationId) {
            variation = await findVariationByIdentifier({
                identifier: variationId,
                populateComponents: true,
                requireChoice: shouldFilterChoice,
            });
        }

        if (!variation) {
            if (shouldFilterChoice) {
                variation = await Occasion.findOne({ isChoice: true, isActive: true }).populate("components").sort({ order: 1 }).lean();
            } else {
                variation = await Occasion.findOne({ isDefault: true }).populate("components").lean() ||
                    await Occasion.findOne({ isActive: true }).populate("components").sort({ order: 1 }).lean();
            }
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
                .populate({
                    path: "categories",
                    populate: { path: "category" } // Deep populate parent category
                })
                .lean();

            // Restore Order from variation.components array
            const orderMap = variation.components.map(c => String(c._id || c));
            components.sort((a, b) => orderMap.indexOf(String(a._id)) - orderMap.indexOf(String(b._id)));
        }

        // 5. Fetch Store Status
        const storeStatusDoc = await StoreStatus.findOne({ key: "primary" }).lean();
        const storeStatus = storeStatusDoc ? buildStoreStatusResponse(storeStatusDoc) : { status: "open", statusLabel: "Open", mode: "schedule" };

        // 6. Fetch Dynamic Special Occasions
        const specialOccasions = await Occasion.find({ isSpecialOccasion: true, isActive: true })
            .select("name icon banner themeColor darkThemeColor isChoice components products")
            .populate({
                path: 'components',
                populate: [
                    { path: 'products' },
                    { path: 'categories' },
                    { path: 'bigDeal' },
                    { path: 'miniDeals' }
                ]
            })
            .populate("products")
            .lean();

        let specialOccasion = null;
        if (specialOccasions.length > 0) {
            // Use the first one as primary data source but update display label
            specialOccasion = { ...specialOccasions[0] };
            if (specialOccasions.length === 1) {
                specialOccasion.displayName = specialOccasions[0].name;
            } else {
                specialOccasion.displayName = "Wow";
            }
        }

        const hydratedComponents = await Promise.all(components.map(async (comp) => {
            if (comp.type === "BENTO_GRID") {
                // HYBRID: Prioritize curated fields, then fill with generic products (deduplicated)
                const curated = [];
                if (isApprovedProduct(comp.bigDeal)) curated.push(comp.bigDeal);
                if (comp.miniDeals?.length) curated.push(...filterApprovedProducts(comp.miniDeals));

                const fallback = filterApprovedProducts(comp.products || []);
                const combined = [...curated, ...fallback];

                // Deduplicate by ID
                const seenIds = new Set();
                comp.resolvedProducts = combined.filter(p => {
                    const id = String(p._id || p.id || p);
                    if (!id || seenIds.has(id)) return false;
                    seenIds.add(id);
                    return true;
                });
            } else if (comp.type === "TRIPLE_SECTION_GRID") {
                // Populate products within each section if they exists as IDs
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
                        // catModel is a populated Category or SubCategory object
                        const itemId = catModel._id || catModel.id;

                        // Robust parent ID mapping:
                        // 1. If it's a SubCategory, its parent is 'category'
                        // 2. If it's a Category, its parent is 'superCategory'
                        const parentCatId = catModel.category?._id || catModel.category ||
                            catModel.superCategory?._id || catModel.superCategory || null;

                        // Calculate product coverage for this exact item
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
                            Product.find(productQuery)
                                .sort({ createdAt: -1 })
                                .limit(4)
                                .select("image")
                                .lean()
                        ]);

                        return {
                            ...catModel,
                            parentCategoryId: parentCatId,
                            productCount: count,
                            previewImages: products.map(p => p.image).filter(Boolean)
                        };
                    }));
                } else {
                    comp.resolvedCategories = [];
                }
            } else if (comp.type === "CATEGORY_STRIP") {
                comp.resolvedCategories = comp.categories || [];
            } else if (comp.type === "CATEGORY_CLUSTERS") {
                // Also filter from clusters if needed (categories live in clusters)
            } else if (comp.type === "FEATURED_DEALS") {
                // Featured deals already populated bigDeal and miniDeals, 
                // but we'll also put them in resolvedProducts just in case for generic scroller reuse
                comp.resolvedProducts = [
                    ...(isApprovedProduct(comp.bigDeal) ? [comp.bigDeal] : []),
                    ...filterApprovedProducts(comp.miniDeals || [])
                ];
            } else if (["PRODUCT_GRID", "PRODUCT_SCROLLER", "CATEGORY_CLUSTERS", "STORY_STRIP", "GRADIENT_HERO", "RAMZAN_SPECIAL", "RAMZAN_SPECIAL2", "HAPPY_HOLI", "DIWALI_SPECIAL", "CHRISTMAS_SPECIAL", "PRODUCT_GRID_3X2", "MINI_VIDEO", "AISLE_2X2_GRID", "PROMOTION_PAGINATION"].includes(comp.type)) {
                comp.resolvedProducts = filterApprovedProducts(comp.products || []);
            }
            return comp;
        }));

        // 4. Fetch Occasions for the strip
        const isChoicePage = shouldFilterChoice || variation?.isChoice === true || variation?.name?.toLowerCase() === 'choice';
        const occasions = await Occasion.find({
            isActive: true,
            isChoice: isChoicePage ? true : { $ne: true },
            isSpecialOccasion: { $ne: true } // 🔥 EXCLUDE from main list
        }).select("-components").sort({ order: 1 }).lean();

        // 7. Fetch the baseline categories and products that the app needs initially
        const [allCategories, allSuperCategories, allProducts] = await Promise.all([
            Category.find(shouldFilterChoice ? { isChoice: true } : {}).lean(),
            SuperCategory.find(shouldFilterChoice ? { isChoice: true } : {}).lean(),
            Product.find({
                isApproved: true,
                ...choiceProductFilter,
                $and: [
                    sellerVisibilityQuery,
                    {
                        $or: [
                            { isAvailable: true },
                            { "variations.isAvailable": true }
                        ]
                    }
                ]
            }).select("-costPrice").lean()
        ]);

        // 8. Build unified response
        const filteredOccasions = occasions;
        const effectiveSpecialOccasion =
            shouldFilterChoice && specialOccasion?.isChoice !== true ? null : specialOccasion;

        return reply.send({
            variation: variation ? {
                id: variation._id,
                name: variation.name,
                isChoice: variation.isChoice === true,
                themeColor: variation.themeColor,
                darkThemeColor: variation.darkThemeColor || null,
                themeEffect: variation.themeEffect || 'none',
                searchBarStyle: variation.searchBarStyle || 'standard',
                topBarStyle: variation.topBarStyle || 'standard',
                nameAlignment: variation.nameAlignment || 'left',
                showBanner: variation.showBanner,
                banner: variation.banner,
                icon: variation.icon,
                searchPlaceholders: variation.searchPlaceholders || [],
                ultraConfig: {
                    ...variation.ultraConfig || {},
                    showOccasionStrip: variation.ultraConfig?.showOccasionStrip !== false // Default to true if missing
                }
            } : null,
            layout: hydratedComponents || [],
            customCategories: filteredOccasions || [],
            storeStatus: {
                ...storeStatus,
                etaBoxColor: variation?.ultraConfig?.etaBgColor || storeStatus.etaBoxColor,
                etaTextColor: variation?.ultraConfig?.etaTextColor || storeStatus.etaTextColor || "#ffffff",
                etaBoxDarkColor: variation?.ultraConfig?.etaBgDarkColor || storeStatus.etaBoxDarkColor,
                etaTextDarkColor: variation?.ultraConfig?.etaTextDarkColor || storeStatus.etaTextDarkColor || "#ffffff"
            },
            specialOccasion: effectiveSpecialOccasion || null,
            // Full baseline dataset:
            allCategories: allCategories || [],
            allSuperCategories: allSuperCategories || [],
            allProducts: allProducts || []
        });

    } catch (error) {
        console.error("Home Layout Fetch Error:", error);
        return reply.status(500).send({ message: "An error occurred fetching home layout", error });
    }
};

export const getActiveHomeVersion = async (req, reply) => {
    try {
        const { variationId } = req.query;

        let variation;
        if (variationId) {
            variation = await findVariationByIdentifier({
                identifier: variationId,
                select: "themeEffect searchBarStyle topBarStyle ultraConfig",
            });
        }

        if (!variation) {
            variation = await Occasion.findOne({ isDefault: true }).select("themeEffect searchBarStyle topBarStyle ultraConfig").lean() ||
                await Occasion.findOne({ isActive: true }).sort({ order: 1 }).select("themeEffect searchBarStyle topBarStyle ultraConfig").lean();
        }

        // Fetch active home screen from GlobalConfig
        const homeConfig = await GlobalConfig.findOne({ key: "active_home_screen" }).lean();
        const homeScreenVersion = homeConfig?.value || "HomeScreen";

        return reply.send({
            homeScreenVersion: homeScreenVersion,
            themeEffect: variation?.themeEffect || "none",
            searchBarStyle: variation?.searchBarStyle || "standard",
            ultraConfig: variation?.ultraConfig || {}
        });
    } catch (error) {
        console.error("Home Version Fetch Error:", error);
        return reply.status(500).send({ message: "An error occurred fetching home version", error });
    }
};
