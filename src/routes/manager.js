import {
  assignDriverByManager,
  getSuggestedDriverEarning,
  getManagerBranches,
  getManagerCustomers,
  getManagerDrivers,
  getManagerOrders,
  getManagerOverview,
  updateOrderStatusByManager,
  getLowStockProducts,
  getInventoryStats,
  getFinanceStats,
  updateInventoryStock,
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
  createManagerBranch,
  updateManagerBranch,
  deleteManagerBranch,
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
  adjustCustomerWallet,
  adjustCustomerGreenPoints,
  getCustomerWalletHistory,
  deleteWalletTransaction,
  getSafeModeConfig,
  updateSafeModeConfig,
  deleteManagerDriver,
  createManagerDriver,
  updateManagerDriver,
  getOrderMaskingConfig,
  updateOrderMaskingConfig,
  getHighValueOrderConfig,
  updateHighValueOrderConfig,
  getHomeScreenConfig,
  updateHomeScreenConfig,
  getComponentPreviews,
  updateComponentPreview,
  sendManualNotification,
  getAssignmentTimeoutConfig,
  updateAssignmentTimeoutConfig,
  getBawalConfig,
  updateBawalConfig,
  getManagerCoupons,
  createManagerCoupon,
  updateManagerCoupon,
  deleteManagerCoupon,
  getFarmerQuotes,
  updateFarmerQuote,
  getFarmers,
  approveFarmer,
} from "../controllers/manager.js";

import { getMediaLibrary, deleteMedia, bulkDeleteMedia } from "../controllers/mediaController.js";
import { updateProfileConfig } from "../controllers/profileConfig.js";
import { getSupportConfig, updateSupportConfig } from "../controllers/support.js";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  createBulkProducts,
} from "../controllers/product/product.js";
import { handleProductExtraction } from "../controllers/managerOCR.js";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/product/category.js";
import {
  getAllSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} from "../controllers/product/subCategory.js";
import {
  getAllSuperCategories,
  createSuperCategory,
  updateSuperCategory,
  deleteSuperCategory,
} from "../controllers/product/superCategory.js";
import { getOrderById, confirmPaymentManually, rejectPaymentConfirmation } from "../controllers/order/order.js";
import { verifyManager } from "../middleware/auth.js";
import {
  getManagerGigSchedules,
  evaluateGigSchedule,
  getWeeklyGigSchedules,
} from "../controllers/gigSchedule.js";
import {
  createSlotPromotion,
  getSlotPromotions,
  deleteSlotPromotion,
  getSlotOrders
} from "../controllers/slotPromotion.js";

const AUTH = { preHandler: [verifyManager] };

