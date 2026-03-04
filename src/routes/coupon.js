import { getActiveCoupons } from "../controllers/coupon.js";
import { verifyToken } from "../middleware/auth.js";

const couponRoutes = async (fastify, options) => {
    // Made public so guests can see offers
    fastify.get("/coupon/available", getActiveCoupons);
};

export default couponRoutes;
