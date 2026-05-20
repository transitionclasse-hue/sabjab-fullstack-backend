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
    deleteCustomerAccount,
    updateAdminProfile,
    updateAdminPushToken,
    requestDriverOtp,
    verifyDriverOtp,
    registerDriverDetails,
    updateDriverProfile,
    checkDriverPhone
} from "../controllers/auth/auth.js";
import { verifyToken, verifyDeliveryPartner } from "../middleware/auth.js";
import {
    registerSeller,
    loginSeller,
    getSellerProfile,
    getPendingSellers,
    approveSeller,
    updateSellerProfile
} from "../controllers/auth/sellerAuth.js";

export const authRoutes = async (fastify) => {
    // Customer Endpoints
    fastify.post("/customer/request-otp", requestEmailOtp);
    fastify.post("/customer/verify-otp", verifyOtp);
    fastify.post("/customer/check-phone", checkPhone);
    fastify.post("/customer/login-password", loginPassword);

    fastify.post("/delivery/login", loginDeliveryPartner);
    fastify.post("/delivery/request-otp", requestDriverOtp);
    fastify.post("/delivery/verify-otp", verifyDriverOtp);
    fastify.post("/delivery/register-details", registerDriverDetails);
    fastify.post("/delivery/check-phone", checkDriverPhone);
    fastify.put("/delivery/update-profile", { preHandler: [verifyToken, verifyDeliveryPartner] }, updateDriverProfile);
    
    fastify.post("/auth/login", loginAdmin); // For Manager App
    fastify.put("/auth/profile", { preHandler: [verifyToken] }, updateAdminProfile);
    fastify.put("/admin/push-token", { preHandler: [verifyToken] }, updateAdminPushToken);

    // Seller Endpoints
    fastify.post("/seller/register", registerSeller);
    fastify.post("/seller/login", loginSeller);
    fastify.get("/seller/profile", { preHandler: [verifyToken] }, getSellerProfile);
    fastify.put("/seller/profile", { preHandler: [verifyToken] }, updateSellerProfile);
    fastify.get("/admin/sellers/pending", { preHandler: [verifyToken] }, getPendingSellers);
    fastify.put("/admin/sellers/:id/approve", { preHandler: [verifyToken] }, approveSeller);

    // System Endpoints
    fastify.post("/customer/refresh-token", refreshToken);
    fastify.get("/customer/me", { preHandler: [verifyToken] }, fetchUser);
    fastify.put("/customer/update-profile", { preHandler: [verifyToken] }, updateCustomerProfile);
    fastify.delete("/customer/delete-account", { preHandler: [verifyToken] }, deleteCustomerAccount);

};
