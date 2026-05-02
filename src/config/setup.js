import AdminJS, { ComponentLoader } from "adminjs";
import AdminJSFastify from "@adminjs/fastify";
import * as AdminJSMongoose from "@adminjs/mongoose";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import uploadFeature from "@adminjs/upload";
import { CloudinaryProvider } from "./uploadProvider.js";
import { authenticate } from "./config.js";
import { sendPushNotification, broadcastPushNotification } from "../utils/notification.js";
import ProfileConfig from "../models/profileConfig.js";
import GlobalConfig from "../models/globalConfig.js";
import fs from "fs";

function logToFile(message) {
  try {
    const timestamp = new Date().toISOString();
    fs.appendFileSync('cloudinary_debug.log', `[${timestamp}] ${message}\n`);
  } catch (e) { }
}

const sanitizeFilename = (filename) => {
  if (!filename) return `file_${Date.now()}`;
  return filename
    .replace(/[^a-z0-9.]/gi, '_') // Replace non-alphanumeric with underscore
    .replace(/_{2,}/g, '_')      // Replace multiple underscores
    .toLowerCase();
};

const afterSuggestionEdit = async (response, request, context) => {
  const { record } = context;
  const Suggestion = mongoose.models.Suggestion;
  const Customer = mongoose.models.Customer;
  const WalletTransaction = mongoose.models.WalletTransaction;

  if (request.method !== 'post') return response;

  const sugId = record.params._id;
  const sug = await Suggestion.findById(sugId);

  if (sug && sug.rewardCoins > 0 && !sug.rewardSent && (sug.status === 'reviewed' || sug.status === 'added')) {
    const customer = await Customer.findById(sug.customer);
    if (customer) {
      customer.walletBalance += Number(sug.rewardCoins);
      await customer.save();

      const txn = new WalletTransaction({
        customer: sug.customer,
        amount: Number(sug.rewardCoins),
        type: "credit",
        txnType: "manual_adjustment",
        description: `Reward for suggesting brand: ${sug.brandName} (via Admin Panel)`,
        status: "completed",
      });
      await txn.save();

      sug.rewardSent = true;
      await sug.save();
      
      // Update the record in context to show rewardSent as true
      if (response.record && response.record.params) {
        response.record.params.rewardSent = true;
      }
    }
  }
  return response;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

AdminJS.registerAdapter(AdminJSMongoose);

const componentLoader = new ComponentLoader();

// Register custom components
const Components = {
  FilteredCategory: componentLoader.add('FilteredCategory', path.join(__dirname, '../components/FilteredCategory.jsx')),
  FilteredSubCategory: componentLoader.add('FilteredSubCategory', path.join(__dirname, '../components/FilteredSubCategory.jsx')),
  SupportReply: componentLoader.add('SupportReply', path.join(__dirname, '../components/SupportReply.jsx')),
  SupportDashboard: componentLoader.add('SupportDashboard', path.join(__dirname, '../components/SupportDashboard.jsx')),
  SendNotification: componentLoader.add('SendNotification', path.join(__dirname, '../components/SendNotification.jsx')),
  Dashboard: componentLoader.add('Dashboard', path.join(__dirname, '../components/Dashboard.jsx')),
  AssignDriver: componentLoader.add('AssignDriverComponent', path.join(__dirname, '../components/AssignDriver.jsx')),
  OrderStatus: componentLoader.add('OrderStatusBadge', path.join(__dirname, '../components/OrderStatusBadge.jsx')),
  DriverStatus: componentLoader.add('DriverStatusBadge', path.join(__dirname, '../components/DriverStatusBadge.jsx')),
  ComponentGuide: componentLoader.add('ComponentGuide', path.join(__dirname, '../components/ComponentGuide.jsx')),
};

const hydrateOrderForTracking = async (orderId) => {
  const Order = mongoose.models.Order;
  return Order.findById(orderId).populate("deliveryPartner customer branch items.item");
};

const assignDriverToOrder = async (order, driver, driverEarning = null) => {
  if (!order || !driver) return null;

  order.deliveryPartner = driver._id;
  // Always update status and reset timer on assignment/re-assignment
  order.status = "assigned";
  order.assignedAt = new Date();

  // Set explicit earning if provided, otherwise calculate
  if (driverEarning !== null && driverEarning !== undefined && driverEarning !== "") {
    order.driverEarning = Number(driverEarning);
  } else if (!order.driverEarning) {
    try {
      const PricingConfig = mongoose.models.PricingConfig;
      const config = await PricingConfig.findOne({ key: "primary" });
      const baseFee = config?.baseDeliveryFee ?? 20;
      const freeThreshold = config?.freeDeliveryThreshold ?? 199;
      const freeEnabled = config?.freeDeliveryEnabled ?? true;
      const itemsTotal = order.totalPrice || 0;
      order.driverEarning = freeEnabled && itemsTotal >= freeThreshold ? 0 : baseFee;
    } catch (e) {
      order.driverEarning = 20; // Fallback
    }
  }

  const lat = driver.liveLocation?.latitude ?? order.pickupLocation?.latitude;
  const lng = driver.liveLocation?.longitude ?? order.pickupLocation?.longitude;
  order.deliveryPersonLocation = {
    latitude: lat,
    longitude: lng,
    address: "Assigned from admin panel",
  };

  await order.save();
  return hydrateOrderForTracking(order._id);
};

const afterEditOrderHook = async (originalResponse, request, context, app) => {
  if (request.method !== "post") return originalResponse;

  const orderId = originalResponse?.record?.params?._id;
  if (!orderId) return originalResponse;

  const Order = mongoose.models.Order;
  const DeliveryPartner = mongoose.models.DeliveryPartner;
  const dbOrder = await Order.findById(orderId);
  if (!dbOrder) return originalResponse;

  let changed = false;
  if (dbOrder.deliveryPartner) {
    const driver = await DeliveryPartner.findById(dbOrder.deliveryPartner);
    if (driver) {
      const hasLiveCoords =
        Number.isFinite(dbOrder.deliveryPersonLocation?.latitude) &&
        Number.isFinite(dbOrder.deliveryPersonLocation?.longitude);

      if (!hasLiveCoords) {
        dbOrder.deliveryPersonLocation = {
          latitude: driver.liveLocation?.latitude ?? dbOrder.pickupLocation?.latitude,
          longitude: driver.liveLocation?.longitude ?? dbOrder.pickupLocation?.longitude,
          address: "Assigned from admin edit",
        };
        changed = true;
      }

      if (dbOrder.status === "available" || dbOrder.isModified('deliveryPartner')) {
        dbOrder.status = "assigned";
        dbOrder.assignedAt = new Date();
        changed = true;
      }
    }
  }

  if (changed) {
    await dbOrder.save();
    context.record.params.status = dbOrder.status; // Sync for AdminJS response
  }

  const populatedOrder = await hydrateOrderForTracking(orderId);
  if (app.io && populatedOrder) {
    app.io.to(String(populatedOrder._id)).emit("liveTrackingUpdates", {
      ...populatedOrder.toObject(),
      deliveryPartnerName: populatedOrder.deliveryPartner?.name || "Delivery Partner",
    });
    app.io.emit("admin:order-status-update", {
      orderId: String(populatedOrder._id),
      status: populatedOrder.status,
      orderNumber: populatedOrder.orderId,
    });
    // Notify the specific driver mobile app
    if (populatedOrder.deliveryPartner?._id) {
      console.log(`📡 [Socket] Emitting driver:order-status-update (edit) to driver ${populatedOrder.deliveryPartner._id}`);
      app.io.to(String(populatedOrder.deliveryPartner._id)).emit("driver:order-status-update", {
        orderId: String(populatedOrder._id),
        status: populatedOrder.status,
        order: populatedOrder,
        orderNumber: populatedOrder.orderId,
      });
    }
  }

  return originalResponse;
};

export async function buildAdminRouter(app) {
  // Create admin user if not exists
  if (mongoose.models.Admin) {
    const existingAdmin = await mongoose.models.Admin.findOne({ email: 'admin@sabjab.com' });
    if (!existingAdmin) {
      const admin = new mongoose.models.Admin({
        email: 'admin@sabjab.com',
        password: 'admin123',
        role: 'Admin',
        isActivated: true
      });
      await admin.save();
      console.log('✅ Admin user created: admin@sabjab.com / admin123');
    }
  }

  if (mongoose.models.StoreStatus) {
    await mongoose.models.StoreStatus.findOneAndUpdate(
      { key: "primary" },
      {
        $setOnInsert: {
          key: "primary",
          mode: "schedule",
          openingTime: "09:00",
          closingTime: "22:00",
          alertBeforeMinutes: 30,
          note: "",
        },
      },
      { upsert: true, new: true }
    );
  }

  if (mongoose.models.PricingConfig) {
    await mongoose.models.PricingConfig.findOneAndUpdate(
      { key: "primary" },
      {
        $setOnInsert: {
          key: "primary",
          freeDeliveryEnabled: true,
          freeDeliveryThreshold: 199,
          baseDeliveryFee: 20,
          promiseProtectEnabled: false,
          promiseProtectFee: 0,
          smallCartFeeEnabled: false,
          smallCartThreshold: 99,
          smallCartFee: 0,
          rainSurgeEnabled: false,
          rainSurgeFee: 0,
          lateNightFeeEnabled: false,
          lateNightStartTime: "23:00",
          lateNightEndTime: "05:00",
          lateNightFee: 0,
          customFees: [],
        },
      },
      { upsert: true, new: true }
    );
  }

  if (mongoose.models.GlobalConfig) {
    await mongoose.models.GlobalConfig.findOneAndUpdate(
      { key: "support_contact" },
      {
        $set: {
          description: "Support contact details. Expected: { phone, email }"
        },
        $setOnInsert: {
          key: "support_contact",
          value: {
            phone: "+911234567890",
            email: "help@sabjab.com"
          },
        },
      },
      { upsert: true, new: true }
    );

    await mongoose.models.GlobalConfig.findOneAndUpdate(
      { key: "safe_mode_config" },
      {
        $set: {
          description: "Emergency Controls for Native Apps. Expected: { isWebViewMode: boolean, webViewUrl: string }"
        },
        $setOnInsert: {
          key: "safe_mode_config",
          value: {
            isWebViewMode: false,
            webViewUrl: "https://sabjab.com"
          },
        }
      },
      { upsert: true, new: true }
    );

    // ✅ Seed Special Occasion ID if not exists (for header banner)
    const Occasion = mongoose.models.Occasion;
    const ramadan = await Occasion.findOne({ name: "Ramadan Specials" });
    const diwali = await Occasion.findOne({ name: /Diwali/i });
    const activeOccasion = ramadan || diwali;

    if (activeOccasion) {
      await mongoose.models.GlobalConfig.findOneAndUpdate(
        { key: "header_special_occasion" },
        {
          $set: {
            description: "Special Occasion displayed in home header. Expected: MongoDB ObjectID String"
          },
          $setOnInsert: {
            key: "header_special_occasion",
            value: activeOccasion._id,
          }
        },
        { upsert: true, new: true }
      );
    }

    // ✅ Seed App Version Config if not exists
    await mongoose.models.GlobalConfig.findOneAndUpdate(
      { key: "app_version_config" },
      {
        $setOnInsert: {
          key: "app_version_config",
          value: {
            currentVersion: "1.0.0",
            updateAvailable: false,
            updateMessage: "New version is ready to update!",
            isMandatory: false
          },
          description: "Controls app versioning. Expected: { currentVersion, updateAvailable, updateMessage, isMandatory }"
        }
      },
      { upsert: true, new: true }
    );

    // ✅ Seed Order Masking Config if not exists
    await mongoose.models.GlobalConfig.findOneAndUpdate(
      { key: "order_masking_config" },
      {
        $set: {
            description: "Mask customer phone numbers from drivers. If enabled, drivers see the proxyNumber instead. Expected: { maskCustomerNumber: boolean, proxyNumber: string }"
        },
        $setOnInsert: {
          key: "order_masking_config",
          value: {
            maskCustomerNumber: false,
            proxyNumber: "+911234567890" // Default support number
          }
        }
      },
      { upsert: true, new: true }
    );

    // ✅ Seed High Value Order Config if not exists
    await mongoose.models.GlobalConfig.findOneAndUpdate(
      { key: "high_value_order_config" },
      {
        $set: {
            description: "Manage security for high-value orders. If order value > threshold, OTP is mandatory. Expected: { enabled: boolean, threshold: number }"
        },
        $setOnInsert: {
          key: "high_value_order_config",
          value: {
            enabled: true,
            threshold: 1000
          }
        }
      },
      { upsert: true, new: true }
    );

    // ✅ Seed Active Home Screen Config if not exists
    await mongoose.models.GlobalConfig.findOneAndUpdate(
      { key: "active_home_screen" },
      {
        $set: {
            description: "Toggle between different Home Screen versions. Options: 'HomeScreen' (Original), 'PremiumHomeScreen' (Blinkit Style)"
        },
        $setOnInsert: {
          key: "active_home_screen",
          value: "HomeScreen"
        }
      },
      { upsert: true, new: true }
    );
  }


  console.log("🛠️ Building Admin Router... Models found:", Object.keys(mongoose.models).length);
  const resources = Object.values(mongoose.models).map((model) => {
    console.log("📍 Registering model:", model.modelName);
    if (model.modelName === "GlobalConfig") {
      return {
        resource: model,
        options: {
          navigation: { name: "System Config", icon: "Settings" },
          label: "Global Settings",
          listProperties: ["key", "value", "description"],
          editProperties: ["key", "value", "description"],
          properties: {
            value: {
              type: 'mixed',
              description: 'JSON Configuration. Safe Mode: {"isWebViewMode": bool, "webViewUrl": "string"}. Update: {"currentVersion": "1.0.0", "updateAvailable": bool}. Support: {"phone": "...", "email": "..."}',
            },
            key: { isId: true, isReadOnly: true },
            description: { type: 'textarea' }
          }
        },
      };
    }

    if (model.modelName === "ProfileConfig") {
      return {
        resource: model,
        options: {
          navigation: { name: "System Config", icon: "Settings" },
          label: "Profile Page Controls",
          listProperties: ["_id", "isActive", "isPreferencesVisible", "isActivityVisible"],
          editProperties: [
            "isActive",
            "isQuickActionsVisible",
            "isPreferencesVisible", 
            "isActivityVisible", 
            "isCoinsVisible", 
            "isEducationVisible", 
            "isDiscoverVisible", 
            "isEngageVisible", 
            "isInsightsVisible", 
            "isSupportVisible", 
            "isVersionVisible",
            "backgroundColor", "onBackgroundTextColor", "accentColor",
            "backgroundDarkColor", "onBackgroundTextDarkColor", "accentDarkColor"
          ],
          properties: {
            isEducationVisible: { label: "Visible: ClassMadad (Education)" },
            isQuickActionsVisible: { label: "Visible: Quick Actions (Wallet, Orders, Support)" },
            isPreferencesVisible: { label: "Visible: Preferences (Theme, Sensitive Mode)" },
            isActivityVisible: { label: "Visible: My Activity (History, Wishlist)" },
            isCoinsVisible: { label: "Visible: SabJab Coins & Benefits" },
            isDiscoverVisible: { label: "Visible: Discover (Home Services)" },
            isEngageVisible: { label: "Visible: Engage (Games, Recipes, Reminders)" },
            isInsightsVisible: { label: "Visible: Insights (Spending Analysis)" },
            isSupportVisible: { label: "Visible: Support & Legal" },
            isVersionVisible: { label: "Visible: Version Info" },
            
            backgroundColor: { label: "Background color (Light Mode)" },
            onBackgroundTextColor: { label: "Text color (Light Mode)" },
            accentColor: { label: "Accent color (Light Mode)" },
            backgroundDarkColor: { label: "Background color (Dark Mode)" },
            onBackgroundTextDarkColor: { label: "Text color (Dark Mode)" },
            accentDarkColor: { label: "Accent color (Dark Mode)" },
          }
        }
      };
    }
    if (model.modelName === "Seller") {
      return {
        resource: model,
        options: {
          navigation: { name: "Users & Partners", icon: "Store" },
          sort: { sortBy: 'createdAt', direction: 'desc' },
          listProperties: ["businessName", "name", "email", "phone", "isApproved"],
          editProperties: ["businessName", "name", "email", "password", "phone", "businessAddress", "gstNumber", "bankAccount.bankName", "bankAccount.accountNumber", "bankAccount.ifsc", "isApproved"],
          showProperties: ["businessName", "name", "email", "phone", "businessAddress", "gstNumber", "bankAccount.bankName", "bankAccount.accountNumber", "bankAccount.ifsc", "isApproved", "phoneVerified", "walletBalance"],
          filterProperties: ["businessName", "name", "email", "isApproved"],
          properties: {
            isApproved: {
              label: "✅ Approved for Marketplace",
              description: "Must be checked for the seller's products to be visible on the customer app.",
            },
          }
        },
      };
    }
    if (model.modelName === "Customer") {
      return {
        resource: model,
        options: {
          navigation: { name: "Users & Partners", icon: "Users" },
          sort: { sortBy: 'createdAt', direction: 'desc' },
          listProperties: ["name", "phone", "isActivated", "notificationsEnabled", "sensitiveMode"],
          actions: {
            sendNotification: {
              actionType: 'record',
              icon: 'Send',
              component: Components.SendNotification,
              handler: async (request, response, context) => {
                const { record } = context;
                if (request.method === 'post') {
                  const { title, body } = request.payload;
                  await sendPushNotification(record.params._id, title, body);
                  return {
                    record: record.toJSON(context.currentAdmin),
                    notice: { message: 'Notification sent successfully!', type: 'success' },
                  };
                }
                return {
                  record: record.toJSON(context.currentAdmin),
                };
              }
            }
          }
        },
      };
    }

    if (model.modelName === "Notification") {
      return {
        resource: model,
        options: {
          navigation: { name: "Marketing", icon: "Bell" },
          sort: { sortBy: 'createdAt', direction: 'desc' },
          listProperties: ["title", "body", "type", "status", "sentAt"],
          actions: {
            broadcast: {
              actionType: 'resource',
              icon: 'Radio',
              component: Components.SendNotification,
              handler: async (request, response, context) => {
                if (request.method === 'post') {
                  const { title, body, userType } = request.payload;
                  const count = await broadcastPushNotification(title, body, {}, userType || 'Customer');
                  return {
                    notice: { message: `Broadcast started for ${count} ${userType === 'DeliveryPartner' ? 'Drivers' : 'Customers'}!`, type: 'success' },
                  };
                }
                return {};
              }
            }
          }
        },
      };
    }


    const inventoryModels = ["SuperCategory"];
    if (inventoryModels.includes(model.modelName)) {
      return {
        resource: model,
        options: {
          navigation: { name: "Inventory Catalog", icon: "Layers" },
          sort: { sortBy: 'createdAt', direction: 'desc' },
          listProperties: ["name", "isChoice", "isAvailable", "createdAt"],
          editProperties: model.modelName === "SuperCategory"
            ? ["name", "order", "isChoice", "isAvailable"]
            : ["name", "image", "isChoice", "isSensitive", "isAvailable", "canEarnCoins"],
        },
      };
    }

    if (model.modelName === "Counter") {
      return {
        resource: model,
        options: {
          navigation: { name: "App Settings", icon: "Settings" },
        },
      };
    }

    if (model.modelName === "Ticket") {
      return {
        resource: model,
        options: {
          navigation: { name: "Support", icon: "HelpCircle" },
          sort: { sortBy: 'lastMessageAt', direction: 'desc' },
          listProperties: ["ticketId", "customer", "category", "status", "priority", "lastMessageAt"],
          filterProperties: ["ticketId", "customer", "category", "status", "priority"],
          actions: {
            reply: {
              actionType: 'record',
              icon: 'Send',
              component: Components.SupportReply,
              handler: async (request, response, context) => {
                const { record } = context;
                if (request.method === 'post') {
                  const { replyMessage } = request.payload;
                  const SupportMessage = mongoose.models.SupportMessage;
                  const Ticket = mongoose.models.Ticket;

                  await SupportMessage.create({
                    customer: record.params.customer,
                    ticket: record.params._id,
                    sender: 'support',
                    message: replyMessage
                  });

                  await Ticket.findByIdAndUpdate(record.params._id, {
                    lastMessageAt: new Date(),
                    status: 'Pending' // Mark as pending when support replies
                  });

                  return {
                    record: record.toJSON(context.currentAdmin),
                    notice: { message: 'Reply sent successfully!', type: 'success' },
                  };
                }
                return {
                  record: record.toJSON(context.currentAdmin),
                };
              }
            },
            resolve: {
              actionType: 'record',
              icon: 'CheckCircle',
              handler: async (request, response, context) => {
                const { record } = context;
                const Ticket = mongoose.models.Ticket;
                await Ticket.findByIdAndUpdate(record.params._id, { status: 'Resolved' });
                return {
                  record: record.toJSON(context.currentAdmin),
                  notice: { message: 'Ticket marked as Resolved!', type: 'success' },
                };
              }
            }
          }
        },
      };
    }

    if (model.modelName === "SupportMessage") {
      return {
        resource: model,
        options: {
          navigation: { name: "Support", icon: "MessageSquare" },
          sort: { sortBy: 'createdAt', direction: 'desc' },
          listProperties: ["ticket", "customer", "sender", "message", "createdAt"],
          filterProperties: ["ticket", "customer", "sender", "createdAt"],
        },
      };
    }

    if (model.modelName === "PricingConfig") {
      return {
        resource: model,
        options: {
          navigation: { name: "App Settings", icon: "Settings" },
          listProperties: [
            "freeDeliveryEnabled",
            "freeDeliveryThreshold",
            "baseDeliveryFee",
            "choiceDeliveryFee",
            "choiceFreeDeliveryEnabled",
            "rewardCoinsEnabled",
            "updatedAt",
          ],
          editProperties: [
            "freeDeliveryEnabled",
            "freeDeliveryThreshold",
            "baseDeliveryFee",
            "choiceDeliveryFee",
            "choiceFreeDeliveryEnabled",
            "choiceFreeDeliveryThreshold",
            "rewardCoinsPercentage",
            "minAmountForCoins",
            "promiseProtectEnabled",
            "promiseProtectFee",
            "smallCartFeeEnabled",
            "smallCartThreshold",
            "smallCartFee",
            "rainSurgeEnabled",
            "rainSurgeFee",
            "lateNightFeeEnabled",
            "lateNightStartTime",
            "lateNightEndTime",
            "lateNightFee",
            "defaultDriverEarning",
            "defaultDriverCodLimit",
            "customFees",
            "cartBarColor",
            "choiceCartBarColor",
            "etaColor",
          ],
          showProperties: [
            "freeDeliveryEnabled",
            "freeDeliveryThreshold",
            "baseDeliveryFee",
            "choiceDeliveryFee",
            "choiceFreeDeliveryEnabled",
            "choiceFreeDeliveryThreshold",
            "promiseProtectEnabled",
            "promiseProtectFee",
            "smallCartFeeEnabled",
            "smallCartThreshold",
            "smallCartFee",
            "rainSurgeEnabled",
            "rainSurgeFee",
            "lateNightFeeEnabled",
            "lateNightStartTime",
            "lateNightEndTime",
            "lateNightFee",
            "defaultDriverEarning",
            "defaultDriverCodLimit",
            "customFees",
            "cartBarColor",
            "choiceCartBarColor",
            "etaColor",
            "updatedAt",
          ],
          navigation: {
            name: "App Settings",
            icon: "Settings",
          },
          properties: {
            _id: { isVisible: false },
            __v: { isVisible: false },
            key: { isVisible: false },
            freeDeliveryEnabled: {
              label: "Enable Free Delivery Rule",
              description: "If enabled, delivery fee becomes 0 for carts above threshold.",
            },
            freeDeliveryThreshold: {
              label: "Free Delivery Threshold",
              description: "Cart amount above which delivery becomes free.",
            },
            baseDeliveryFee: {
              label: "Base Delivery Fee",
            },
            choiceDeliveryFee: {
              label: "Choice Delivery Fee",
              description: "Delivery fee charged for Choice (inter-city) orders.",
            },
            choiceFreeDeliveryEnabled: {
              label: "Enable Choice Free Delivery",
              description: "If enabled, Choice delivery becomes free above the threshold.",
            },
            choiceFreeDeliveryThreshold: {
              label: "Choice Free Delivery Threshold",
              description: "Cart amount above which Choice delivery becomes free.",
            },
            promiseProtectEnabled: {
              label: "Enable Promise Protect Fee",
            },
            promiseProtectFee: {
              label: "Promise Protect Fee",
            },
            smallCartFeeEnabled: {
              label: "Enable Small Cart Fee",
            },
            smallCartThreshold: {
              label: "Small Cart Threshold",
            },
            smallCartFee: {
              label: "Small Cart Fee",
            },
            rainSurgeEnabled: {
              label: "Enable Rain Surge Fee",
            },
            rainSurgeFee: {
              label: "Rain Surge Fee",
            },
            lateNightFeeEnabled: {
              label: "Enable Late Night Fee",
            },
            lateNightStartTime: {
              label: "Late Night Start (HH:MM)",
            },
            lateNightEndTime: {
              label: "Late Night End (HH:MM)",
            },
            lateNightFee: {
              label: "Late Night Fee",
            },
            rewardCoinsEnabled: {
              label: "Enable SabJab Coins Rewards",
              description: "Whether users earn coins for their purchases.",
            },
            rewardCoinsPercentage: {
              label: "Purchase Reward Percentage (%)",
              description: "What percentage of the eligible purchase value will be rewarded as SabJab Coins.",
            },
            minAmountForCoins: {
              label: "Min Order Amount for Rewards",
              description: "Users must spend at least this much (items total) to qualify for SabJab Coins.",
            },
            customFees: {
              label: "Custom Fees",
              description: "Add/remove any additional fees. Each fee can be enabled/disabled.",
            },
            cartBarColor: {
              label: "CartBar Background Color (Hex)",
              description: "Example: #1A1A1A or #10b981. This controls the background color of the floating cart bar in the customer app.",
            },
            choiceCartBarColor: {
              label: "Choice CartBar Color (Hex)",
              description: "Background color for the Choice-specific cart pill.",
            },
            etaColor: {
              label: "ETA Text Color (Hex)",
              description: "Color for the ETA display text.",
            },
            defaultDriverEarning: {
              label: "Default Driver Earning (per trip)",
            },
            defaultDriverCodLimit: {
              label: "Default Driver COD Limit",
              description: "Global fallback limit for drivers without a custom limit.",
            },
            updatedAt: {
              label: "Last Updated",
              isDisabled: true,
            },
          },
          actions: {
            new: { isAccessible: false, isVisible: false },
            delete: { isAccessible: false, isVisible: false },
            bulkDelete: { isAccessible: false, isVisible: false },
            show: { isVisible: false },
          },
        },
      };
    }

    if (model.modelName === "Coupon") {
      return {
        resource: model,
        options: {
          navigation: {
            name: "Marketing",
            icon: "Gift",
          },
          listProperties: ["code", "discountType", "discountValue", "expirationDate", "isActive"],
          editProperties: [
            "code",
            "description",
            "discountType",
            "discountValue",
            "minOrderAmount",
            "maxDiscount",
            "expirationDate",
            "isActive",
            "usageLimit",
          ],
          properties: {
            code: { isRequired: true },
            description: { type: "textarea", isRequired: true },
            discountType: {
              availableValues: [
                { value: "percentage", label: "Percentage (%) - Dynamic" },
                { value: "flat", label: "Flat (₹) - Direct Deduction" },
              ],
            },
            discountValue: { isRequired: true },
            expirationDate: { type: "datetime", isRequired: true },
            isActive: { type: "boolean" },
            usedCount: { isDisabled: true },
          },
        },
      };
    }

    if (model.modelName === "GreenPoints") {
      return {
        resource: model,
        options: {
          navigation: { name: "Marketing", icon: "Award" },
          sort: { sortBy: 'createdAt', direction: 'desc' },
          listProperties: ["customer", "totalBalance", "lifetime"],
          showProperties: ["customer", "totalBalance", "lifetime", "transactions"],
          properties: {
            transactions: { label: "Transaction History" },
          },
        },
      };
    }

    if (model.modelName === "GreenPointsConfig") {
      return {
        resource: model,
        options: {
          navigation: { name: "Marketing", icon: "Award" },
          actions: {
            new: { isVisible: false },
            delete: { isVisible: false },
          },
          properties: {
            "earnRules.referral.trigger": {
              availableValues: [
                { value: "signup", label: "On Sign-up" },
                { value: "first_purchase", label: "On First Purchase" },
              ],
            },
            "earnRules.referral.awardTo": {
              availableValues: [
                { value: "referrer", label: "Referrer Only" },
                { value: "referee", label: "Referee Only" },
                { value: "both", label: "Both Parties" },
              ],
            },
          },
        },
      };
    }

    if (model.modelName === "Referral") {
      return {
        resource: model,
        options: {
          navigation: { name: "Marketing", icon: "Hash" },
          sort: { sortBy: 'createdAt', direction: 'desc' },
          listProperties: ["referrer", "referralCode", "status", "bonusesAwarded"],
          properties: {
            referralCode: { isDisabled: true },
          },
        },
      };
    }

    if (model.modelName === "Review") {
      return {
        resource: model,
        options: {
          navigation: { name: "Marketing", icon: "Star" },
          sort: { sortBy: 'createdAt', direction: 'desc' },
          listProperties: ["customer", "product", "rating", "comment", "createdAt"],
          filterProperties: ["customer", "product", "rating", "createdAt"],
          properties: {
            comment: { type: "textarea" },
            rating: {
              availableValues: [
                { value: 1, label: "1 Star" },
                { value: 2, label: "2 Stars" },
                { value: 3, label: "3 Stars" },
                { value: 4, label: "4 Stars" },
                { value: 5, label: "5 Stars" },
              ]
            },
          },
        },
      };
    }

    if (model.modelName === "Suggestion") {
      return {
        resource: model,
        options: {
          navigation: { name: "Marketing", icon: "MessageSquare" },
          sort: { sortBy: 'createdAt', direction: 'desc' },
          listProperties: ["brandName", "customer", "status", "rewardCoins", "rewardSent", "isWinner", "createdAt"],
          editProperties: ["brandName", "customer", "status", "rewardCoins", "isWinner"],
          actions: {
            edit: { after: [afterSuggestionEdit] },
            new: { after: [afterSuggestionEdit] },
          },
          properties: {
            brandName: { label: "Suggested Brand" },
            status: {
              availableValues: [
                { value: "pending", label: "Pending Review" },
                { value: "reviewed", label: "Reviewed" },
                { value: "added", label: "Brand Added" },
                { value: "rejected", label: "Rejected" },
              ]
            },
            rewardCoins: { label: "Reward Coins (SabJab Coins)" },
            isWinner: { label: "🏆 Community Winner?" },
            rewardSent: { label: "✅ Reward Dispatched?", isReadOnly: true },
            customer: { isReadOnly: true }
          }
        },
      };
    }

    if (model.modelName === "Recipe") {
      const recipeProvider = new CloudinaryProvider();
      const replaceRecipeKeyWithUrl = async (response, request, context) => {
        const url = recipeProvider.lastUploadedUrl;
        const recordId = response.record?.params?._id;

        if (url && recordId) {
          logToFile(`🔗 Syncing Cloudinary URL for Recipe ${recordId}: ${url}`);
          try {
            await mongoose.models.Recipe.findByIdAndUpdate(recordId, { image: url });
            if (response.record && response.record.params) {
              response.record.params.image = url;
            }
          } catch (e) {
            logToFile(`❌ Sync Error for Recipe: ${e.message}`);
            console.error('❌ Sync Error for Recipe:', e.message);
          }
          recipeProvider.lastUploadedUrl = null;
        }
        return response;
      };

      return {
        resource: model,
        options: {
          navigation: { name: "Content", icon: "BookOpen" },
          sort: { sortBy: 'createdAt', direction: 'desc' },
          listProperties: ["title", "category", "difficulty", "prepTime", "isActive", "image"],
          editProperties: ["title", "category", "difficulty", "prepTime", "description", "uploadImage", "isActive", "calories", "ingredients", "steps"],
          actions: {
            new: { after: [replaceRecipeKeyWithUrl] },
            edit: { after: [replaceRecipeKeyWithUrl] },
          },
          properties: {
            description: { type: "richtext" },
            image: { isVisible: { list: true, filter: false, show: true, edit: false } },
            uploadImage: { label: "Recipe Image", type: "file" },
            "ingredients.name": { label: "Ingredient Name (Display)" },
            "ingredients.quantity": { label: "Quantity (e.g. 1 cup)" },
            "ingredients.item": { label: "Mapped Product (Optional)" },
            "steps.instruction": { type: "textarea" },
          }
        },
        features: [
          uploadFeature({
            componentLoader,
            provider: recipeProvider,
            properties: {
              key: 'image',
              file: 'uploadImage',
              uploadPath: (record, filename) => `${record.id() || 'new'}/${sanitizeFilename(filename)}`,
            },
            validation: { mimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'] },
          }),
        ],
      };
    }

    if (model.modelName === "StoreStatus") {
      return {
        resource: model,
        options: {
          listProperties: ["mode", "openingTime", "closingTime", "updatedAt"],
          listProperties: ["mode", "openingTime", "closingTime", "updatedAt"],
          editProperties: ["mode", "openingTime", "closingTime", "alertBeforeMinutes", "etaBoxColor", "etaTextColor", "etaBoxDarkColor", "etaTextDarkColor"],
          showProperties: ["mode", "openingTime", "closingTime", "alertBeforeMinutes", "etaBoxColor", "etaTextColor", "etaBoxDarkColor", "etaTextDarkColor", "updatedAt"],
          navigation: {
            name: "App Settings",
            icon: "Settings",
          },
          properties: {

            _id: { isVisible: false },
            __v: { isVisible: false },
            key: {
              isVisible: false,
            },
            mode: {
              label: "Status Control",
              description:
                "Always Open/Closed overrides timing. Auto by Time uses opening and closing hours below.",
              availableValues: [
                { value: "manual_open", label: "Always Open" },
                { value: "manual_closed", label: "Always Closed" },
                { value: "schedule", label: "Auto by Time" },
                { value: "high_demand", label: "High Demand" },
                { value: "rain_surge", label: "Rain Surge" },
                { value: "high_traffic", label: "High Traffic" },
                { value: "unavailable", label: "Unavailable" },
              ],
            },
            openingTime: {
              label: "Opening Time (HH:MM)",
              description: "24-hour format. Example: 09:00",
            },
            closingTime: {
              label: "Closing Time (HH:MM)",
              description: "24-hour format. Example: 22:30",
            },
            alertBeforeMinutes: {
              label: "Show Opens/Closes In (minutes)",
              description: "Example: 30 means show “Opens in/Closes in” during the last 30 minutes.",
            },
            etaBoxColor: { label: "ETA Box Color (Light)", description: "Default is #6366F1" },
            etaTextColor: { label: "ETA Text Color (Light)", description: "Default is #ffffff" },
            etaBoxDarkColor: { label: "ETA Box Color (Dark)", description: "Default is #4F46E5" },
            etaTextDarkColor: { label: "ETA Text Color (Dark)", description: "Default is #ffffff" },
            note: {
              isVisible: false,
            },
            createdAt: {
              isVisible: false,
            },
            updatedAt: {
              label: "Last Updated",
              isDisabled: true,
            },
          },
          actions: {
            new: { isAccessible: false, isVisible: false },
            delete: { isAccessible: false, isVisible: false },
            bulkDelete: { isAccessible: false, isVisible: false },
            show: { isVisible: false },
          },
        },
      };
    }

    if (model.modelName === "Category") {
      const catProvider = new CloudinaryProvider();
      const replaceCatKeyWithUrl = async (response, request, context) => {
        if (catProvider.lastUploadedUrl && context.record && context.record.isValid()) {
          console.log('🔗 Replacing category image key with full URL:', catProvider.lastUploadedUrl);
          await context.record.update({ image: catProvider.lastUploadedUrl });
          catProvider.lastUploadedUrl = null;
          return { ...response, record: context.record.toJSON(context.currentAdmin) };
        }
        return response;
      };

      return {
        resource: model,
        options: {
          navigation: { name: "Inventory Catalog", icon: "Layers" },
          sort: { sortBy: 'createdAt', direction: 'desc' },
          listProperties: ["name", "isChoice", "isAvailable", "image"],
          editProperties: ["name", "image", "uploadImage", "isChoice", "isSensitive", "isAvailable", "canEarnCoins"],
          actions: {
            new: { after: [replaceCatKeyWithUrl] },
            edit: { after: [replaceCatKeyWithUrl] },
          },
          properties: {
            image: { isVisible: { list: true, filter: false, show: true, edit: false } },
            uploadImage: {
              label: "Click to Upload Image to Cloudinary",
              type: "file",
              mimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'],
            },
          },
        },
        features: [
          uploadFeature({
            componentLoader,
            provider: catProvider,
            properties: {
              key: 'image',
              file: 'uploadImage',
              filePath: 'imageFilePath',
              filesToDelete: 'imageFilesToDelete',
              uploadPath: (record, filename) => `cat_${record.id() || Date.now()}/${sanitizeFilename(filename)}`,
            },
            validation: { mimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'] },
          }),
        ],
      };
    }

    if (model.modelName === "SubCategory") {
      const subCatProvider = new CloudinaryProvider();
      const replaceSubCatKeyWithUrl = async (response, request, context) => {
        if (subCatProvider.lastUploadedUrl && context.record && context.record.isValid()) {
          console.log('🔗 Replacing sub-category image key with full URL:', subCatProvider.lastUploadedUrl);
          await context.record.update({ image: subCatProvider.lastUploadedUrl });
          subCatProvider.lastUploadedUrl = null;
          return { ...response, record: context.record.toJSON(context.currentAdmin) };
        }
        return response;
      };

      return {
        resource: model,
        options: {
          navigation: { name: "Inventory Catalog", icon: "Layers" },
          sort: { sortBy: 'createdAt', direction: 'desc' },
          // Show "SubCatName (CategoryName)" in reference dropdowns
          recordRepresentation: (record) => {
            const catName = record.populated?.category?.params?.name || '';
            return catName ? `${record.params.name} (${catName})` : record.params.name;
          },
          listProperties: ["name", "category", "isAvailable", "image"],
          editProperties: ["name", "category", "isAvailable", "uploadImage"],
          actions: {
            new: { after: [replaceSubCatKeyWithUrl] },
            edit: { after: [replaceSubCatKeyWithUrl] },
          },
          properties: {
            name: {
              label: "Sub Category Name",
              isRequired: true,
            },
            category: {
              label: "Parent Category",
              type: "reference",
              reference: "Category",
              isRequired: true,
            },
            image: {
              isVisible: { list: true, filter: false, show: true, edit: false },
              isRequired: false,
            },
            imageFilePath: { isVisible: false },
            imageFilesToDelete: { isVisible: false },
            uploadImage: {
              label: "Click to Upload Image to Cloudinary",
              type: "file",
              mimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'],
            },
          },
        },
        features: [
          uploadFeature({
            componentLoader,
            provider: subCatProvider,
            properties: {
              key: 'image',
              file: 'uploadImage',
              filePath: 'imageFilePath',
              filesToDelete: 'imageFilesToDelete',
              uploadPath: (record, filename) => `subcat_${record.id() || Date.now()}/${sanitizeFilename(filename)}`,
            },
            validation: {
              mimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'],
            },
          }),
        ],
      };
    }

    if (model.modelName === "HomeComponent") {
      const bannerProvider = new CloudinaryProvider();
      const videoProvider = new CloudinaryProvider();

      const replaceMediaKeysWithUrl = async (response, request, context) => {
        let changed = false;
        
        // Handle Banner Image
        if (bannerProvider.lastUploadedUrl && context.record && context.record.isValid()) {
          console.log('🔗 Replacing bannerImage key with full URL:', bannerProvider.lastUploadedUrl);
          await context.record.update({ bannerImage: bannerProvider.lastUploadedUrl });
          bannerProvider.lastUploadedUrl = null;
          changed = true;
        }

        // Handle Video URL
        if (videoProvider.lastUploadedUrl && context.record && context.record.isValid()) {
          console.log('🎥 Replacing videoUrl key with full URL:', videoProvider.lastUploadedUrl);
          await context.record.update({ videoUrl: videoProvider.lastUploadedUrl });
          videoProvider.lastUploadedUrl = null;
          changed = true;
        }

        if (changed) {
          return { ...response, record: context.record.toJSON(context.currentAdmin) };
        }
        return response;
      };

      return {
        resource: model,
        options: {
          navigation: {
            name: "Home Page Builder",
            icon: "Layout",
          },
          label: "Home Page Sections", // User friendly label
          sort: { sortBy: 'createdAt', direction: 'desc' },
          listProperties: ["title", "type", "isActive"],
          editProperties: ["title", "subTitle", "type", "isActive", "sections", "categories", "bigDeal", "miniDeals", "products", "uploadBanner", "uploadVideo", "carouselImages", "buttonText", "themeColor", "darkThemeColor", "themeMode", "videoUrl", "videoThumbnail"],
          actions: {
            new: { after: [replaceMediaKeysWithUrl] },
            edit: { after: [replaceMediaKeysWithUrl] },
          },
          properties: {
            type: {
              availableValues: [
                { value: "CATEGORY_STRIP", label: "Category Strip" },
                { value: "CATEGORY_CLUSTERS", label: "2x2 Dynamic Category Grid" },
                { value: "FEATURED_DEALS", label: "Deals Section (Configurable)" },
                { value: "PRODUCT_SCROLLER", label: "Product Horizontal Scroller" },
                { value: "PRODUCT_GRID", label: "Product Grid (Modern Layout)" },
                { value: "PROMO_BANNER", label: "Promotional Banner" },
                { value: "IMAGE_CAROUSEL", label: "Image Carousel Slider" },
                { value: "BENTO_GRID", label: "Premium Bento Grid (1 Large + 2 Small)" },
                { value: "STORY_STRIP", label: "Instagram-Style Story Strip" },
                { value: "GRADIENT_HERO", label: "High-Impact Gradient Hero" },
                { value: "RAMZAN_SPECIAL", label: "Festive Ramzan Special Layout" },
                { value: "RAMZAN_SPECIAL2", label: "Premium Ramzan Animated Layout" },
                { value: "HAPPY_HOLI", label: "Vibrant Happy Holi Layout" },
                { value: "DIWALI_SPECIAL", label: "Sparking Diwali Grid (2x2)" },
                { value: "CHRISTMAS_SPECIAL", label: "Snowy Christmas Layout" },
                { value: "TRIPLE_SECTION_GRID", label: "Premium Triple Section Pager (Side-by-Side)" },
                { value: "CATEGORY_GRID_FOUR_IMAGES", label: "🖼️ Category 2x2 Image Grid (New)" },
                { value: "PRODUCT_GRID_3X2", label: "📦 Elegant 3x2 Product Grid (New)" },
                { value: "MINI_VIDEO", label: "🎥 Floating Mini Video Promotion (New)" },
                { value: "AISLE_2X2_GRID", label: "🛍️ Aisle 2x2 Product Grid (New)" },
                { value: "PROMOTION_PAGINATION", label: "🏷️ Promo with 4-Dots Pagination (New)" },
                { value: "GROCERY_LIST_2X3", label: "📋 Grocery List 2x3 Category Grid (New)" }
              ],
            },
            sections: {
              isVisible: (context) => context.record?.params?.type === "TRIPLE_SECTION_GRID",
              label: "Grid Sections (Exactly 3 screens)",
              description: "Manage the title, color, and products for each of the 3 side-by-side screens. Each section is a separate screen in the pager."
            },
            subTitle: {
              label: "Secondary Text (e.g. 'Upto 50% Off')",
              helpText: "Appears below the main title. Type 'Dove' to search anytime!",
              isVisible: (context) => {
                const type = context.record?.params?.type;
                const visibleTypes = ["CATEGORY_CLUSTERS", "FEATURED_DEALS", "PRODUCT_SCROLLER", "PRODUCT_GRID", "BENTO_GRID", "GRADIENT_HERO", "RAMZAN_SPECIAL", "RAMZAN_SPECIAL2", "HAPPY_HOLI", "DIWALI_SPECIAL", "CHRISTMAS_SPECIAL", "CATEGORY_GRID_FOUR_IMAGES", "PRODUCT_GRID_3X2", "AISLE_2X2_GRID", "PROMOTION_PAGINATION", "GROCERY_LIST_2X3", "MINI_VIDEO"];
                return !!(type && visibleTypes.includes(type));
              }
            },
            buttonText: {
              label: "CTA Button Text (e.g. 'Explore' or 'Shop Now')",
              helpText: "Text for the action button.",
              isVisible: (context) => {
                const type = context.record?.params?.type;
                const visibleTypes = ["CATEGORY_CLUSTERS", "FEATURED_DEALS", "PRODUCT_SCROLLER", "PRODUCT_GRID", "PROMO_BANNER", "BENTO_GRID", "STORY_STRIP", "GRADIENT_HERO", "RAMZAN_SPECIAL", "RAMZAN_SPECIAL2", "HAPPY_HOLI", "DIWALI_SPECIAL", "CHRISTMAS_SPECIAL", "CATEGORY_GRID_FOUR_IMAGES", "PRODUCT_GRID_3X2", "AISLE_2X2_GRID", "PROMOTION_PAGINATION", "GROCERY_LIST_2X3"];
                return !!(type && visibleTypes.includes(type));
              }
            },
            bigDeal: {
              label: "Primary Featured Product (Large)",
              helpText: "SEARCH TIP: Type 'Dove' below to see all products matching that name.",
              remote: true, // Enables full database search
              isVisible: (context) => {
                const type = context.record?.params?.type;
                const visibleTypes = ["FEATURED_DEALS", "BENTO_GRID"];
                return !!(type && visibleTypes.includes(type));
              }
            },
            miniDeals: {
              label: "Supporting Products (Small)",
              helpText: "Select multiple. You can search for 'Dove', 'Soap', etc. to find items.",
              remote: true, // Enables full database search
              isVisible: (context) => {
                const type = context.record?.params?.type;
                const visibleTypes = ["FEATURED_DEALS", "BENTO_GRID"];
                return !!(type && visibleTypes.includes(type));
              }
            },
            categories: {
              label: "Select Sub-Categories",
              helpText: "Pick the sub-categories or categories to display in this strip.",
              isVisible: (context) => {
                const type = context.record?.params?.type;
                const visibleTypes = ["CATEGORY_STRIP", "CATEGORY_GRID_FOUR_IMAGES", "AISLE_2X2_GRID", "GROCERY_LIST_2X3"];
                return !!(type && visibleTypes.includes(type));
              }
            },
            products: {
              label: "Main Product Collection",
              helpText: "SEARCH TIP: Start typing 'Dove' and wait a second to see all versions.",
              remote: true, // Enables full database search
              isVisible: (context) => {
                const type = context.record?.params?.type;
                const visibleTypes = ["CATEGORY_CLUSTERS", "PRODUCT_SCROLLER", "PRODUCT_GRID", "STORY_STRIP", "GRADIENT_HERO", "RAMZAN_SPECIAL", "RAMZAN_SPECIAL2", "HAPPY_HOLI", "DIWALI_SPECIAL", "CHRISTMAS_SPECIAL", "PRODUCT_GRID_3X2", "AISLE_2X2_GRID", "PROMOTION_PAGINATION"];
                return !!(type && visibleTypes.includes(type));
              }
            },
            bannerImage: {
              isVisible: { list: true, filter: false, show: true, edit: false },
              isRequired: false,
            },
            uploadBanner: {
              label: "Component Banner/Hero Image",
              helpText: "Required for Heroes and banners. Hidden for simple grids.",
              isVisible: (context) => {
                const type = context.record?.params?.type;
                const visibleTypes = ["CATEGORY_CLUSTERS", "PROMO_BANNER", "GRADIENT_HERO", "HAPPY_HOLI", "MINI_VIDEO"];
                return !!(type && visibleTypes.includes(type));
              }
            },
            carouselImages: {
              label: "Carousel Images (Array)",
              isArray: true, // Critical Fix: Matches Mongoose [String]
              helpText: "Paste image URLs. Only for Slider type.",
              isVisible: (context) => Boolean(context.record?.params?.type === "IMAGE_CAROUSEL"),
            },
            themeColor: {
              label: "Component Override Color (HEX)",
              helpText: "Overrides the global Occasion color. Leave blank to stay synced.",
              isVisible: (context) => {
                const type = context.record?.params?.type;
                const hiddenTypes = ["IMAGE_CAROUSEL", "CATEGORY_STRIP"];
                return !!(type && !hiddenTypes.includes(type));
              }
            },
            themeMode: {
              label: "Visual Style / Mode",
              availableValues: [
                { value: "glass", label: "Glassmorphism (Premium / Translucent)" },
                { value: "light", label: "Minimalist Light" },
                { value: "dark", label: "Midnight Dark" },
                { value: "snow", label: "Snow Effect" },
                { value: "rain", label: "Rain Effect" },
                { value: "autumn", label: "Autumn Leaves Effect" }
              ],
              helpText: "Choose the visual vibe for this specific block.",
              isVisible: (context) => {
                const type = context.record?.params?.type;
                const hiddenTypes = ["IMAGE_CAROUSEL", "CATEGORY_STRIP"];
                return !!(type && !hiddenTypes.includes(type));
              }
            },
            videoUrl: {
              label: "Direct Video URL (MP4 Preferred)",
              helpText: "Paste the raw link or use 'Upload Video' below. Recommended size 110x160.",
              isVisible: (context) => Boolean(context.record?.params?.type === "MINI_VIDEO"),
            },
            uploadVideo: {
              label: "🎥 Upload Component Video",
              type: "file",
              helpText: "Click here to upload an MP4 directly to Cloudinary.",
              isVisible: (context) => Boolean(context.record?.params?.type === "MINI_VIDEO"),
            },
            videoThumbnail: {
              label: "Video Poster / Thumbnail URL",
              helpText: "Optional: Static image shown before video plays.",
              isVisible: (context) => Boolean(context.record?.params?.type === "MINI_VIDEO"),
            },
          },
        },
        features: [
          uploadFeature({
            componentLoader,
            provider: bannerProvider,
            properties: {
              key: 'bannerImage',
              file: 'uploadBanner',
              filePath: 'bannerFilePath',
              filesToDelete: 'bannerFilesToDelete',
              uploadPath: (record, filename) => {
                const id = record.id() || `new_${Date.now()}`;
                return `${id}/banner_${sanitizeFilename(filename)}`;
              },
            },
            validation: {
              mimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'],
            },
          }),
          uploadFeature({
            componentLoader,
            provider: videoProvider,
            properties: {
              key: 'videoUrl',
              file: 'uploadVideo',
              filePath: 'videoFilePath',
              filesToDelete: 'videoFilesToDelete',
              uploadPath: (record, filename) => {
                const id = record.id() || `new_${Date.now()}`;
                return `${id}/video_${sanitizeFilename(filename)}`;
              },
            },
            validation: {
              mimeTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
            },
          }),
        ],
      };
    }

    if (model.modelName === "Product") {
      // Store the last uploaded URL for retrieval in the after-hook
      const productProvider = new CloudinaryProvider();
      const productGalleryProvider = new CloudinaryProvider(); // New: Dedicated instance for gallery
      const productVideoProvider = new CloudinaryProvider();

      // After-hook that replaces the stored key with the full Cloudinary URL
      const replaceKeyWithUrl = async (response, request, context) => {
        let changed = false;
        
        // 1. Handle Main Product Image
        if (productProvider.lastUploadedUrl && context.record && context.record.isValid()) {
          console.log(`🔗 Syncing Main Image for Product: ${productProvider.lastUploadedUrl}`);
          await context.record.update({ image: productProvider.lastUploadedUrl });
          productProvider.lastUploadedUrl = null;
          changed = true;
        }

        // 2. Handle Product Gallery (Array)
        // Sync gallery keys to full URLs using the dedicated gallery provider's tracking
        const currentImages = context.record?.get('images');
        if (Array.isArray(currentImages) && currentImages.length > 0) {
            const updatedImages = currentImages.map(img => {
                if (typeof img === 'string' && !img.startsWith('http')) {
                   // Try to find full URL in tracker
                   return productGalleryProvider.uploadedUrls[img] || img;
                }
                return img;
            });
            if (JSON.stringify(currentImages) !== JSON.stringify(updatedImages)) {
                await context.record.update({ images: updatedImages });
                changed = true;
            }
        }

        // 3. Handle Product Video
        if (productVideoProvider.lastUploadedUrl && context.record && context.record.isValid()) {
          console.log(`🎥 Syncing Video for Product: ${productVideoProvider.lastUploadedUrl}`);
          await context.record.update({ video: productVideoProvider.lastUploadedUrl });
          productVideoProvider.lastUploadedUrl = null;
          changed = true;
        }

        // 4. Handle Variations (Nested Swatches)
        // If variations were uploaded in the before-hook, they should have full URLs already,
        // but we double-check or sync here if any are still keys.
        const variations = context.record?.get('variations');
        if (Array.isArray(variations) && variations.length > 0) {
            let varChanged = false;
            const updatedVariations = variations.map(v => {
                if (v.image && !v.image.startsWith('http')) {
                    const fullUrl = productProvider.uploadedUrls[v.image];
                    if (fullUrl) {
                        varChanged = true;
                        return { ...v, image: fullUrl };
                    }
                }
                return v;
            });
            if (varChanged) {
                await context.record.update({ variations: updatedVariations });
                changed = true;
            }
        }

        if (changed && response.record) {
          return { ...response, record: context.record.toJSON(context.currentAdmin) };
        }
        return response;
      };

      return {
        resource: model,
        options: {
          navigation: { name: "Inventory Catalog", icon: "Archive" },
          sort: { sortBy: 'createdAt', direction: 'desc' },
          listProperties: ["name", "price", "stock", "costPrice", "quantity", "isAvailable", "isApproved", "image", "deliveryDays", "returnWindow", "shippingCost", "rtoCost", "tags"],
          editProperties: ["name", "description", "uploadFile", "uploadVideo", "uploadGallery", "images", "video", "videoThumbnail", "price", "discountPrice", "costPrice", "quantity", "stock", "deliveryDays", "returnWindow", "userStockLimit", "shippingCost", "rtoCost", "isAvailable", "isApproved", "sellerId", "isChoice", "isSensitive", "superCategory", "category", "subCategory", "tags", "variations"],
          showProperties: ["name", "description", "price", "discountPrice", "costPrice", "quantity", "stock", "deliveryDays", "returnWindow", "userStockLimit", "shippingCost", "rtoCost", "isAvailable", "isApproved", "sellerId", "isChoice", "isSensitive", "superCategory", "category", "subCategory", "image", "images", "video", "videoThumbnail", "tags", "variations"],
          filterProperties: ["name", "category", "subCategory", "superCategory", "stock", "costPrice", "isAvailable", "isApproved", "isChoice", "deliveryDays", "returnWindow", "shippingCost", "rtoCost", "tags"],
          actions: {
            new: { 
              after: [replaceKeyWithUrl],
              before: [async (request, context) => {
                if (request.method === 'post' && request.payload) {
                  const id = context.record?.id?.() || `new_${Date.now()}`;

                  // 1. Handle Product Variations (Manual because of nested structure)
                  // Detect all variation indexes in the payload (handles both flat and structured payloads)
                  const payloadKeys = Object.keys(request.payload || {});
                  const varIndexes = new Set();
                  payloadKeys.forEach(k => {
                    const m = k.match(/^variations\.(\d+)\./);
                    if (m) varIndexes.add(m[1]);
                  });

                  // Support for direct array structure if present
                  if (Array.isArray(request.payload.variations)) {
                    request.payload.variations.forEach((_, i) => varIndexes.add(i.toString()));
                  }

                  const sortedIndexes = Array.from(varIndexes).sort((a,b) => parseInt(a) - parseInt(b));
                  
                  for (const i of sortedIndexes) {
                    // Check for file in both flat and nested structure
                    const uploadFile = request.payload[`variations.${i}.uploadImage`] || 
                                     (request.payload.variations && request.payload.variations[i]?.uploadImage);

                    if (uploadFile && uploadFile.size > 0) {
                      console.log(`🎭 [Variation Upload] Processing variation ${i}...`);
                      const filename = `var_${i}_${sanitizeFilename(uploadFile.name || 'image.jpg')}`;
                      // Use shared productProvider to ensure after-hook can see the result if needed
                      const result = await productProvider.upload(uploadFile, `${id}/${filename}`);
                      request.payload[`variations.${i}.image`] = result.secure_url;
                    }
                  }
                  // Note: Gallery (uploadGallery) is handled by uploadFeature + replaceKeyWithUrl after-hook
                }
                return request;
              }]
            },
            edit: { 
              after: [replaceKeyWithUrl],
              before: [async (request, context) => {
                if (request.method === 'post' && request.payload) {
                  const id = context.record.id();

                  // 1. Handle Product Variations (Manual because of nested structure)
                  // Detect all variation indexes in the payload (handles both flat and structured payloads)
                  const payloadKeys = Object.keys(request.payload || {});
                  const varIndexes = new Set();
                  payloadKeys.forEach(k => {
                    const m = k.match(/^variations\.(\d+)\./);
                    if (m) varIndexes.add(m[1]);
                  });

                  // Support for direct array structure if present
                  if (Array.isArray(request.payload.variations)) {
                    request.payload.variations.forEach((_, i) => varIndexes.add(i.toString()));
                  }

                  const sortedIndexes = Array.from(varIndexes).sort((a,b) => parseInt(a) - parseInt(b));
                  
                  for (const i of sortedIndexes) {
                    // Check for file in both flat and nested structure
                    const uploadFile = request.payload[`variations.${i}.uploadImage`] || 
                                     (request.payload.variations && request.payload.variations[i]?.uploadImage);

                    if (uploadFile && uploadFile.size > 0) {
                      console.log(`🎭 [Variation Upload] Processing variation ${i}...`);
                      const filename = `var_${i}_${sanitizeFilename(uploadFile.name || 'image.jpg')}`;
                      // Use shared productProvider for tracking
                      const result = await productProvider.upload(uploadFile, `${id}/${filename}`);
                      request.payload[`variations.${i}.image`] = result.secure_url;
                    }
                  }
                  // Note: Gallery (uploadGallery) is handled by uploadFeature + replaceKeyWithUrl after-hook
                }
                return request;
              }]
            },
            list: {
              before: async (request) => {
                request.query = request.query || {};
                request.query.perPage = 50; 

                // Handle Alphabet Filter (from Dashboard or URL)
                const letter = request.query.letter;
                
                // Set default perPage to 100 to ensure more products are visible at once
                request.query.perPage = request.query.perPage || 100;
                
                if (letter) {
                  console.log(`🔤 [Alpha Filter] Filtering by letter: ${letter}`);
                  // Map to the standard name filter with a prefix regex pattern
                  // AdminJS Mongoose usually supports regex strings if configured, 
                  // or we can just use the literal letter for a 'contains' search as a fallback.
                  request.query['filters.name'] = letter; 
                }
                return request;
              },
              after: async (response) => {
                console.log(`📊 [Pagination Debug] Total Records: ${response.meta.total}, Current Page Records: ${response.records.length}`);
                return response;
              }
            }
          },
          properties: {
            isApproved: {
              label: "✅ Admin Approved",
              description: "Visible to customers only if Approved is TRUE. Seller-uploaded products start as FALSE.",
              type: 'boolean'
            },
            sellerId: {
              label: "👤 Assigned Seller",
              description: "The seller who owns this product. Null for platform-owned items.",
              reference: "Seller"
            },
            name: {
              label: "Product Name",
              isRequired: true,
            },
            description: {
              type: "textarea",
              label: "Product Description",
            },
            price: {
              label: "MRP Price (₹)",
              type: "number",
            },
            discountPrice: {
              label: "Sale Price (₹) - Overrides MRP if Set",
              type: "number",
            },
            costPrice: {
              label: "Purchase / Cost Price (CP) (₹)",
              type: "number",
              helpText: "Private field: ONLY visible to Admin/Manager. Never shown to customers.",
            },
            quantity: {
              label: "Quantity / Weight (e.g. 80gm, 1kg)",
              isRequired: true,
            },
            stock: {
              label: "Stock Quantity",
              type: "number",
              helpText: "Current inventory count for this product.",
            },
            userStockLimit: {
              label: "Max Quantity per User",
              type: "number",
              helpText: "Maximum number of items a single user can buy (useful for sales). Leave empty for no limit.",
            },
            isAvailable: {
              label: "Is Available?",
              type: "boolean",
              helpText: "Toggle to show/hide product from the store.",
            },
            isChoice: {
              label: "✨ Choice Platform Product?",
              type: "boolean",
              helpText: "If TRUE, product gets a premium 'Choice' badge in UI.",
            },
            deliveryDays: {
              label: "📦 Delivery Days (Choice Only)",
              type: "number",
              helpText: "Sets the number of days for delivery (e.g., 5). Calculated as 'Delivery by [CurrentDate + X]'. Only shows if Choice is TRUE.",
            },
            returnWindow: {
              label: "🔙 Return Window (Hours)",
              type: "number",
              helpText: "Number of hours after delivery during which a return can be requested. Set to 0 for no return.",
            },
            superCategory: {
              label: "Super Category",
              type: "reference",
              reference: "SuperCategory",
            },
            category: {
              label: "Category",
              components: {
                edit: Components.FilteredCategory,
              },
            },
            subCategory: {
              label: "Sub Category",
              components: {
                edit: Components.FilteredSubCategory,
              },
            },
            tags: {
              label: "Search Tags / Keywords",
              description: "Hidden from customers. Used to improve search (e.g., 'alu' for Potato). Comma-separated list.",
              isArray: true,
            },
            variations: {
              label: "Product Variations / Swatches",
              type: 'mixed',
              description: "Add different sizes, weights, or packs here."
            },
            'variations.name': {
              label: 'Variation Label (e.g. 500g)',
              isRequired: true
            },
            'variations.price': {
              label: 'MRP Price (₹)',
              type: 'number',
              isRequired: true
            },
            'variations.discountPrice': {
              label: 'Sale Price (₹)',
              type: 'number'
            },
            'variations.stock': {
              label: 'Stock Count',
              type: 'number'
            },
            'variations.isAvailable': {
              label: 'In Stock?',
              type: 'boolean'
            },
            'variations.image': {
              label: 'Image URL (Auto-filled)',
              type: 'string',
              description: 'URL of the variation specific image. Automatically filled if you upload below.',
              isReadOnly: true
            },
            'variations.uploadImage': {
              label: '📸 Upload Variation Image',
              type: 'file',
              helpText: 'Select an image for THIS variation.'
            },
            images: {
              label: '📸 Additional Gallery Images',
              type: 'string',
              description: 'Array of additional image URLs. Click "Upload Gallery" below to add.',
              isVisible: { list: false, filter: false, show: true, edit: true },
              isArray: true,
            },
            uploadGallery: {
              label: "🖼️ Upload to Gallery",
              type: "file",
              helpText: "Select multiple images for the product gallery.",
            },
            video: {
              label: 'Product Video URL',
              helpText: "Raw link (MP4/WebM) or use 'Upload Video' below.",
            },
            videoFilePath: { isVisible: false }, // AdminJS metadata
            videoFilesToDelete: { isVisible: false }, // AdminJS metadata
            uploadVideo: {
              label: "📹 Upload Product Video",
              type: "file",
              helpText: "Max 50MB. MP4 format recommended.",
            },
            image: {
              isVisible: { list: true, filter: false, show: true, edit: false },
              isRequired: false,
            },
            uploadFile: {
              label: "Click to Upload Image to Cloudinary",
              type: "file",
              mimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'],
            },
          },
        },
        features: [
          uploadFeature({
            componentLoader,
            provider: productProvider,
            properties: {
              key: 'image',
              file: 'uploadFile',
              filePath: 'imageFilePath',
              filesToDelete: 'imageFilesToDelete',
              uploadPath: (record, filename) => {
                const id = record.id() || `new_${Date.now()}`;
                return `${id}/${sanitizeFilename(filename)}`;
              },
            },
            validation: {
              mimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'],
            },
          }),
          uploadFeature({
            componentLoader,
            provider: productVideoProvider,
            properties: {
              key: 'video',
              file: 'uploadVideo',
              filePath: 'videoFilePath',
              filesToDelete: 'videoFilesToDelete',
              uploadPath: (record, filename) => {
                const id = record.id() || `new_${Date.now()}`;
                return `${id}/video_${sanitizeFilename(filename)}`;
              },
            },
            validation: {
              mimeTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
            },
          }),
          uploadFeature({
            componentLoader,
            provider: productGalleryProvider,
            multiple: true,
            properties: {
              key: 'images',
              file: 'uploadGallery',
              filePath: 'imagesFilePath',
              filesToDelete: 'imagesFilesToDelete',
              uploadPath: (record, filename) => {
                const id = record.id() || `new_${Date.now()}`;
                return `${id}/gallery_${sanitizeFilename(filename)}`;
              },
            },
            validation: {
              mimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
            },
          }),
        ],
      };
    }

    if (model.modelName === "Occasion") {
      const occasionProvider = new CloudinaryProvider();

      const replaceOccasionIconWithUrl = async (response, request, context) => {
        if (occasionProvider.lastUploadedUrl && context.record && context.record.isValid()) {
          console.log('🔗 Replacing occasion icon key with full URL:', occasionProvider.lastUploadedUrl);
          await context.record.update({ icon: occasionProvider.lastUploadedUrl });
          occasionProvider.lastUploadedUrl = null;
          return { ...response, record: context.record.toJSON(context.currentAdmin) };
        }
        return response;
      };

      const occasionBannerProvider = new CloudinaryProvider();

      const replaceOccasionBannerWithUrl = async (response, request, context) => {
        if (occasionBannerProvider.lastUploadedUrl && context.record && context.record.isValid()) {
          console.log('🔗 Replacing occasion banner key with full URL:', occasionBannerProvider.lastUploadedUrl);
          await context.record.update({ banner: occasionBannerProvider.lastUploadedUrl });
          occasionBannerProvider.lastUploadedUrl = null;
          return { ...response, record: context.record.toJSON(context.currentAdmin) };
        }
        return response;
      };

      return {
        resource: model,
        options: {
          navigation: {
            name: "Home Page Builder",
            icon: "Layout",
          },
          sort: { sortBy: 'createdAt', direction: 'desc' },
          listProperties: ["_id", "name", "isSpecialOccasion", "themeColor", "themeEffect", "searchBarStyle", "topBarStyle", "showBanner", "isDefault", "isChoice", "isActive"],
          editProperties: [
            "name", "nameAlignment", "uploadIcon", "uploadBanner", "searchBarStyle", "topBarStyle", "themeEffect", "themeColor", "darkThemeColor",
            "searchPlaceholders",
            "ultraConfig.topGradientColor", "ultraConfig.topGradientDarkColor",
            "ultraConfig.middleGradientColor", "ultraConfig.middleGradientDarkColor",
            "ultraConfig.bottomGradientColor", "ultraConfig.bottomGradientDarkColor",
            "ultraConfig.gradientStops", "ultraConfig.titleFontSize", "ultraConfig.borderRadiusGlobal",
            "ultraConfig.hideTopBar", "ultraConfig.topBarColor", "ultraConfig.topBarDarkColor", "ultraConfig.etaBgColor", "ultraConfig.etaBgDarkColor", "ultraConfig.etaTextColor", "ultraConfig.etaTextDarkColor", "ultraConfig.navActiveTextColor", "ultraConfig.navActiveTextDarkColor", "ultraConfig.navInactiveTextColor", "ultraConfig.navInactiveTextDarkColor", "ultraConfig.addressColor", "ultraConfig.addressDarkColor", "ultraConfig.showOccasionStrip",
            "showBanner", "isSpecialOccasion", "isDefault", "isChoice", "isActive", "order", "components"
          ],
          showProperties: [
            "name", "nameAlignment", "icon", "banner", "searchBarStyle", "topBarStyle", "themeEffect", "themeColor", "darkThemeColor",
            "searchPlaceholders",
            "ultraConfig.topGradientColor", "ultraConfig.topGradientDarkColor",
            "ultraConfig.middleGradientColor", "ultraConfig.middleGradientDarkColor",
            "ultraConfig.bottomGradientColor", "ultraConfig.bottomGradientDarkColor",
            "ultraConfig.gradientStops", "ultraConfig.titleFontSize", "ultraConfig.borderRadiusGlobal",
            "ultraConfig.hideTopBar", "ultraConfig.topBarColor", "ultraConfig.topBarDarkColor", "ultraConfig.etaBgColor", "ultraConfig.etaBgDarkColor", "ultraConfig.etaTextColor", "ultraConfig.etaTextDarkColor", "ultraConfig.navActiveTextColor", "ultraConfig.navActiveTextDarkColor", "ultraConfig.navInactiveTextColor", "ultraConfig.navInactiveTextDarkColor", "ultraConfig.addressColor", "ultraConfig.addressDarkColor", "ultraConfig.showOccasionStrip",
            "showBanner", "isSpecialOccasion", "isDefault", "isChoice", "isActive", "order", "components"
          ],
          actions: {
            new: { after: [replaceOccasionIconWithUrl, replaceOccasionBannerWithUrl] },
            edit: { after: [replaceOccasionIconWithUrl, replaceOccasionBannerWithUrl] },
          },
          properties: {
            name: { label: "Variation Name (e.g. Holi Special, All)" },
            nameAlignment: {
              label: "Name Alignment (UI)",
              availableValues: [
                { value: "left", label: "Left Aligned" },
                { value: "right", label: "Right Aligned" }
              ]
            },
            searchBarStyle: {
              label: "🔍 Search Bar Style",
              availableValues: [
                { value: "standard", label: "Standard Search Bar" },
                { value: "pill", label: "💊 Pill Shaped (Full Rounded)" },
                { value: "standard_solo", label: "📏 Standard (Solo - Full Width)" },
                { value: "pill_solo", label: "🔘 Pill Shaped (Solo - Full Width)" },
                { value: "glassmorphic", label: "Glassmorphic (V2 Style)" },
                { value: "frosty", label: "❄️ Frosty Winter Search Bar" },
                { value: "neon", label: "✨ Neon Glow Search Bar" },
              ]
            },
            topBarStyle: {
              label: "📌 Top Bar Style",
              availableValues: [
                { value: "standard", label: "Standard (Delivery ETA + Status)" },
                { value: "nostalgic", label: "🙏 Nostalgic (Namaste Greeting)" },
                { value: "weather", label: "🌦️ Weather Bar (Particles Behind)" },
                { value: "scooty", label: "🛵 Scooty Delivery Animation" },
              ]
            },
            themeEffect: {
              label: "🎨 Theme & Weather Effect",
              availableValues: [
                { value: "none", label: "None — Default" },
                { value: "light", label: "Light Mode (Standard)" },
                { value: "dark", label: "Dark Mode (Premium)" },
                { value: "snow", label: "🌨️ Snowfall Effect" },
                { value: "rain", label: "🌧️ Raining Particles" },
                { value: "heavyrain", label: "⛈️ Heavy Thunderstorm" },
                { value: "rainspecialeffect", label: "🌩️ Special Cinematic Rain" },
                { value: "cinematicstorm", label: "🌌 Cinematic Storm Atmosphere" },
                { value: "autumn", label: "🍂 Falling Autumn Leaves" },
              ]
            },
            themeColor: { label: "Theme Accent Color (HEX)", helpText: "Hex code for the occasion theme (e.g. #FF5733)" },
            darkThemeColor: { label: "Dark Theme Accent Color (HEX)", helpText: "Explicit accent color for dark modes" },
            isChoice: { label: "✨ Choice Category?", helpText: "If ON, this category will appear in Choice Section Strip." },
            'ultraConfig.topGradientColor': { label: "Ultra: Top Gradient (Light)", helpText: "Upper background color for light mode. Use 8-digit hex for opacity (#FF573320)" },
            'ultraConfig.topGradientDarkColor': { label: "Ultra: Top Gradient (Dark)", helpText: "Upper background color for dark mode." },
            'ultraConfig.middleGradientColor': { label: "Ultra: Middle Gradient (Light)", helpText: "Optional: Mid-point color for light mode." },
            'ultraConfig.middleGradientDarkColor': { label: "Ultra: Middle Gradient (Dark)", helpText: "Optional: Mid-point color for dark mode." },
            'ultraConfig.bottomGradientColor': { label: "Ultra: Bottom Gradient (Light)", helpText: "Lower background color for light mode." },
            'ultraConfig.bottomGradientDarkColor': { label: "Ultra: Bottom Gradient (Dark)", helpText: "Lower background color for dark mode." },
            'ultraConfig.gradientStops': { label: "Ultra: Gradient Stops", helpText: "Comma separated stops (e.g. 0,0.5,1)" },
            'ultraConfig.titleFontSize': { label: "Ultra: Title Font Size", helpText: "Font size for section headers (default 24)" },
            'ultraConfig.borderRadiusGlobal': { label: "Ultra: Border Radius", helpText: "Global curvature for cards and boxes (default 16)" },
            'ultraConfig.topBarColor': { label: "Ultra: Top Bar (Light)", helpText: "Color for the top navigation bar area" },
            'ultraConfig.topBarDarkColor': { label: "Ultra: Top Bar (Dark)", helpText: "Color for the top navigation bar in dark mode" },
            'ultraConfig.hideTopBar': { label: "Ultra: Hide Top Bar?", helpText: "Completely remove location/search bar from top" },
            'ultraConfig.etaBgColor': { label: "Ultra: ETA Box (Light)", helpText: "Custom background color for the ETA/5 Mins badge" },
            'ultraConfig.etaBgDarkColor': { label: "Ultra: ETA Box (Dark)", helpText: "Custom background color for ETA badge in dark mode" },
            'ultraConfig.etaTextColor': { label: "Ultra: ETA Text (Light)", helpText: "Custom text color for the ETA/5 Mins badge" },
            'ultraConfig.etaTextDarkColor': { label: "Ultra: ETA Text (Dark)", helpText: "Custom text color for ETA badge in dark mode" },
            'ultraConfig.navActiveTextColor': { label: "Ultra: Nav Active Text (Light)", helpText: "Text color for the selected occasion tab" },
            'ultraConfig.navActiveTextDarkColor': { label: "Ultra: Nav Active Text (Dark)", helpText: "Text color for active tab in dark mode" },
            'ultraConfig.navInactiveTextColor': { label: "Ultra: Nav Inactive Text (Light)", helpText: "Text color for unselected occasion tabs" },
            'ultraConfig.navInactiveTextDarkColor': { label: "Ultra: Nav Inactive Text (Dark)", helpText: "Text color for inactive tabs in dark mode" },
            'ultraConfig.addressColor': { label: "Ultra: Address Text (Light)", helpText: "Color for the home screen address text" },
            'ultraConfig.addressDarkColor': { label: "Ultra: Address Text (Dark)", helpText: "Color for the home screen address text in dark mode" },
            'ultraConfig.showOccasionStrip': { label: "Ultra: Show Occasion Selection Strip?", helpText: "If OFF, the horizontal occasion icons strip is hidden from Home Screen (leaves no space)." },
            isSpecialOccasion: { label: "💎 Is Special Occasion?", helpText: "If ON, this occasion appears in the special box next to search, and is REMOVED from main lists." },
            showBanner: { label: "Show Occasion Banner?" },
            isDefault: { label: "Is Default Variation?", helpText: "Only one should be default. The 'All' occasion is typically the default." },
            components: {
              label: "Assigned Home Components",
              description: "Select and order components for this variation screen.",
              type: 'reference',
              reference: 'HomeComponent',
              isArray: true,
              remote: true
            },
            icon: {
              isVisible: { list: true, filter: false, show: true, edit: false },
              isRequired: false,
            },
            uploadIcon: {
              label: "Upload Icon Image (1:1 Ratio ideally)",
              type: "file",
              mimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'],
            },
            banner: {
              isVisible: { list: true, filter: false, show: true, edit: false },
              isRequired: false,
            },
            uploadBanner: {
              label: "Upload Banner Image (16:9 Ratio ideally)",
              type: "file",
              mimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'],
            },
          }
        },
        features: [
          uploadFeature({
            componentLoader,
            provider: occasionProvider,
            properties: {
              key: 'icon',
              file: 'uploadIcon',
              filePath: 'iconFilePath',
              filesToDelete: 'iconFilesToDelete',
              mimeType: 'iconMimeType',
              size: 'iconSize',
              bucket: 'iconBucket',
              uploadPath: (record, filename) => `occasion_icon_${record.id() || Date.now()}/${sanitizeFilename(filename)}`,
            },
            validation: { mimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'] },
          }),
          uploadFeature({
            componentLoader,
            provider: occasionBannerProvider,
            properties: {
              key: 'banner',
              file: 'uploadBanner',
              filePath: 'bannerFilePath',
              filesToDelete: 'bannerFilesToDelete',
              mimeType: 'bannerMimeType',
              size: 'bannerSize',
              bucket: 'bannerBucket',
              uploadPath: (record, filename) => `occasion_banner_${record.id() || Date.now()}/${sanitizeFilename(filename)}`,
            },
            validation: { mimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'] },
          })
        ],
      };
    }

    if (model.modelName === "Branch") {
      return {
        resource: model,
        options: {
          navigation: { name: "System Config", icon: "Settings" },
          listProperties: ["name", "address", "deliveryRadius", "prepTime", "vehicleSpeed"],
          editProperties: ["name", "address", "location", "deliveryRadius", "servicedPincodes", "prepTime", "vehicleSpeed"],
          properties: {
            prepTime: {
              label: "Preparation Time (Mins)",
              description: "Base time added to every order for packaging/prep.",
            },
            vehicleSpeed: {
              label: "Vehicle Speed (KM/HR)",
              description: "Average speed of delivery vehicle (used for Distance/Speed calculation).",
            },
            deliveryRadius: {
              label: "Delivery Radius (KM)",
            }
          }
        },
      };
    }

    if (model.modelName === "DeliveryPartner") {
      return {
        resource: model,
        options: {
          navigation: { name: "Delivery Management", icon: "Truck" },
          sort: { sortBy: 'createdAt', direction: 'desc' },
          actions: {
            sendNotification: {
              actionType: 'record',
              icon: 'Send',
              component: Components.SendNotification,
              handler: async (request, response, context) => {
                const { record } = context;
                if (request.method === 'post') {
                  const { title, body } = request.payload;
                  await sendPushNotification(record.params._id, title, body, {}, 'DeliveryPartner');
                  return {
                    record: record.toJSON(context.currentAdmin),
                    notice: { message: 'Notification sent successfully!', type: 'success' },
                  };
                }
                return {
                  record: record.toJSON(context.currentAdmin),
                };
              }
            }
          }
        },
      };
    }

    const driverModels = ["Payout", "WalletTransaction"];
    if (driverModels.includes(model.modelName)) {
      return {
        resource: model,
        options: {
          navigation: { name: "Delivery Management", icon: "Truck" },
          sort: { sortBy: 'createdAt', direction: 'desc' },
        },
      };
    }

    if (model.modelName !== "Order") {
      return { resource: model };
    }

    return {
      resource: model,
      options: {
        navigation: { name: "Operations & Sales", icon: "ShoppingCart" },
        sort: {
          sortBy: 'createdAt',
          direction: 'desc'
        },
        listProperties: ["orderId", "customer", "deliveryPartner", "status", "returnStatus", "totalPrice", "createdAt"],
        filterProperties: ["orderId", "status", "returnStatus", "deliveryPartner", "paymentStatus", "createdAt"],
        showProperties: ["orderId", "customer", "deliveryPartner", "status", "totalPrice", "paymentMethod", "paymentStatus", "deliveredAt", "returnWindow", "returnExpiresAt", "returnStatus", "returnReason", "createdAt", "updatedAt", "items"],
        properties: {
          deliveryPartner: {
            label: "Delivery Partner",
            description: "ASSIGN A DRIVER TO CLEAR THE 'NOT ASSIGNED' MARK",
            components: {
              list: Components.DriverStatus,
            },
          },
          status: {
            components: {
              list: Components.OrderStatus,
            },
            availableValues: [
              { value: "available", label: "🟢 Order Placed (Unassigned)" },
              { value: "assigned", label: "🟡 Driver Assigned" },
              { value: "confirmed", label: "🔵 Store Confirmed" },
              { value: "arriving", label: "🚚 Out for Delivery" },
              { value: "at_location", label: "📍 At Customer Location" },
              { value: "delivered", label: "✅ Delivered" },
              { value: "cancelled", label: "❌ Cancelled" },
            ],
          },
          paymentStatus: {
            availableValues: [
              { value: "Pending", label: "⏳ Pending" },
              { value: "Paid", label: "💰 Paid" },
              { value: "Refunded", label: "↩️ Refunded" },
            ]
          },
          returnStatus: {
            label: "Return Status",
            availableValues: [
              { value: "none", label: "⚪ No Return" },
              { value: "requested", label: "🟡 Return Requested" },
              { value: "approved", label: "🟢 Return Approved" },
              { value: "rejected", label: "🔴 Return Rejected" },
              { value: "completed", label: "✅ Return Completed" },
            ]
          },
          returnWindow: {
            label: "Return Window (Hrs)",
            type: "number"
          },
          returnExpiresAt: {
            label: "Return Expiry",
            type: "datetime"
          },
          deliveredAt: {
            label: "Delivered At",
            type: "datetime"
          },
          "items.returnStatus": {
            label: "Item Return Status",
            availableValues: [
              { value: "none", label: "⚪ No Return" },
              { value: "requested", label: "🟡 Return Requested" },
              { value: "approved", label: "🟢 Return Approved" },
              { value: "rejected", label: "🔴 Return Rejected" },
              { value: "completed", label: "✅ Return Completed" },
            ]
          },
          "items.returnWindow": { label: "Item Return Window", type: "number" },
          "items.returnExpiresAt": { label: "Item Return Expiry", type: "datetime" },
          "items.returnReason": { label: "Item Return Reason", type: "string" }
        },
        actions: {
          assignDriver: {
            actionType: "record",
            icon: "UserCheck",
            component: Components.AssignDriver,
            handler: async (request, response, context) => {
              const { record, currentAdmin } = context;
              if (request.method === "post") {
                try {
                  const { driverId } = request.payload;
                  const Order = mongoose.models.Order;
                  const DeliveryPartner = mongoose.models.DeliveryPartner;

                  const dbOrder = await Order.findById(record.id);
                  const driver = await DeliveryPartner.findById(driverId);

                  if (!dbOrder || !driver) {
                    return {
                      notice: { message: "Order or Driver not found", type: "error" },
                    };
                  }

                  const populatedOrder = await assignDriverToOrder(dbOrder, driver);

                  if (app.io && populatedOrder) {
                    // Notify the customer tracking room
                    app.io.to(String(populatedOrder._id)).emit("liveTrackingUpdates", {
                      ...populatedOrder.toObject(),
                      deliveryPartnerName: populatedOrder.deliveryPartner?.name || "Delivery Partner",
                    });
                    // Notify the specific driver via Socket
                    console.log(`📡 [Socket] Emitting driver:order-assigned to driver ${driverId}`);
                    app.io.to(String(driverId)).emit("driver:order-assigned", {
                      order: populatedOrder
                    });
                    // Notify via Push Notification
                    await sendPushNotification(
                      String(driverId),
                      "New Order Assigned! 📦",
                      `You have a new order #${populatedOrder.orderId} from ${populatedOrder.branch?.name || 'SabJab'}.`,
                      { orderId: String(populatedOrder._id), type: 'ORDER_ASSIGNED' },
                      'DeliveryPartner'
                    );
                    // Broad notification for admin UI
                    app.io.emit("admin:order-assigned", {
                      orderId: String(populatedOrder._id),
                      orderNumber: populatedOrder.orderId,
                      driverName: populatedOrder.deliveryPartner?.name || "Delivery Partner",
                    });
                    app.io.emit("admin:order-status-update", {
                      orderId: String(populatedOrder._id),
                      status: populatedOrder.status,
                      orderNumber: populatedOrder.orderId,
                    });
                    app.io.to(String(driverId)).emit("driver:order-status-update", {
                      orderId: String(populatedOrder._id),
                      status: populatedOrder.status,
                      order: populatedOrder,
                      orderNumber: populatedOrder.orderId,
                    });
                  }

                  return {
                    record: record.toJSON(currentAdmin),
                    notice: {
                      message: `Successfully assigned ${driver.name} to order ${dbOrder.orderId}`,
                      type: "success",
                    },
                  };
                } catch (error) {
                  console.error("Assign Driver Error:", error);
                  return {
                    notice: { message: "Failed to assign driver. Check server logs.", type: "error" },
                  };
                }
              }

              return {
                record: record.toJSON(currentAdmin),
              };
            },
          },

          edit: {
            after: async (response, request, context) => afterEditOrderHook(response, request, context, app),
          },
        },
      },
    };
  });

  // Simplified Order Assignment Resource for Delivery app integration
  console.log("📦 Adding OrderAssignment Resource...");
  resources.push({
    resource: mongoose.models.Order,
    options: {
      id: "OrderAssignment",
      navigation: { name: "Delivery Management", icon: "Truck" },
      sort: {
        sortBy: 'createdAt',
        direction: 'desc'
      },
      listProperties: ["orderId", "status", "deliveryPartner", "driverEarning", "createdAt"],
      editProperties: ["deliveryPartner", "driverEarning"],
      filterProperties: ["orderId", "status", "deliveryPartner"],
      properties: {
        orderId: { isId: true },
        driverEarning: {
          label: "Driver Earning (₹)",
          helpText: "Set the delivery fee for the partner.",
          type: 'number'
        },
        deliveryPartner: {
          label: "Assign Driver",
          components: {
            list: Components.DriverStatus,
          },
        },
        status: {
          components: {
            list: Components.OrderStatus,
          },
        }
      },
      actions: {
        assignDriver: {
          actionType: "record",
          icon: "UserCheck",
          component: Components.AssignDriver,
          handler: async (request, response, context) => {
            const { record, currentAdmin } = context;
            // Safer way to get record ID as custom components might not always pass record context fully
            const recordId = context.record?.id || request.params.recordId;

            if (request.method === "post") {
              try {
                const { driverId, driverEarning } = request.payload;
                const Order = mongoose.models.Order;
                const DeliveryPartner = mongoose.models.DeliveryPartner;
                const dbOrder = await Order.findById(recordId);
                const driver = await DeliveryPartner.findById(driverId);

                if (!dbOrder || !driver) {
                  return { notice: { message: "Order or Driver not found", type: "error" } };
                }

                const populatedOrder = await assignDriverToOrder(dbOrder, driver, driverEarning);
                if (app.io && populatedOrder) {
                  // Notify the customer tracking room
                  app.io.to(String(populatedOrder._id)).emit("liveTrackingUpdates", {
                    ...populatedOrder.toObject(),
                    deliveryPartnerName: populatedOrder.deliveryPartner?.name || "Delivery Partner",
                  });

                  // Notify the specific driver via Socket
                  console.log(`📡 [Socket] Emitting driver:order-assigned to driver ${driverId}`);
                  app.io.to(String(driverId)).emit("driver:order-assigned", {
                    order: populatedOrder
                  });

                  // Notify via Push Notification
                  await sendPushNotification(
                    String(driverId),
                    "New Order Assigned! 📦",
                    `You have a new order #${populatedOrder.orderId} from ${populatedOrder.branch?.name || 'SabJab'}.`,
                    { orderId: String(populatedOrder._id), type: 'ORDER_ASSIGNED' },
                    'DeliveryPartner'
                  ).catch(e => console.error("Push Error:", e.message));

                  // Broad notification for admin UI
                  app.io.emit("admin:order-assigned", {
                    orderId: String(populatedOrder._id),
                    orderNumber: populatedOrder.orderId,
                    driverName: populatedOrder.deliveryPartner?.name || "Delivery Partner",
                  });

                  app.io.emit("admin:order-status-update", {
                    orderId: String(populatedOrder._id),
                    status: populatedOrder.status,
                    orderNumber: populatedOrder.orderId,
                  });

                  // Background sync for driver app
                  app.io.to(String(driverId)).emit("driver:order-status-update", {
                    orderId: String(populatedOrder._id),
                    status: populatedOrder.status,
                    order: populatedOrder,
                    orderNumber: populatedOrder.orderId,
                  });
                }

                return {
                  record: record.toJSON(currentAdmin),
                  notice: {
                    message: `Successfully assigned ${driver.name} to order ${dbOrder.orderId}`,
                    type: "success",
                  },
                };
              } catch (error) {
                console.error("Assign Driver Action Error:", error);
                return {
                  notice: { message: "Error assigning driver. Check logs.", type: "error" },
                };
              }
            }
            return { record: record.toJSON(currentAdmin) };
          },
          edit: {
            isVisible: false, // Hide redundant edit button as requested
          },
          show: { isVisible: true },
          delete: { isVisible: true },
        },
      }
    }
  });

  // Consolidate all customizations within the main map mapping logic above for consistency.

  const admin = new AdminJS({
    rootPath: "/admin",
    resources,
    componentLoader,
    dashboard: {
      component: Components.Dashboard,
    },
    pages: {
      'Component Guide': {
        component: Components.ComponentGuide,
        icon: 'Book',
      }
    },
    branding: {
      companyName: "SabJab Premium Store Admin",
      withMadeWithLove: false,
      logo: "https://res.cloudinary.com/dkihsmzv8/image/upload/v1772798078/admin_branding/admin_logo_new.png",
      theme: {
        colors: {
          primary100: "#10b981", // More vibrant Emerald
          primary80: "#059669",
          primary60: "#047857",
          accent: "#0f172a",     // Slate-900 for serious business feel
          love: "#fb7185",       // Rose Red
          grey100: "#f8fafc",    // Slate-50 Page Background
          grey80: "#ffffff",     // Card background
          grey60: "#cbd5e1",     // Slate-300
          grey40: "#e2e8f0",     // Borders
          grey20: "#64748b",     // Muted text
          filterBg: "#ffffff",   // Filter panel
          white: "#ffffff",      // Pure white
          black: "#020617",      // Deepest Slate
        },
      },
    },
    assets: {
      styles: ["/public/admin-mobile.css"],
      scripts: ["/socket.io/socket.io.js", "/public/admin-order-notify.js"],
    },
    authentication: {
      authenticate,
      cookieName: "adminjs-session",
      cookiePassword: process.env.COOKIE_PASSWORD || crypto.randomUUID(),
    },
    settings: {
      perPage: 50,
      maxPerPage: 500,
    },
  });

  // Audit Product counts
  const productCount = await mongoose.models.Product.countDocuments();
  console.log(`📊 [AdminJS Audit] Total Products in Database: ${productCount}`);
  if (productCount > 20) {
    console.log(`ℹ️ [AdminJS Audit] ${productCount} products found. Explicit 30 perPage set for 'Product' resource.`);
  }

  if (process.env.NODE_ENV !== "production") {
    admin.watch();
  }

  // ✅ Use buildAuthenticatedRouter for security
  await AdminJSFastify.buildAuthenticatedRouter(admin, {
    authenticate,
    cookiePassword: process.env.COOKIE_PASSWORD || crypto.randomUUID(),
    cookieName: "adminjs-session",
  }, app);

  console.log(`✅ AdminJS running at http://localhost:${process.env.PORT || 5001}/admin`);
}
