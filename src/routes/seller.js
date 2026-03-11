import { getSellerOrders, getSellerWalletDetails } from "../controllers/user/sellerController.js";
import { verifyToken } from "../middleware/auth.js";

export const sellerRoutes = async (fastify, options) => {
    fastify.get("/seller/orders", { preHandler: [verifyToken] }, getSellerOrders);
    fastify.get("/seller/wallet", { preHandler: [verifyToken] }, getSellerWalletDetails);
};
