import Review from "../models/review.js";
import Order from "../models/order.js";
import Product from "../models/products.js";

/**
 * ✅ 1. Add/Update Review
 */
export const addReview = async (req, reply) => {
    try {
        const { productId, orderId, rating, comment } = req.body;
        const userId = req.user._id;

        // 1. Verify if order exists and belongs to user
        const order = await Order.findOne({ _id: orderId, customer: userId });
        if (!order) {
            return reply.status(404).send({ message: "Order not found or access denied." });
        }

        // 2. Verify order is delivered
        if (order.status !== 'delivered') {
            return reply.status(400).send({ message: "You can only review items from delivered orders." });
        }

        // 3. Verify product was in that order
        const isProductInOrder = order.items.some(it => String(it.item || it.id) === String(productId));
        if (!isProductInOrder) {
            return reply.status(400).send({ message: "Product not found in this order." });
        }

        // 4. Create or update review
        const review = await Review.findOneAndUpdate(
            { customer: userId, product: productId, order: orderId },
            { rating, comment, createdAt: Date.now() },
            { upsert: true, new: true }
        );

        return reply.status(201).send({ message: "Review submitted successfully!", review });
    } catch (error) {
        console.error("Add Review Error:", error);
        return reply.status(500).send({ message: "Internal Server Error" });
    }
};

/**
 * ✅ 2. Get Reviews for a Product
 */
export const getProductReviews = async (req, reply) => {
    try {
        const { productId } = req.params;

        const reviews = await Review.find({ product: productId })
            .populate("customer", "name")
            .sort({ createdAt: -1 });

        const totalReviews = reviews.length;
        const avgRating = totalReviews > 0
            ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews
            : 0;

        return reply.send({
            reviews,
            avgRating: avgRating.toFixed(1),
            totalReviews
        });
    } catch (error) {
        console.error("Get Product Reviews Error:", error);
        return reply.status(500).send({ message: "Internal Server Error" });
    }
};
