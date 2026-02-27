import {
  assignDriverByManager,
  getManagerBranches,
  getManagerCustomers,
  getManagerDrivers,
  getManagerOrders,
  getManagerOverview,
  updateOrderStatusByManager,
  getGreenPointsConfig,
  updateGreenPointsConfig,
  getGreenPointsStats,
  getReferralStats,
  getAllReferralCodes,
  getManagerAnalytics,
} from "../controllers/manager.js";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
} from "../controllers/product/product.js";
import {
  getAllCategories,
} from "../controllers/product/category.js";

export const managerRoutes = async (fastify) => {
  fastify.get("/manager/overview", getManagerOverview);
  fastify.get("/manager/analytics", getManagerAnalytics);
  fastify.get("/manager/orders", getManagerOrders);
  fastify.get("/manager/drivers", getManagerDrivers);
  fastify.get("/manager/branches", getManagerBranches);
  fastify.get("/manager/customers", getManagerCustomers);
  fastify.get("/manager/products", getAllProducts);
  fastify.get("/manager/categories", getAllCategories);
  fastify.post("/manager/products", createProduct);
  fastify.put("/manager/products/:id", updateProduct);
  fastify.delete("/manager/products/:id", deleteProduct);
  fastify.patch("/manager/products/:id/status", updateProductStatus);
  fastify.post("/manager/orders/:orderId/assign-driver", assignDriverByManager);
  fastify.patch("/manager/orders/:orderId/status", updateOrderStatusByManager);

  // Green Points Management
  fastify.get("/manager/green-points/config", getGreenPointsConfig);
  fastify.patch("/manager/green-points/config", updateGreenPointsConfig);
  fastify.get("/manager/green-points/stats", getGreenPointsStats);

  // Referral Management
  fastify.get("/manager/referral/stats", getReferralStats);
  fastify.get("/manager/referral/codes", getAllReferralCodes);
};
