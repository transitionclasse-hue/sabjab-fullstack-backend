import {
  createSplitRequest,
  getSplitRequests,
  respondToSplit,
} from "../controllers/splitBill.js";
import { verifyToken } from "../middleware/auth.js";

export const splitBillRoutes = async (fastify) => {
  fastify.post(
    "/split-bill/request",
    { preHandler: [verifyToken] },
    createSplitRequest
  );

  fastify.get(
    "/split-bill/requests",
    { preHandler: [verifyToken] },
    getSplitRequests
  );

  fastify.post(
    "/split-bill/respond",
    { preHandler: [verifyToken] },
    respondToSplit
  );
};