export const managerRoutes = async (fastify) => {
  fastify.get("/manager/overview", AUTH, getManagerOverview);
  fastify.get("/manager/analytics", AUTH, getManagerAnalytics);
  fastify.get("/manager/orders", AUTH, getManagerOrders);
  fastify.get("/manager/orders/:orderId", AUTH, getOrderById);
  fastify.get("/manager/drivers", AUTH, getManagerDrivers);
  fastify.get("/manager/branches", AUTH, getManagerBranches);
  fastify.post("/manager/branches", AUTH, createManagerBranch);
  fastify.put("/manager/branches/:id", AUTH, updateManagerBranch);
  fastify.patch("/manager/branches/:id/status", AUTH, updateManagerBranch);
  fastify.delete("/manager/branches/:id", AUTH, deleteManagerBranch);
  fastify.get("/manager/customers", AUTH, getManagerCustomers);
  fastify.get("/manager/products", AUTH, getAllProducts);
  fastify.get("/manager/categories", AUTH, getAllCategories);
  fastify.post("/manager/categories", AUTH, createCategory);
  fastify.put("/manager/categories/:id", AUTH, updateCategory);
  fastify.delete("/manager/categories/:id", AUTH, deleteCategory);

  fastify.get("/manager/subcategories", AUTH, getAllSubCategories);
  fastify.post("/manager/subcategories", AUTH, createSubCategory);
  fastify.put("/manager/subcategories/:id", AUTH, updateSubCategory);
  fastify.delete("/manager/subcategories/:id", AUTH, deleteSubCategory);

  fastify.get("/manager/supercategories", AUTH, getAllSuperCategories);
  fastify.post("/manager/supercategories", AUTH, createSuperCategory);
  fastify.put("/manager/supercategories/:id", AUTH, updateSuperCategory);
  fastify.delete("/manager/supercategories/:id", AUTH, deleteSuperCategory);
  fastify.post("/manager/products", AUTH, createProduct);
  fastify.put("/manager/products/:id", AUTH, updateProduct);
  fastify.delete("/manager/products/:id", AUTH, deleteProduct);
  fastify.patch("/manager/products/:id/status", AUTH, updateProductStatus);
  fastify.get("/manager/orders/:orderId/suggested-driver-earning", AUTH, getSuggestedDriverEarning);
  fastify.post("/manager/orders/:orderId/assign-driver", AUTH, assignDriverByManager);
  fastify.patch("/manager/orders/:orderId/status", AUTH, updateOrderStatusByManager);
  fastify.post("/manager/orders/:orderId/confirm-payment-manually", AUTH, confirmPaymentManually);
  fastify.post("/manager/orders/:orderId/reject-payment-confirmation", AUTH, rejectPaymentConfirmation);
  fastify.get("/manager/inventory/low-stock", AUTH, getLowStockProducts);
  fastify.get("/manager/inventory/stats", AUTH, getInventoryStats);
  fastify.post("/manager/inventory/update", AUTH, updateInventoryStock);

  // Green Points Management
  fastify.get("/manager/green-points/config", AUTH, getGreenPointsConfig);
  fastify.patch("/manager/green-points/config", AUTH, updateGreenPointsConfig);
  fastify.get("/manager/green-points/stats", AUTH, getGreenPointsStats);

  // Referral Management
  fastify.get("/manager/referral/stats", AUTH, getReferralStats);
  fastify.get("/manager/referral/codes", AUTH, getAllReferralCodes);

  // Home Layout Management
  fastify.get("/manager/occasions", AUTH, getManagerOccasions);
  fastify.post("/manager/occasions", AUTH, createManagerOccasion);
  fastify.patch("/manager/occasions/:id", AUTH, updateManagerOccasion);
  fastify.delete("/manager/occasions/:id", AUTH, deleteManagerOccasion);

  fastify.get("/manager/home-components", AUTH, getManagerHomeComponents);
  fastify.post("/manager/home-components", AUTH, createManagerHomeComponent);
  fastify.patch("/manager/home-components/:id", AUTH, updateManagerHomeComponent);
  fastify.delete("/manager/home-components/:id", AUTH, deleteManagerHomeComponent);

  // Driver Financial Management
  fastify.get("/manager/driver-finance", AUTH, getManagerDriverFinance);
  fastify.get("/manager/driver-finance/:id/report", AUTH, getDriverDetailedReport);
  fastify.post("/manager/payouts/bulk", AUTH, bulkProcessPayout);
  fastify.post("/manager/drivers/:id/settle-cod", AUTH, settleDriverCod);
  fastify.patch("/manager/drivers/:id/cod-limit", AUTH, updateDriverCodLimit);
  fastify.get("/manager/config/cod-limit", AUTH, getGlobalCodLimit);
  fastify.patch("/manager/config/cod-limit", AUTH, updateGlobalCodLimit);

  fastify.get("/manager/dispatch", AUTH, getManagerDispatchOrders);
  fastify.get("/manager/driver-rankings", AUTH, getManagerDriverRankings);
  fastify.get("/manager/finance-stats", AUTH, getFinanceStats);
  fastify.get("/manager/finance-history", AUTH, getManagerFinanceHistory);
  fastify.get("/manager/driver-activity", AUTH, getManagerDriverActivity);
  fastify.post("/manager/customers/:customerId/wallet-adjustment", AUTH, adjustCustomerWallet);
  fastify.get("/manager/customers/:customerId/wallet-history", AUTH, getCustomerWalletHistory);
  fastify.delete("/manager/wallet-transactions/:transactionId", AUTH, deleteWalletTransaction);
  fastify.post("/manager/customers/:customerId/green-points-adjustment", AUTH, adjustCustomerGreenPoints);
  fastify.post("/manager/profile-config", AUTH, updateProfileConfig);
  fastify.get("/manager/safe-mode-config", AUTH, getSafeModeConfig);
  fastify.post("/manager/safe-mode-config", AUTH, updateSafeModeConfig);
  fastify.get("/manager/order-masking-config", AUTH, getOrderMaskingConfig);
  fastify.post("/manager/order-masking-config", AUTH, updateOrderMaskingConfig);
  fastify.get("/manager/assignment-timeout-config", AUTH, getAssignmentTimeoutConfig);
  fastify.post("/manager/assignment-timeout-config", AUTH, updateAssignmentTimeoutConfig);
  fastify.get("/manager/high-value-config", AUTH, getHighValueOrderConfig);
  fastify.post("/manager/high-value-config", AUTH, updateHighValueOrderConfig);
  fastify.get("/manager/home-screen-config", AUTH, getHomeScreenConfig);
  fastify.post("/manager/home-screen-config", AUTH, updateHomeScreenConfig);
  fastify.get("/manager/previews", AUTH, getComponentPreviews);
  fastify.post("/manager/previews", AUTH, updateComponentPreview);
  fastify.post("/manager/send-notification", AUTH, sendManualNotification);
  fastify.get("/manager/bawal-config", AUTH, getBawalConfig);
  fastify.post("/manager/bawal-config", AUTH, updateBawalConfig);

  // Support Contact Configuration
  fastify.get("/manager/support-config", AUTH, getSupportConfig);
  fastify.put("/manager/support-config", AUTH, updateSupportConfig);

  // Driver CRUD for Manager
  fastify.post("/manager/drivers", AUTH, createManagerDriver);
  fastify.put("/manager/drivers/:id", AUTH, updateManagerDriver);
  fastify.patch("/manager/drivers/:id/status", AUTH, updateManagerDriver);
  fastify.delete("/manager/drivers/:id", AUTH, deleteManagerDriver);

  // Media Library
  fastify.get("/manager/media", AUTH, getMediaLibrary);
  fastify.post("/manager/media/delete", AUTH, deleteMedia);
  fastify.post("/manager/media/bulk-delete", AUTH, bulkDeleteMedia);
  fastify.post("/manager/media/bulk-cleanup", AUTH, bulkDeleteMedia);

  fastify.post("/manager/bulk-products", AUTH, createBulkProducts);

  // Gig Schedules Management
  fastify.get("/manager/gig-schedules", AUTH, getManagerGigSchedules);
  fastify.get("/manager/gig-schedules/weekly", AUTH, getWeeklyGigSchedules);
  fastify.post("/manager/gig-schedules/:id/evaluate", AUTH, evaluateGigSchedule);

  // Slot Clustering Promotions
  fastify.get("/manager/slot-promotions", AUTH, getSlotPromotions);
  fastify.post("/manager/slot-promotions", AUTH, createSlotPromotion);
  fastify.delete("/manager/slot-promotions/:id", AUTH, deleteSlotPromotion);
  fastify.get("/manager/slot-orders", AUTH, getSlotOrders);

  // Coupon Management CRUD
  fastify.get("/manager/coupons", AUTH, getManagerCoupons);
  fastify.post("/manager/coupons", AUTH, createManagerCoupon);
  fastify.put("/manager/coupons/:id", AUTH, updateManagerCoupon);
  fastify.delete("/manager/coupons/:id", AUTH, deleteManagerCoupon);

  // Farmer App Quotes & Farmers
  fastify.get("/manager/farmer-quotes", AUTH, getFarmerQuotes);
  fastify.patch("/manager/farmer-quotes/:id", AUTH, updateFarmerQuote);
  fastify.get("/manager/farmers", AUTH, getFarmers);
  fastify.put("/manager/farmers/:id/approve", AUTH, approveFarmer);
};
