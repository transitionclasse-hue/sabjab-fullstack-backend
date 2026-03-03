import { createSuggestion, getMySuggestions, approveSuggestion } from "../controllers/suggestion.js";
import { verifyToken } from "../middleware/auth.js";

export const suggestionRoutes = async (fastify, options) => {
    // Customer routes (require token)
    fastify.post("/customer/suggest", { preHandler: [verifyToken] }, createSuggestion);
    fastify.get("/customer/suggestions", { preHandler: [verifyToken] }, getMySuggestions);

    // Manager/Admin routes (in a real app, these would be protected by manager middleware)
    fastify.get("/manager/suggestions", async (req, reply) => {
        const Suggestion = (await import("../models/suggestion.js")).default;
        const suggestions = await Suggestion.find().populate("customer", "name phone").sort({ createdAt: -1 });
        return reply.send({ success: true, suggestions });
    });
    fastify.post("/manager/suggestions/:id/approve", approveSuggestion);
};
