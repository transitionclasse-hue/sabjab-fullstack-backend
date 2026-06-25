import {
  getGreenPointsBalance,
  earnGreenPoints,
  redeemGreenPoints,
  getGreenPointsHistory,
  getGreenPointsConfig,
} from "../controllers/greenPoints.js";
import {
  createScrapRequest,
  getScrapRequests,
  cancelScrapRequest,
  updateScrapRequestStatus,
  getAllScrapRequests,
} from "../controllers/scrapRequest.js";
import { verifyToken, verifyManager } from "../middleware/auth.js";

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

  // --- SCRAP COLLECTION MINI APP ENDPOINTS ---
  // Create pickup request
  fastify.post(
    "/green-points/scrap-requests",
    { preHandler: [verifyToken] },
    createScrapRequest
  );

  // Get customer's requests
  fastify.get(
    "/green-points/scrap-requests",
    { preHandler: [verifyToken] },
    getScrapRequests
  );

  // Cancel request
  fastify.put(
    "/green-points/scrap-requests/:id/cancel",
    { preHandler: [verifyToken] },
    cancelScrapRequest
  );

  // --- MANAGER / ADMIN ENDPOINTS ---
  // Get all requests across the system
  fastify.get(
    "/manager/scrap-requests",
    { preHandler: [verifyManager] },
    getAllScrapRequests
  );

  // Update status (Admin/Manager utility)
  fastify.put(
    "/manager/scrap-requests/:id/status",
    { preHandler: [verifyManager] },
    updateScrapRequestStatus
  );
};
