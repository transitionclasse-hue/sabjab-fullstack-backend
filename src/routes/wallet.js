import { getWalletBalance, getWalletTransactions } from "../controllers/wallet.js";
import { verifyToken } from "../middleware/auth.js";

export const walletRoutes = async (fastify) => {
    fastify.get("/wallet/balance", { preHandler: [verifyToken] }, getWalletBalance);
    fastify.get("/wallet/transactions", { preHandler: [verifyToken] }, getWalletTransactions);
};
