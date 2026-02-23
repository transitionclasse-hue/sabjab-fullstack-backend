import {
  getGreenPointsBalance,
  earnGreenPoints,
  redeemGreenPoints,
  getGreenPointsHistory,
  getGreenPointsConfig,
} from "../controllers/greenPoints.js";
import { verifyToken } from "../middleware/auth.js";

export const greenPointsRoutes = async (fastify) => {
  // Get balance
  fastify.get(
    "/green-points/balance",
    { preHandler: [verifyToken] },
    getGreenPointsBalance
  );

  // Earn points (Internal - called by other controllers)
  fastify.post(
    "/green-points/earn",
    { preHandler: [verifyToken] },
    earnGreenPoints
  );

  // Redeem points
  fastify.post(
    "/green-points/redeem",
    { preHandler: [verifyToken] },
    redeemGreenPoints
  );

  // Get history
  fastify.get(
    "/green-points/history",
    { preHandler: [verifyToken] },
    getGreenPointsHistory
  );

  // Get config (public - for frontend to show current rates)
  fastify.get("/green-points/config", getGreenPointsConfig);
};
