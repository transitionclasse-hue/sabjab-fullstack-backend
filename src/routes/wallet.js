import { getWalletBalance, getWalletTransactions, getSabjabCoinsBalance, redeemSabjabCoins } from "../controllers/wallet.js";
import { verifyToken } from "../middleware/auth.js";

export const walletRoutes = async (fastify) => {
    fastify.get("/wallet/balance", { preHandler: [verifyToken] }, getWalletBalance);
    fastify.get("/wallet/transactions", { preHandler: [verifyToken] }, getWalletTransactions);
    
    fastify.get("/sabjab-coins/balance", { preHandler: [verifyToken] }, getSabjabCoinsBalance);
    fastify.post("/sabjab-coins/redeem", { preHandler: [verifyToken] }, redeemSabjabCoins);
};
