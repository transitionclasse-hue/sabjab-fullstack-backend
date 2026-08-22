import {
  getClassifiedAds,
  getMyClassifiedAds,
  getClassifiedAdById,
  createClassifiedAd,
  updateClassifiedAd,
  deleteClassifiedAd,
  getClassifiedsStats,
} from "../controllers/classifiedAdController.js";

export const classifiedAdRoutes = async (fastify) => {
  fastify.get("/classifieds", getClassifiedAds);
  fastify.get("/classifieds/my-ads", getMyClassifiedAds);
  fastify.get("/classifieds/stats", getClassifiedsStats);
  fastify.get("/classifieds/:id", getClassifiedAdById);
  fastify.post("/classifieds", createClassifiedAd);
  fastify.put("/classifieds/:id", updateClassifiedAd);
  fastify.delete("/classifieds/:id", deleteClassifiedAd);
};
