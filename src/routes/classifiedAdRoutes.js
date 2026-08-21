import {
  getClassifiedAds,
  getClassifiedAdById,
  createClassifiedAd,
} from "../controllers/classifiedAdController.js";

export const classifiedAdRoutes = async (fastify) => {
  fastify.get("/classifieds", getClassifiedAds);
  fastify.get("/classifieds/:id", getClassifiedAdById);
  fastify.post("/classifieds", createClassifiedAd);
};
