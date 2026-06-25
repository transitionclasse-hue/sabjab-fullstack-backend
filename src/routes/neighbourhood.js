import { verifyToken } from "../middleware/auth.js";
import {
  getNearbyCards,
  createCard,
  replyToCard,
  reactToCard,
  resolveCard,
  deleteCard,
  getMyCards,
  getCardDetail,
} from "../controllers/neighbourhoodController.js";

/**
 * Neighbourhood Routes
 * Hyper-local community cards — all routes require authentication.
 */
export const neighbourhoodRoutes = async (fastify) => {
  // Fetch active cards near a location
  fastify.get(
    "/neighbourhood/cards",
    { preHandler: [verifyToken] },
    getNearbyCards
  );

  // Drop a new card
  fastify.post(
    "/neighbourhood/cards",
    { preHandler: [verifyToken] },
    createCard
  );

  // Get card detail
  fastify.get(
    "/neighbourhood/cards/:id",
    { preHandler: [verifyToken] },
    getCardDetail
  );

  // Reply to a card
  fastify.post(
    "/neighbourhood/cards/:id/reply",
    { preHandler: [verifyToken] },
    replyToCard
  );

  // React to a card
  fastify.post(
    "/neighbourhood/cards/:id/react",
    { preHandler: [verifyToken] },
    reactToCard
  );

  // Resolve a card (author only)
  fastify.patch(
    "/neighbourhood/cards/:id/resolve",
    { preHandler: [verifyToken] },
    resolveCard
  );

  // Delete own card
  fastify.delete(
    "/neighbourhood/cards/:id",
    { preHandler: [verifyToken] },
    deleteCard
  );

  // Fetch user's own cards
  fastify.get(
    "/neighbourhood/my-cards",
    { preHandler: [verifyToken] },
    getMyCards
  );
};
