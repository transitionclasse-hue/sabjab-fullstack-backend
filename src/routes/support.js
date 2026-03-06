import { getSupportConfig, getSupportMessages, sendSupportMessage } from "../controllers/support.js";
import { verifyToken } from "../middleware/auth.js";

export const supportRoutes = async (fastify) => {
    fastify.get("/support/config", getSupportConfig); // Public or private
    fastify.get("/support/messages", { preHandler: [verifyToken] }, getSupportMessages);
    fastify.post("/support/messages", { preHandler: [verifyToken] }, sendSupportMessage);
};
