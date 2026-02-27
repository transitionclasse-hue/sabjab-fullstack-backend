import {
    confirmOrder,
    createOrder,
    getOrderById,
    getOrders,
    releaseOrderAssignment,
    updateOrderStatus,
    rejectOrder
} from "../controllers/order/order.js"; //
import { verifyToken } from "../middleware/auth.js"; //

export const orderRoutes = async (fastify, options) => {
    // Protect all routes in this file
    fastify.addHook("preHandler", async (request, reply) => {
        const isAuthenticated = await verifyToken(request, reply); //
        if (!isAuthenticated) {
            return reply.code(401).send({ message: "Unauthorized" }); //
        }
    });

    fastify.post("/order", createOrder); //
    fastify.get("/order", getOrders); //
    fastify.patch("/order/:orderId/status", updateOrderStatus); //
    fastify.patch("/order/:orderId/release-assignment", releaseOrderAssignment); //
    fastify.post("/order/:orderId/confirm", confirmOrder); //
    fastify.post("/order/:orderId/reject", rejectOrder); //
    fastify.get("/order/:orderId", getOrderById); //
};
