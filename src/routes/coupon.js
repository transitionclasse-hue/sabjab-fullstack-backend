import { getActiveCoupons } from "../controllers/coupon.js";
import { verifyToken } from "../middleware/auth.js";

const couponRoutes = async (fastify, options) => {
    // Correct Path: /api/coupon/available
    fastify.get("/coupon/available", { preHandler: [verifyToken] }, getActiveCoupons);
};

export default couponRoutes;
