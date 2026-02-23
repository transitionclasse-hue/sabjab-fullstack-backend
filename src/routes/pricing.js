import { estimatePricing, getPricingConfig, updatePricingConfig } from "../controllers/pricing.js";

export const pricingRoutes = async (fastify) => {
  fastify.get("/pricing-config", getPricingConfig);
  fastify.put("/pricing-config", updatePricingConfig);
  fastify.post("/pricing-estimate", estimatePricing);
};
