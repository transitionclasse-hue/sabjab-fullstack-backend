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
import { hydrateHomeComponents, buildSellerVisibilityQuery } from "../utils/productHydrator.js";

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

export const getHomeLayout = async (req, reply) => {
    try {
        const { variationId, choiceOnly } = req.query;
        const shouldFilterChoice = isChoiceOnlyRequest(choiceOnly);
        const approvedSellerIdList = await Seller.find({ isApproved: true }).distinct("_id");
        const sellerVisibilityQuery = buildSellerVisibilityQuery(approvedSellerIdList);

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

        // Auto-detect choice mode if the matched variation is a Choice variation
        const actualFilterChoice = shouldFilterChoice || variation?.isChoice === true;
        const choiceProductFilter = actualFilterChoice ? { isChoice: true } : {};

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

        const hydratedComponents = await hydrateHomeComponents(components, actualFilterChoice);

        let specialOccasion = null;
        if (specialOccasions.length > 0) {
            specialOccasion = { ...specialOccasions[0] };
            if (specialOccasions.length === 1) {
                specialOccasion.displayName = specialOccasions[0].name;
            } else {
                specialOccasion.displayName = "Wow";
            }
            if (specialOccasion.components?.length > 0) {
                specialOccasion.components = await hydrateHomeComponents(specialOccasion.components, actualFilterChoice);
            }
        }


        // 4. Fetch Occasions for the strip
        const isChoicePage = actualFilterChoice || variation?.isChoice === true || variation?.name?.toLowerCase() === 'choice';
        const occasions = await Occasion.find({
            isActive: true,
            isChoice: isChoicePage ? true : { $ne: true },
            $or: [
                { isSpecialOccasion: { $ne: true } },
                { isDefault: true } // 🔥 ALWAYS show the default/main variation in the strip
            ]
        }).select("-components").sort({ order: 1 }).lean();

        // 7. Fetch the baseline categories and products that the app needs initially
        const [allCategories, allSuperCategories, allProducts] = await Promise.all([
            Category.find(actualFilterChoice ? { isChoice: true } : {}).lean(),
            SuperCategory.find(actualFilterChoice ? { isChoice: true } : {}).lean(),
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
            actualFilterChoice && specialOccasion?.isChoice !== true ? null : specialOccasion;


        return reply.send({
            variation: variation ? {
                id: variation._id,
                name: variation.name,
                isChoice: variation.isChoice === true,
                themeColor: variation.themeColor,
                darkThemeColor: variation.darkThemeColor || null,
                themeEffect: variation.themeEffect || 'none',
                searchBarStyle: variation.searchBarStyle || 'standard',
                searchAnimationType: variation.searchAnimationType || 'slide',
                searchAnimationSpeed: variation.searchAnimationSpeed || 3000,
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
