import {
  generateReferralCode,
  getReferralInfo,
  applyReferralCode,
  getReferralStats,
} from "../controllers/referral.js";
import { verifyToken } from "../middleware/auth.js";

export const referralRoutes = async (fastify) => {
  // Generate referral code
  fastify.post(
    "/referral/generate",
    { preHandler: [verifyToken] },
    generateReferralCode
  );

  // Get referral info
  fastify.get(
    "/referral/info",
    { preHandler: [verifyToken] },
    getReferralInfo
  );

  // Apply referral code (signup)
  fastify.post("/referral/apply", applyReferralCode);

  // Get referral stats
  fastify.get(
    "/referral/stats",
    { preHandler: [verifyToken] },
    getReferralStats
  );
};
