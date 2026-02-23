import { authRoutes } from "./auth.js";
import { orderRoutes } from "./order.js";
import { categoryRoutes, productRoutes } from "./products.js";
import { googleConfigRoutes } from "./googleConfig.js";
import { addressRoutes } from "./address.js";
import { homeLayoutRoutes } from "./homeLayout.js";
import { occasionRoutes } from "./occasion.js";
import { superCategoryRoutes } from "./supercategory.js";
import { storeStatusRoutes } from "./storeStatus.js";
import { branchRoutes } from "./branch.js";
import { pricingRoutes } from "./pricing.js";
import { managerRoutes } from "./manager.js";
import { driverRoutes } from "./driver.js";
import { configRoutes } from "./config.js";
import { wishlistRoutes } from "./wishlist.js";
import couponRoutes from "./coupon.js";
import { walletRoutes } from "./wallet.js";
import { supportRoutes } from "./support.js";
import { greenPointsRoutes } from "./greenPoints.js";
import { referralRoutes } from "./referral.js";
import reviewRoutes from "./reviewRoutes.js";
import recipeRoutes from "./recipeRoutes.js";

const prefix = "/api";

/**
 * Main Route Registry
 * This function registers all sub-routes under the global '/api' prefix.
 * It is called by the main Fastify server instance in app.js.
 */
export const registerRoutes = async (fastify) => {
  // Authentication & User Management (Login, OTP, Refresh)
  fastify.register(authRoutes, { prefix });

  fastify.register(productRoutes, { prefix });
  fastify.register(categoryRoutes, { prefix });

  // Dynamic Home Layout Engine
  fastify.register(homeLayoutRoutes, { prefix });
  fastify.register(storeStatusRoutes, { prefix });
  fastify.register(branchRoutes, { prefix });
  fastify.register(pricingRoutes, { prefix });
  fastify.register(managerRoutes, { prefix });
  fastify.register(occasionRoutes, { prefix }); // ✅ Registers dynamic holiday banners APIs
  fastify.register(superCategoryRoutes, { prefix }); // ✅ Registers dynamic SuperCategory APIs

  // Transactional Management (Orders)
  fastify.register(orderRoutes, { prefix });
  fastify.register(couponRoutes, { prefix });

  // Driver-specific (Wallet, Payouts, Bank, Stats)
  fastify.register(driverRoutes, { prefix });

  // App Config (Support contact, etc.)
  fastify.register(configRoutes, { prefix });

  // Utility & Configuration (Google Maps/Places Config)
  fastify.register(googleConfigRoutes, { prefix });

  // User Logistics (Saved Addresses)
  fastify.register(addressRoutes, { prefix });

  // User Logistics (Wishlist)
  fastify.register(wishlistRoutes, { prefix });

  // Wallet & Payments
  fastify.register(walletRoutes, { prefix });

  // Support & Chat
  fastify.register(supportRoutes, { prefix });

  // Green Points & Rewards
  fastify.register(greenPointsRoutes, { prefix });

  // Referral & Bonuses
  fastify.register(referralRoutes, { prefix });

  // Reviews & Ratings
  fastify.register(reviewRoutes, { prefix });

  // Recipes & Bookmarking
  fastify.register(recipeRoutes, { prefix });
};
