import Review from "../models/review.js";
import Order from "../models/order.js";
import Product from "../models/products.js";

/**
 * ✅ 1. Add/Update Review
 */
export const addReview = async (req, reply) => {
    try {
        const { productId, orderId, rating, comment } = req.body;
        const userId = req.user.userId;

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

        // Fetch only visible reviews (or those where isVisible is true / not officially false)
        const reviews = await Review.find({ product: productId, isVisible: { $ne: false } })
            .populate("customer", "name")
            .sort({ createdAt: -1 });

        const totalReviews = reviews.length;
        const avgRating = totalReviews > 0
            ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews
            : 0;

        // Calculate distribution for Amazon-style progress bars
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(r => {
            if (distribution[r.rating] !== undefined) {
                distribution[r.rating]++;
            }
        });

        // Convert the map to an array of objects for the frontend
        const starDistribution = Object.keys(distribution).reverse().map(star => {
            const count = distribution[star];
            return {
                star: Number(star),
                count,
                percentage: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
            };
        });

        return reply.send({
            reviews,
            avgRating: avgRating.toFixed(1),
            totalReviews,
            starDistribution
        });
    } catch (error) {
        console.error("Get Product Reviews Error:", error);
        return reply.status(500).send({ message: "Internal Server Error" });
    }
};

/**
 * ✅ 3. Toggle Review Visibility (Admin)
 */
export const toggleReviewVisibility = async (req, reply) => {
    try {
        const { id } = req.params;
        const review = await Review.findById(id);

        if (!review) {
            return reply.status(404).send({ message: "Review not found." });
        }

        // Default to true if somehow undefined
        const currentVisibility = review.isVisible !== undefined ? review.isVisible : true;
        review.isVisible = !currentVisibility;

        await review.save();

        return reply.send({ message: `Review visibility set to ${review.isVisible}`, review });
    } catch (error) {
        console.error("Toggle Review Visibility Error:", error);
        return reply.status(500).send({ message: "Internal Server Error" });
    }
};

/**
 * ✅ 4. Delete Review (Admin)
 */
export const deleteReview = async (req, reply) => {
    try {
        const { id } = req.params;
        const review = await Review.findByIdAndDelete(id);

        if (!review) {
            return reply.status(404).send({ message: "Review not found." });
        }

        return reply.send({ message: "Review deleted successfully" });
    } catch (error) {
        console.error("Delete Review Error:", error);
        return reply.status(500).send({ message: "Internal Server Error" });
    }
};
