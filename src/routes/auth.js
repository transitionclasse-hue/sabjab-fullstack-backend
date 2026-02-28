import {
    requestEmailOtp,
    verifyOtp,
    loginDeliveryPartner,
    loginAdmin,
    refreshToken,
    fetchUser,
    checkPhone,
    loginPassword,
    updateCustomerProfile,
    deleteCustomerAccount
} from "../controllers/auth/auth.js";
import { verifyToken } from "../middleware/auth.js";

export const authRoutes = async (fastify) => {
    // Customer Endpoints
    fastify.post("/customer/request-otp", requestEmailOtp);
    fastify.post("/customer/verify-otp", verifyOtp);
    fastify.post("/customer/check-phone", checkPhone);
    fastify.post("/customer/login-password", loginPassword);

    // Delivery Partner Endpoint
    fastify.post("/delivery/login", loginDeliveryPartner);
    fastify.post("/auth/login", loginAdmin); // For Manager App
    fastify.put("/admin/push-token", { preHandler: [verifyToken] }, (await import("../controllers/auth/auth.js")).updateAdminPushToken); // Dynamic import to avoid circular if needed or just add to import list

    // System Endpoints
    fastify.post("/customer/refresh-token", refreshToken);
    fastify.get("/customer/me", { preHandler: [verifyToken] }, fetchUser);
    fastify.put("/customer/update-profile", { preHandler: [verifyToken] }, updateCustomerProfile);
    fastify.delete("/customer/delete-account", { preHandler: [verifyToken] }, deleteCustomerAccount);

    fastify.get("/debug/drivers", async (req, reply) => {
        const { DeliveryPartner } = await import("../models/user.js");
        const drivers = await DeliveryPartner.find({});
        return reply.send({ count: drivers.length, drivers });
    });
};
