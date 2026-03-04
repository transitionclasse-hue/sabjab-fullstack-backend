import { createTicket, getUserTickets, getTicketDetails, replyToTicket } from "../controllers/ticket.js";
import { verifyToken } from "../middleware/auth.js";

export const ticketRoutes = async (fastify) => {
    // All ticket routes require authentication
    fastify.addHook("preHandler", verifyToken);

    fastify.post("/tickets", createTicket);
    fastify.get("/tickets", getUserTickets);
    fastify.get("/tickets/:ticketId", getTicketDetails);
    fastify.post("/tickets/:ticketId/reply", replyToTicket);
};
