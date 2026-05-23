import {
  createReel,
  getReels,
  likeReel,
  viewReel,
  shareReel,
  getMyReels,
  getReelEarnings,
  followCreator,
  getReelsLeaderboard,
  getRecentPurchases,
} from "../controllers/reels.js";
import { verifyToken } from "../middleware/auth.js";

export const reelsRoutes = async (fastify, options) => {
  // Create Reel
  fastify.post("/reels", { preHandler: [verifyToken] }, createReel);

  // Get Feed of Reels
  fastify.get("/reels", getReels);

  // Toggle Like on Reel
  fastify.post("/reels/:id/like", { preHandler: [verifyToken] }, likeReel);

  // View Count Increment
  fastify.post("/reels/:id/view", viewReel);

  // Share Count Increment
  fastify.post("/reels/:id/share", shareReel);

  // Get creator's personal reels
  fastify.get("/reels/my-reels", { preHandler: [verifyToken] }, getMyReels);

  // Get creator's referral earnings dashboard stats
  fastify.get("/reels/earnings", { preHandler: [verifyToken] }, getReelEarnings);

  // Follow/Unfollow creator
  fastify.post("/reels/follow/:creatorId", { preHandler: [verifyToken] }, followCreator);

  // Get weekly leaderboard of creators
  fastify.get("/reels/leaderboard", getReelsLeaderboard);

  // Get recent purchases for live ticker
  fastify.get("/reels/recent-purchases", getRecentPurchases);
};
