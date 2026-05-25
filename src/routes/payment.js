import { createRazorpayOrder, renderCheckoutWebView, createRazorpayQr, checkQrStatus } from "../controllers/payment.js";
import { verifyDeliveryPayment } from "../controllers/order/order.js";
import { verifyToken } from "../middleware/auth.js";

export const paymentRoutes = async (fastify, options) => {
  // POST /payment/razorpay-order (requires customer auth token)
  fastify.post(
    "/payment/razorpay-order",
    {
      preHandler: async (request, reply) => {
        const isAuthenticated = await verifyToken(request, reply);
        if (!isAuthenticated) {
          return reply.code(401).send({ message: "Unauthorized" });
        }
      },
    },
    createRazorpayOrder
  );

  // GET /payment/checkout-webview (public route requested by WebView container)
  fastify.get("/payment/checkout-webview", renderCheckoutWebView);

  // POST /payment/verify-delivery-payment (public verification callback for driver QR scans)
  fastify.post("/payment/verify-delivery-payment", verifyDeliveryPayment);

  // POST /payment/create-razorpay-qr (generate dynamic UPI QR link)
  fastify.post("/payment/create-razorpay-qr", createRazorpayQr);

  // GET /payment/check-qr-status (polling status check)
  fastify.get("/payment/check-qr-status", checkQrStatus);
};
