import { v2 as cloudinary } from 'cloudinary';
import Product from "../../models/products.js";
import SubCategory from "../../models/subCategory.js";
import { Seller } from "../../models/user.js";
import { TokriPreorder } from "../../models/tokriPreorder.js";
import Order from "../../models/order.js";
import WalletTransaction from "../../models/walletTransaction.js";
import { getSafeSensitiveMode } from "../../utils/sensitiveMode.js";

const isManagerCatalogRequest = (req) => req?.raw?.url?.includes("/manager/products");
const isChoiceOnlyRequest = (value) => ["1", "true", "yes"].includes(String(value || "").toLowerCase());

const getLiveVisibilityFilter = async () => {
    const approvedSellerIds = await Seller.find({ isApproved: true }).distinct("_id");
    return {
        isApproved: true,
        $or: [
            { sellerId: { $exists: false } },
            { sellerId: null },
            { sellerId: { $in: approvedSellerIds } },
        ],
    };
};

export const getProductsByCategoryId = async (req, reply) => {
    const { categoryId } = req.params;
    try {
        const shouldFilterChoice = isChoiceOnlyRequest(req.query?.choiceOnly);
        const hideSensitive = await getSafeSensitiveMode(req);
        const liveVisibilityFilter = await getLiveVisibilityFilter();

        // Find SubCategories that belong to this categoryId
        const subCategories = await SubCategory.find({ category: categoryId });
        const subCategoryIds = subCategories.map(sub => sub._id);

        const sensitiveFilter = hideSensitive ? { isSensitive: { $ne: true } } : {};
        const categoryFilter = {
            $or: [
                { category: categoryId },
                { subCategory: categoryId },
                ...(subCategoryIds.length > 0 ? [
                    { category: { $in: subCategoryIds } },
                    { subCategory: { $in: subCategoryIds } },
                ] : []),
            ]
        };

        const query = {
            ...sensitiveFilter,
            isApproved: true,
            ...(shouldFilterChoice ? { isChoice: true } : {}),
            $and: [liveVisibilityFilter, categoryFilter],
        };

        const products = await Product.find(query).select("-costPrice").exec();
        return reply.send(products);
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred", error });
    }
};

export const searchProducts = async (req, reply) => {
    const { query, q, choiceOnly } = req.query;
    try {
        const searchTerm = (query || q || "").trim();
        if (!searchTerm) {
            return reply.send([]);
        }

        const hideSensitive = await getSafeSensitiveMode(req);
        const liveVisibilityFilter = await getLiveVisibilityFilter();
        const sensitiveFilter = hideSensitive ? { isSensitive: { $ne: true } } : {};
        const shouldFilterChoice = ["1", "true", "yes"].includes(String(choiceOnly || "").toLowerCase());

        const products = await Product.find({
            ...sensitiveFilter,
            isApproved: true,
            ...(shouldFilterChoice ? { isChoice: true } : {}),
            $and: [
                liveVisibilityFilter,
                {
                    $or: [
                        { name: { $regex: searchTerm, $options: "i" } },
                        { description: { $regex: searchTerm, $options: "i" } },
                        { tags: { $in: [new RegExp(searchTerm, "i")] } }
                    ]
                }
            ]
        }).select("-costPrice").exec();

        return reply.send(products);
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred during search", error });
    }
};

// User-facing (usually) or Manager-facing — handles filtering
export const getAllProducts = async (req, reply) => {
    try {
        const { filter, choiceOnly } = req.query || {};
        const hideSensitive = await getSafeSensitiveMode(req);
        const shouldFilterChoice = isChoiceOnlyRequest(choiceOnly);

        const query = hideSensitive ? { isSensitive: { $ne: true } } : {};
        if (!isManagerCatalogRequest(req)) {
            const liveVisibilityFilter = await getLiveVisibilityFilter();
            query.isApproved = true;
            query.$and = [liveVisibilityFilter];
        }
        if (shouldFilterChoice) {
            query.isChoice = true;
        }

        if (filter === "coins") {
            // Products that have a coinPrice > 0 are redeemable via coins
            query.coinPrice = { $gt: 0 };
        }

        const products = await Product.find(query)
            .select(isManagerCatalogRequest(req) ? "" : "-costPrice")
            .sort({ createdAt: -1 })
            .populate("category subCategory superCategory")
            .exec();
        return reply.send({ success: true, products });
    } catch (error) {
        console.error("Error fetching products:", error);
        return reply.status(500).send({ message: "An error occurred fetching products", error: error.message });
    }
};

