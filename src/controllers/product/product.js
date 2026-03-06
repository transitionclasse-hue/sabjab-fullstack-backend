import Product from "../../models/products.js";
import SubCategory from "../../models/subCategory.js";
import { Seller } from "../../models/user.js";
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

        const products = await Product.find(query).exec();
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
                        { description: { $regex: searchTerm, $options: "i" } }
                    ]
                }
            ]
        }).exec();

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
            .sort({ createdAt: -1 })
            .populate("category subCategory")
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
        }).exec();
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
        return reply.send(product);
    } catch (error) {
        return reply.code(500).send({ message: "An error occurred updating product", error });
    }
};

export const deleteProduct = async (req, reply) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            return reply.code(404).send({ message: "Product not found" });
        }
        return reply.send({ message: "Product deleted successfully" });
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
