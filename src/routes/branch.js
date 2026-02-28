import { getNearestBranch } from "../controllers/branch.js";
import { Branch } from "../models/index.js";

export const branchRoutes = async (fastify) => {
  fastify.get("/branch/nearest", getNearestBranch);

  // Check branch location
  fastify.get("/branch/:id", async (req, reply) => {
    const branch = await Branch.findById(req.params.id);
    return reply.send({ branch });
  });

  // Update branch GPS location
  fastify.put("/branch/:id/location", async (req, reply) => {
    const { latitude, longitude } = req.body;
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      { "location.latitude": latitude, "location.longitude": longitude },
      { new: true }
    );
    return reply.send({ success: true, branch });
  });

  // Update branch delivery radius
  fastify.put("/branch/:id/radius", async (req, reply) => {
    const { radius } = req.body;
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      { deliveryRadius: radius },
      { new: true }
    );
    return reply.send({ success: true, branch });
  });
};