export const getProductById = async (req, reply) => {
    try {
        const liveVisibilityFilter = await getLiveVisibilityFilter();
        const product = await Product.findOne({
            _id: req.params.id,
            isApproved: true,
            $and: [liveVisibilityFilter],
        }).select("-costPrice").exec();
        if (!product) {
            return reply.code(404).send({ message: "Product not found" });
        }
        return reply.send(product);
    } catch (error) {
        return reply.code(500).send({ message: "An error occurred fetching product", error });
    }
};

// Manager-specific product operations
export const createProduct = async (req, reply) => {
    try {
        const productData = req.body;
        const product = new Product(productData);
        await product.save();
        return reply.code(201).send(product);
    } catch (error) {
        return reply.code(500).send({ message: "An error occurred creating product", error });
    }
};

export const updateProduct = async (req, reply) => {
    try {
        const { id } = req.params;
        const productData = req.body;
        const product = await Product.findByIdAndUpdate(id, productData, { new: true });
        if (!product) {
            return reply.code(404).send({ message: "Product not found" });
        }

        // Process morning price difference cashback refund to customer wallets
        const newTokriPrice = Number(productData.tokriPrice);
        if (productData.tokriPrice !== undefined && newTokriPrice > 0) {
            try {
                // Find all completed/processing orders from the last 24 hours containing this Tokri item
                const targetDate = new Date();
                targetDate.setHours(targetDate.getHours() - 24);

                const orders = await Order.find({
                    createdAt: { $gte: targetDate },
                    status: { $nin: ["cancelled"] },
                    "items.item": id,
                    "items.preorderType": "tokri"
                });

                for (const order of orders) {
                    const matchedItem = order.items.find(
                        (i) => String(i.item) === String(id) && i.preorderType === "tokri"
                    );

                    if (matchedItem) {
                        const orderedPrice = matchedItem.variation?.price || matchedItem.variation?.discountPrice || matchedItem.itemPrice || 0;
                        const cashbackAmount = (orderedPrice - newTokriPrice) * (matchedItem.count || 1);

                        if (cashbackAmount > 0) {
                            // Prevent duplicate cashback adjustments for the same order and product
                            const existingTxn = await WalletTransaction.findOne({
                                customer: order.customer,
                                order: order._id,
                                txnType: "tokri_cashback",
                                "meta.productId": id
                            });

                            if (!existingTxn) {
                                await WalletTransaction.create({
                                    customer: order.customer,
                                    order: order._id,
                                    amount: cashbackAmount,
                                    type: "credit",
                                    txnType: "tokri_cashback",
                                    status: "completed",
                                    description: `Tokri Price Guarantee cashback refund for ${product.name} (Order #${order.orderId || order._id})`,
                                    meta: { productId: id }
                                });
                                console.log(`[TokriCashback] Credited ₹${cashbackAmount} to customer ${order.customer} for order ${order._id}`);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("[TokriCashback] Error during price update cashback trigger:", err);
            }
        }

        return reply.send(product);
    } catch (error) {
        return reply.code(500).send({ message: "An error occurred updating product", error });
    }
};

export const deleteProduct = async (req, reply) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) {
            return reply.code(404).send({ message: "Product not found" });
        }

        // Delete image from Cloudinary if exists
        if (product.image) {
            try {
                const publicId = product.image.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`sabjab_manager/${publicId}`);
                console.log(`✅ Deleted image from Cloudinary: ${publicId}`);
            } catch (err) {
                console.error("❌ Failed to delete image from Cloudinary:", err);
            }
        }

        await Product.findByIdAndDelete(id);
        return reply.send({ message: "Product and its media deleted successfully" });
    } catch (error) {
        return reply.code(500).send({ message: "An error occurred deleting product", error });
    }
};

