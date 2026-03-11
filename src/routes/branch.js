import { getNearestBranch } from "../controllers/branch.js";
import { Branch } from "../models/index.js";
import { verifyManager } from "../middleware/auth.js";

export const branchRoutes = async (fastify) => {
  // Public — customers need nearest branch
  fastify.get("/branch/nearest", getNearestBranch);

  // Public read — safe to expose
  fastify.get("/branch/:id", async (req, reply) => {
    const branch = await Branch.findById(req.params.id);
    return reply.send({ branch });
  });

  // 🔒 Protected — only Admin/Manager can update branch GPS
  fastify.put("/branch/:id/location", { preHandler: [verifyManager] }, async (req, reply) => {
    const { latitude, longitude } = req.body;
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      { "location.latitude": latitude, "location.longitude": longitude },
      { new: true }
    );
    return reply.send({ success: true, branch });
  });

  // 🔒 Protected — only Admin/Manager can update delivery radius
  fastify.put("/branch/:id/radius", { preHandler: [verifyManager] }, async (req, reply) => {
    const { radius } = req.body;
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      { deliveryRadius: radius },
      { new: true }
    );
    return reply.send({ success: true, branch });
  });
};
