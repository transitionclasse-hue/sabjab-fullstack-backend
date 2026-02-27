import {
  getWalletStats,
  getPayouts,
  getBankAccount,
  updateBankAccount,
  getDriverStats,
  getCodStatus,
  updatePushToken,
  updateNotificationSettings,
  toggleOnlineStatus,
} from "../controllers/driver.js";
import { verifyToken } from "../middleware/auth.js";

export const driverRoutes = async (fastify) => {
  fastify.addHook("preHandler", async (request, reply) => {
    const isAuthenticated = await verifyToken(request, reply);
    if (!isAuthenticated) return reply.code(401).send({ message: "Unauthorized" });
    if (request.user?.role !== "DeliveryPartner") {
      return reply.code(403).send({ message: "Driver access only" });
    }
  });

  fastify.get("/driver/wallet", getWalletStats);
  fastify.get("/driver/payouts", getPayouts);
  fastify.get("/driver/bank", getBankAccount);
  fastify.put("/driver/bank", updateBankAccount);
  fastify.get("/driver/stats", getDriverStats);
  fastify.get("/driver/cod", getCodStatus);
  fastify.put("/driver/update-push-token", updatePushToken);
  fastify.put("/driver/notification-settings", updateNotificationSettings);
  fastify.put("/driver/toggle-online", toggleOnlineStatus);
};