export const updateProductStatus = async (req, reply) => {
    try {
        const { id } = req.params;
        const { isAvailable } = req.body;
        const product = await Product.findByIdAndUpdate(id, { isAvailable }, { new: true });
        if (!product) {
            return reply.code(404).send({ message: "Product not found" });
        }
        return reply.send(product);
    } catch (error) {
        return reply.code(500).send({ message: "An error occurred updating product status", error });
    }
};

export const createBulkProducts = async (req, reply) => {
    try {
        const products = req.body; // Expecting an array of products
        if (!Array.isArray(products)) {
            return reply.code(400).send({ message: "Invalid data format. Expected an array of products." });
        }
        
        const results = await Product.insertMany(products);
        return reply.code(201).send({
            success: true,
            count: results.length,
            message: `${results.length} products created successfully.`
        });
    } catch (error) {
        console.error("Bulk creation error:", error);
        return reply.code(500).send({ message: "An error occurred during bulk product creation", error: error.message });
    }
};

export const validateCart = async (req, reply) => {
    try {
        const { items } = req.body || {};
        if (!Array.isArray(items) || items.length === 0) {
            return reply.send({ success: true, unavailableItems: [] });
        }

        const productIds = items.map(item => item.productId).filter(Boolean);
        const liveVisibilityFilter = await getLiveVisibilityFilter();
        
        // Find all products in the cart that are approved and live
        const products = await Product.find({
            _id: { $in: productIds },
            isApproved: true,
            $and: [liveVisibilityFilter],
        }).select("-costPrice").exec();

        const unavailableItems = [];

        for (const item of items) {
            const product = products.find(p => String(p._id) === String(item.productId));
            
            if (!product) {
                // Product deleted, unapproved, or invisible
                unavailableItems.push({
                    id: item.id,
                    productId: item.productId,
                    name: item.name,
                    image: item.image || "",
                    reason: "deleted"
                });
                continue;
            }

            const productImage = product.image || product.image_url || item.image || "";

            const isTokriItem = item.preorderType === "tokri";

            if (product.isAvailable === false && !isTokriItem) {
                unavailableItems.push({
                    id: item.id,
                    productId: item.productId,
                    name: product.name,
                    image: productImage,
                    reason: "unavailable"
                });
                continue;
            }

            // Check variation if item has a variation
            if (item.variation) {
                const variationName = typeof item.variation === 'string' ? item.variation : item.variation.name;
                const dbVariation = product.variations.find(v => v.name === variationName);
                
                if (!dbVariation) {
                    unavailableItems.push({
                        id: item.id,
                        productId: item.productId,
                        name: `${product.name} (${variationName})`,
                        image: productImage,
                        reason: "variation_deleted"
                    });
                } else if (dbVariation.isAvailable === false && !isTokriItem) {
                    unavailableItems.push({
                        id: item.id,
                        productId: item.productId,
                        name: `${product.name} (${dbVariation.name})`,
                        image: productImage,
                        variation: dbVariation,
                        reason: "unavailable"
                    });
                } else if (dbVariation.stock <= 0 && !isTokriItem) {
                    unavailableItems.push({
                        id: item.id,
                        productId: item.productId,
                        name: `${product.name} (${dbVariation.name})`,
                        image: productImage,
                        variation: dbVariation,
                        reason: "out_of_stock"
                    });
                }
            } else {
                // Check main product stock
                if (product.stock <= 0 && !isTokriItem) {
                    unavailableItems.push({
                        id: item.id,
                        productId: item.productId,
                        name: product.name,
                        image: productImage,
                        reason: "out_of_stock"
                    });
                }
            }
        }

        return reply.send({ success: true, unavailableItems });
    } catch (error) {
        console.error("Cart validation error:", error);
        return reply.status(500).send({ message: "An error occurred during cart validation", error: error.message });
    }
};

