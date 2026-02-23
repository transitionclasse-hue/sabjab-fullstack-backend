import { getStoreStatus, updateStoreStatus } from "../controllers/storeStatus.js";

export const storeStatusRoutes = async (fastify) => {
  fastify.get("/store-status", getStoreStatus);
  fastify.put("/store-status", updateStoreStatus);
};
