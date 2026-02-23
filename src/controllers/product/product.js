import Product from "../../models/products.js";
import SubCategory from "../../models/subCategory.js";

export const getProductsByCategoryId = async (req, reply) => {
    const { categoryId } = req.params;
    try {
        // Find SubCategories that belong to this categoryId
        const subCategories = await SubCategory.find({ category: categoryId });
        const subCategoryIds = subCategories.map(sub => sub._id);

        // Build query: find products where:
        // 1. category matches the categoryId directly, OR
        // 2. subCategory matches the categoryId directly, OR
        // 3. category matches one of the subcategory IDs (legacy data), OR
        // 4. subCategory matches one of the subcategory IDs (new structure)
        const query = {
            $or: [
                { category: categoryId },
                { subCategory: categoryId },
                ...(subCategoryIds.length > 0 ? [
                    { category: { $in: subCategoryIds } },
                    { subCategory: { $in: subCategoryIds } },
                ] : []),
            ]
        };

        const products = await Product.find(query)
            .exec();

        return reply.send(products);
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred", error });
    }
};

export const searchProducts = async (req, reply) => {
    const { query } = req.query;
    try {
        if (!query) {
            return reply.send([]);
        }

        const products = await Product.find({
            $or: [
                { name: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } }
            ]
        }).exec();

        return reply.send(products);
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred during search", error });
    }
};

export const getAllProducts = async (req, reply) => {
    try {
        const products = await Product.find().exec();
        return reply.send(products);
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred fetching all products", error });
    }
};

export const getProductById = async (req, reply) => {
    try {
        const product = await Product.findById(req.params.id).exec();
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