import { addReview, getProductReviews, toggleReviewVisibility, deleteReview } from "../controllers/reviewController.js";
import { verifyToken } from "../middleware/auth.js";

const reviewRoutes = async (app, options) => {
    app.post("/review", { preHandler: [verifyToken] }, addReview);
    app.get("/review/:productId", getProductReviews);
    app.patch("/review/:id/visibility", { preHandler: [verifyToken] }, toggleReviewVisibility);
    app.delete("/review/:id", { preHandler: [verifyToken] }, deleteReview);
};

export default reviewRoutes;
