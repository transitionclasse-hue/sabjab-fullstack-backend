import HomeComponent from "../models/homeComponent.js";
import Product from "../models/products.js";
import Category from "../models/category.js";
import SuperCategory from "../models/superCategory.js";
import Occasion from "../models/occasion.js";
import StoreStatus from "../models/storeStatus.js";
import GlobalConfig from "../models/globalConfig.js";
import { buildStoreStatusResponse } from "./storeStatus.js";

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

        // 6. Fetch Global Special Occasion
        const config = await GlobalConfig.findOne({ key: "header_special_occasion" }).lean();
        let specialOccasion = null;
        if (config && config.value) {
            specialOccasion = await Occasion.findById(config.value).select("name icon banner themeColor darkThemeColor").lean();
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
            } else if (comp.type === "TRIPLE_SECTION_GRID") {
                // Populate products within each section if they exists as IDs
                if (comp.sections?.length > 0) {
                    comp.sections = await Promise.all(comp.sections.map(async (sec) => {
                        if (sec.products?.length > 0) {
                            sec.products = await Product.find({ _id: { $in: sec.products } }).lean();
                        }
                        return sec;
                    }));
                }
            } else if (comp.type === "CATEGORY_GRID_FOUR_IMAGES") {
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
                            $or: [{ category: itemId }, { subCategory: itemId }],
                            isAvailable: true
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
                // Filter out specialOccasion from this specific strip if it matches
                if (specialOccasion) {
                    comp.resolvedCategories = comp.resolvedCategories.filter(c => String(c._id || c) !== String(specialOccasion._id));
                }
            } else if (comp.type === "CATEGORY_CLUSTERS") {
                // Also filter from clusters if needed (categories live in clusters)
                if (specialOccasion && comp.categories) {
                    comp.categories = comp.categories.filter(c => String(c._id || c) !== String(specialOccasion._id));
                }
            } else if (comp.type === "FEATURED_DEALS") {
                // Featured deals already populated bigDeal and miniDeals, 
                // but we'll also put them in resolvedProducts just in case for generic scroller reuse
                comp.resolvedProducts = [
                    ...(comp.bigDeal ? [comp.bigDeal] : []),
                    ...(comp.miniDeals || [])
                ];
            } else if (["PRODUCT_GRID", "PRODUCT_SCROLLER", "CATEGORY_CLUSTERS", "STORY_STRIP", "GRADIENT_HERO", "RAMZAN_SPECIAL", "RAMZAN_SPECIAL2", "HAPPY_HOLI", "DIWALI_SPECIAL", "CHRISTMAS_SPECIAL", "PRODUCT_GRID_3X2", "MINI_VIDEO"].includes(comp.type)) {
                comp.resolvedProducts = comp.products || [];
            }
            return comp;
        }));

        // 4. Fetch ALL Occasions for the strip
        const occasions = await Occasion.find({ isActive: true }).select("-components").sort({ order: 1 }).lean();

        // 7. Fetch the baseline categories and products that the app needs initially
        const [allCategories, allSuperCategories, allProducts] = await Promise.all([
            Category.find({}).lean(),
            SuperCategory.find({}).lean(),
            Product.find({
                $or: [
                    { isAvailable: true },
                    { "variations.isAvailable": true }
                ]
            }).lean()
        ]);

        // 8. Build unified response
        const filteredOccasions = specialOccasion
            ? occasions.filter(o => String(o._id) !== String(specialOccasion._id))
            : occasions;

        return reply.send({
            variation: variation ? {
                id: variation._id,
                name: variation.name,
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
                ultraConfig: variation.ultraConfig || {}
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
            specialOccasion: specialOccasion || null,
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
            variation = await Occasion.findById(variationId).select("themeEffect searchBarStyle topBarStyle ultraConfig").lean();
        }

        if (!variation) {
            variation = await Occasion.findOne({ isDefault: true }).select("themeEffect searchBarStyle topBarStyle ultraConfig").lean() ||
                await Occasion.findOne({ isActive: true }).sort({ order: 1 }).select("themeEffect searchBarStyle topBarStyle ultraConfig").lean();
        }

        return reply.send({
            homeScreenVersion: "HomeScreen",
            themeEffect: variation?.themeEffect || "none",
            searchBarStyle: variation?.searchBarStyle || "standard",
            ultraConfig: variation?.ultraConfig || {}
        });
    } catch (error) {
        console.error("Home Version Fetch Error:", error);
        return reply.status(500).send({ message: "An error occurred fetching home version", error });
    }
};
