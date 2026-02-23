import { toggleWishlist, getWishlist } from "../controllers/user/wishlist.js";
import { verifyToken } from "../middleware/auth.js";

export const wishlistRoutes = async (fastify, options) => {
    // Prefix: /api/wishlist
    fastify.addHook("preHandler", async (request, reply) => {
        try {
            await verifyToken(request, reply);
        } catch (err) {
            return reply.code(401).send({ message: "Authentication required" });
        }
    });

    fastify.get("/wishlist", getWishlist);
    fastify.post("/wishlist/toggle", toggleWishlist);
};
