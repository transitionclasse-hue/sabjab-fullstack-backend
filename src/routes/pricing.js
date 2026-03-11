import { estimatePricing, getPricingConfig, updatePricingConfig } from "../controllers/pricing.js";
import { verifyManager } from "../middleware/auth.js";

export const pricingRoutes = async (fastify) => {
  fastify.get("/pricing-config", getPricingConfig); // Public — apps need this
  fastify.put("/pricing-config", { preHandler: [verifyManager] }, updatePricingConfig); // 🔒 Protected
  fastify.post("/pricing-estimate", estimatePricing); // Public — checkout needs this
};
