import { getOccasions, getOccasionById } from "../controllers/product/occasion.js";

export const occasionRoutes = async (fastify, options) => {
    fastify.get("/occasions", getOccasions);
    fastify.get("/occasions/:id", getOccasionById);
};
