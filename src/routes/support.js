import { getSupportConfig, getSupportMessages, sendSupportMessage } from "../controllers/support.js";
import { verifyToken } from "../middleware/auth.js";

export const supportRoutes = async (fastify) => {
    fastify.get("/support/config", getSupportConfig); // Public or private
};
