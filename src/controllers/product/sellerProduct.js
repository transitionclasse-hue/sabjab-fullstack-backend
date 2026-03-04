import Product from "../../models/products.js";
import { Seller } from "../../models/user.js";

// Seller explicitly uploads a product. It is always marked isApproved: false.
export const uploadSellerProduct = async (req, reply) => {
    try {
        const { userId, role } = req.user;

        if (role !== "Seller") {
            return reply.status(403).send({ message: "Only sellers can perform this action" });
        }

        const seller = await Seller.findById(userId);
        if (!seller) {
            return reply.status(404).send({ message: "Seller profile not found" });
        }

        // Even if they pass isApproved: true in body, override it.
        const productData = {
            ...req.body,
            isApproved: false,
            sellerId: userId
        };

        const product = new Product(productData);
        await product.save();

        return reply.code(201).send({
            message: "Product uploaded successfully and is pending admin approval.",
            product
        });
    } catch (error) {
        console.error("Seller Product Upload Error:", error);
        return reply.code(500).send({ message: "An error occurred uploading product", error: error.message });
    }
};

// Seller fetching their own products (both approved and pending)
export const getMySellerProducts = async (req, reply) => {
    try {
        const { userId, role } = req.user;

        if (role !== "Seller") {
            return reply.status(403).send({ message: "Only sellers can perform this action" });
        }

        const products = await Product.find({ sellerId: userId })
            .sort({ createdAt: -1 })
            .populate("category subCategory")
            .exec();

        return reply.send({ success: true, count: products.length, products });
    } catch (error) {
        console.error("Fetch Seller Products Error:", error);
        return reply.status(500).send({ message: "An error occurred fetching products", error: error.message });
    }
};

// Admin fetching all pending seller products for review
export const getPendingSellerProducts = async (req, reply) => {
    try {
        const { role } = req.user;
        if (role !== "Admin") {
            return reply.status(403).send({ message: "Unauthorized. Admin only." });
        }

        const pendingProducts = await Product.find({ isApproved: false, sellerId: { $ne: null } })
            .sort({ createdAt: -1 })
            .populate("category subCategory sellerId")
            .exec();

        return reply.send({ success: true, count: pendingProducts.length, products: pendingProducts });
    } catch (error) {
        console.error("Fetch Pending Products Error:", error);
        return reply.status(500).send({ message: "An error occurred fetching pending products", error: error.message });
    }
};

// Admin approving a specific seller product
export const approveSellerProduct = async (req, reply) => {
    try {
        const { role } = req.user;
        if (role !== "Admin") {
            return reply.status(403).send({ message: "Unauthorized. Admin only." });
        }

        const { id } = req.params;
        const product = await Product.findByIdAndUpdate(
            id,
            { isApproved: true },
            { new: true }
        ).populate("sellerId");

        if (!product) {
            return reply.code(404).send({ message: "Product not found" });
        }

        return reply.send({ message: "Product approved successfully", product });
    } catch (error) {
        console.error("Approve Product Error:", error);
        return reply.code(500).send({ message: "An error occurred approving product", error: error.message });
    }
};
