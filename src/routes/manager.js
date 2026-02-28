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
  getManagerOccasions,
  createManagerOccasion,
  updateManagerOccasion,
  deleteManagerOccasion,
  createManagerHomeComponent,
  updateManagerHomeComponent,
  deleteManagerHomeComponent,
  getManagerHomeComponents,
  getManagerDriverFinance,
  settleDriverCod,
  bulkProcessPayout,
  getDriverDetailedReport,
  getManagerDispatchOrders,
  getManagerDriverRankings,
  getManagerFinanceHistory,
  getManagerDriverActivity,
  updateDriverCodLimit,
  getGlobalCodLimit,
  updateGlobalCodLimit,
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
import { getAllSubCategories } from "../controllers/product/subCategory.js";
import { getAllSuperCategories } from "../controllers/product/superCategory.js";
import { getOrderById } from "../controllers/order/order.js";

export const managerRoutes = async (fastify) => {
  fastify.get("/manager/overview", getManagerOverview);
  fastify.get("/manager/analytics", getManagerAnalytics);
  fastify.get("/manager/orders", getManagerOrders);
  fastify.get("/manager/orders/:orderId", getOrderById);
  fastify.get("/manager/drivers", getManagerDrivers);
  fastify.get("/manager/branches", getManagerBranches);
  fastify.get("/manager/customers", getManagerCustomers);
  fastify.get("/manager/products", getAllProducts);
  fastify.get("/manager/categories", getAllCategories);
  fastify.get("/manager/subcategories", getAllSubCategories);
  fastify.get("/manager/supercategories", getAllSuperCategories);
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

  // Home Layout Management
  fastify.get("/manager/occasions", getManagerOccasions);
  fastify.post("/manager/occasions", createManagerOccasion);
  fastify.patch("/manager/occasions/:id", updateManagerOccasion);
  fastify.delete("/manager/occasions/:id", deleteManagerOccasion);

  fastify.get("/manager/home-components", getManagerHomeComponents);
  fastify.post("/manager/home-components", createManagerHomeComponent);
  fastify.patch("/manager/home-components/:id", updateManagerHomeComponent);
  fastify.delete("/manager/home-components/:id", deleteManagerHomeComponent);

  // Driver Financial Management
  fastify.get("/manager/driver-finance", getManagerDriverFinance);
  fastify.get("/manager/driver-finance/:id/report", getDriverDetailedReport);
  fastify.post("/manager/payouts/bulk", bulkProcessPayout);
  fastify.post("/manager/drivers/:id/settle-cod", settleDriverCod);
  fastify.patch("/manager/drivers/:id/cod-limit", updateDriverCodLimit);
  fastify.get("/manager/config/cod-limit", getGlobalCodLimit);
  fastify.patch("/manager/config/cod-limit", updateGlobalCodLimit);

  fastify.get("/manager/dispatch", getManagerDispatchOrders);
  fastify.get("/manager/driver-rankings", getManagerDriverRankings);
  fastify.get("/manager/finance-history", getManagerFinanceHistory);
  fastify.get("/manager/driver-activity", getManagerDriverActivity);
};