export const commitTokriBasket = async (req, reply) => {
    try {
        const { userId } = req.user;
        const { items, merge = true } = req.body;

        if (!items || !Array.isArray(items)) {
            return reply.status(400).send({ message: "Preorder items list is invalid" });
        }

        let preorder = await TokriPreorder.findOne({ userId, status: "committed" });

        if (preorder && merge !== false) {
            // Merge newly added preorder items with existing locked items
            for (const newItem of items) {
                const targetPid = String(newItem.productId || newItem.id || newItem._id);
                const existingItem = preorder.items.find(item => String(item.productId) === targetPid);

                if (existingItem) {
                    existingItem.qty = Number(existingItem.qty) + Number(newItem.qty || 1);
                } else {
                    preorder.items.push({
                        productId: targetPid,
                        qty: newItem.qty || 1,
                        name: newItem.name,
                        unit: newItem.unit,
                        price: newItem.price,
                    });
                }
            }
            await preorder.save();
        } else {
            // Overwrite existing preorder or create new one
            if (preorder) {
                if (items.length === 0) {
                    // If list is empty, delete preorder document
                    await TokriPreorder.deleteOne({ _id: preorder._id });
                    return reply.status(200).send({ success: true, preorder: null });
                }
                preorder.items = items.map(item => ({
                    productId: item.productId || item.id || item._id,
                    qty: item.qty || 1,
                    name: item.name,
                    unit: item.unit,
                    price: item.price,
                }));
                await preorder.save();
            } else {
                if (items.length === 0) {
                    return reply.status(200).send({ success: true, preorder: null });
                }
                preorder = new TokriPreorder({
                    userId,
                    items: items.map(item => ({
                        productId: item.productId || item.id || item._id,
                        qty: item.qty || 1,
                        name: item.name,
                        unit: item.unit,
                        price: item.price,
                    })),
                    status: "committed"
                });
                await preorder.save();
            }
        }

        return reply.status(201).send({ success: true, preorder });
    } catch (error) {
        console.error("Tokri Preorder Commit Error:", error);
        return reply.status(500).send({ message: "An error occurred committing Tokri preorder", error: error.message });
    }
};

export const currentTokriBasket = async (req, reply) => {
    try {
        const { userId } = req.user;
        const preorder = await TokriPreorder.findOne({ userId, status: "committed" })
            .populate("items.productId")
            .exec();

        if (!preorder) {
            return reply.send({ success: true, preorder: null });
        }

        // Hydrate items with dynamic morning Tokri rates
        const hydratedItems = preorder.items.map(item => {
            const product = item.productId;
            const nightPrice = item.price || 0;
            const morningAppPrice = product ? (product.discountPrice || product.price || 0) : nightPrice;
            let finalTokriPrice;

            if (product && product.tokriPrice !== undefined && product.tokriPrice !== null && product.tokriPrice > 0) {
                finalTokriPrice = product.tokriPrice;
            } else {
                const morningDiscounted = Math.floor(morningAppPrice * 0.9);
                finalTokriPrice = Math.min(nightPrice, morningDiscounted);
            }

            return {
                _id: item._id,
                productId: product ? {
                    _id: product._id,
                    name: product.name,
                    image: product.image,
                    unit: product.unit,
                    stock: product.stock,
                    isAvailable: product.isAvailable,
                } : null,
                qty: item.qty,
                name: item.name,
                unit: item.unit,
                nightPrice,
                morningPrice: morningAppPrice,
                tokriPrice: finalTokriPrice,
            };
        });

        return reply.send({
            success: true,
            preorder: {
                _id: preorder._id,
                userId: preorder.userId,
                status: preorder.status,
                items: hydratedItems,
                createdAt: preorder.createdAt,
            }
        });
    } catch (error) {
        console.error("Tokri Preorder Fetch Error:", error);
        return reply.status(500).send({ message: "An error occurred fetching Tokri preorder", error: error.message });
    }
};

export const checkoutTokriBasket = async (req, reply) => {
    try {
        const { userId } = req.user;
        await TokriPreorder.findOneAndUpdate({ userId, status: "committed" }, { status: "checked_out" });
        return reply.send({ success: true });
    } catch (error) {
        console.error("Tokri Checkout Error:", error);
        return reply.status(500).send({ message: "An error occurred checking out Tokri", error: error.message });
    }
};

