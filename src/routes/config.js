export const configRoutes = async (fastify) => {
  fastify.get("/config/support", async (req, reply) => {
    return reply.send({
      phone: process.env.SUPPORT_PHONE || "+911234567890",
      email: process.env.SUPPORT_EMAIL || "support@sabjab.com",
    });
  });
};
