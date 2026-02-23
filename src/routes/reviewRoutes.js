import { addReview, getProductReviews } from "../controllers/reviewController.js";
import { verifyToken } from "../middleware/auth.js";

const reviewRoutes = async (app, options) => {
    app.post("/review", { preHandler: [verifyToken] }, addReview);
    app.get("/review/:productId", getProductReviews);
};

export default reviewRoutes;
