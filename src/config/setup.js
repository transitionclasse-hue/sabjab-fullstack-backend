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
import fs from "fs";

function logToFile(message) {
  try {
    const timestamp = new Date().toISOString();
    fs.appendFileSync('cloudinary_debug.log', `[${timestamp}] ${message}\n`);
  } catch (e) { }
}

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
};

const hydrateOrderForTracking = async (orderId) => {
  const Order = mongoose.models.Order;
  return Order.findById(orderId).populate("deliveryPartner customer branch items.item");
};

const assignDriverToOrder = async (order, driver) => {
  if (!order || !driver) return null;

  order.deliveryPartner = driver._id;
  if (order.status === "available") {
    order.status = "confirmed";
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
        $setOnInsert: {
          key: "support_contact",
          value: {
            phone: "+911234567890",
            email: "support@sabjab.com"
          },
          description: "Support contact details for the mobile app"
        },
      },
      { upsert: true, new: true }
    );
  }

  const resources = Object.values(mongoose.models).map((model) => {
    if (model.modelName === "Customer") {
      return {
        resource: model,
        options: {
          navigation: { name: "User Management", icon: "Users" },
          listProperties: ["name", "phone", "isActivated", "notificationsEnabled"],
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
          listProperties: ["title", "body", "type", "status", "sentAt"],
          actions: {
            broadcast: {
              actionType: 'resource',
              icon: 'Radio',
              component: Components.SendNotification,
              handler: async (request, response, context) => {
                if (request.method === 'post') {
                  const { title, body } = request.payload;
                  const count = await broadcastPushNotification(title, body);
                  return {
                    notice: { message: `Broadcast started for ${count} customers!`, type: 'success' },
                  };
                }
                return {};
              }
            }
          }
        },
      };
    }

    if (model.modelName === "GlobalConfig") {
      return {
        resource: model,
        options: {
          navigation: { name: "App Settings", icon: "Settings" },
          listProperties: ["key", "value", "description"],
          editProperties: ["key", "value", "description"],
        },
      };
    }

    if (model.modelName === "SupportMessage") {
      return {
        resource: model,
        options: {
          navigation: { name: "Support", icon: "HelpCircle" },
          listProperties: ["customer", "sender", "message", "createdAt"],
          filterProperties: ["customer", "sender", "createdAt"],
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

                  await SupportMessage.create({
                    customer: record.params.customer,
                    sender: 'support',
                    message: replyMessage
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
            }
          }
        },
      };
    }

    if (model.modelName === "PricingConfig") {
      return {
        resource: model,
        options: {
          listProperties: [
            "freeDeliveryEnabled",
            "freeDeliveryThreshold",
            "baseDeliveryFee",
            "updatedAt",
          ],
          editProperties: [
            "freeDeliveryEnabled",
            "freeDeliveryThreshold",
            "baseDeliveryFee",
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
            "customFees",
          ],
          showProperties: [
            "freeDeliveryEnabled",
            "freeDeliveryThreshold",
            "baseDeliveryFee",
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
            "customFees",
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
            customFees: {
              label: "Custom Fees",
              description: "Add/remove any additional fees. Each fee can be enabled/disabled.",
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
              uploadPath: (record, filename) => `${record.id() || 'new'}/${filename}`,
            },
            validation: { mimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'] },
          }),
        ],
      };
    }

    if (model.modelName === "StoreStatus") {
      return {
        resource: model,
        options: {
          listProperties: ["mode", "openingTime", "closingTime", "alertBeforeMinutes", "updatedAt"],
          editProperties: ["mode", "openingTime", "closingTime", "alertBeforeMinutes"],
          showProperties: ["mode", "openingTime", "closingTime", "alertBeforeMinutes", "updatedAt"],
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
      const categoryProvider = new CloudinaryProvider();
      const replaceCategoryKeyWithUrl = async (response, request, context) => {
        if (categoryProvider.lastUploadedUrl && context.record && context.record.isValid()) {
          console.log('🔗 Replacing Category image key with full URL:', categoryProvider.lastUploadedUrl);
          await context.record.update({ image: categoryProvider.lastUploadedUrl });
          categoryProvider.lastUploadedUrl = null;
          return { ...response, record: context.record.toJSON(context.currentAdmin) };
        }
        return response;
      };

      return {
        resource: model,
        options: {
          listProperties: ["name", "superCategory", "image"],
          editProperties: ["name", "superCategory", "uploadImage"],
          showProperties: ["name", "superCategory", "image"],
          actions: {
            new: { after: [replaceCategoryKeyWithUrl] },
            edit: { after: [replaceCategoryKeyWithUrl] },
          },
          properties: {
            name: {
              label: "Category Name",
              isRequired: true,
            },
            superCategory: {
              label: "Super Category",
              type: "reference",
              reference: "SuperCategory",
              isRequired: true,
            },
            image: {
              isVisible: { list: true, filter: false, show: true, edit: false },
              isRequired: false,
            },
            uploadImage: {
              label: "Click to Upload Image to Cloudinary",
              type: "file",
              mimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
            },
          },
        },
        features: [
          uploadFeature({
            componentLoader,
            provider: categoryProvider,
            properties: {
              key: 'image',
              file: 'uploadImage',
              uploadPath: (record, filename) => {
                const id = record.id() || `new_${Date.now()}`;
                return `${id}/${filename}`;
              },
            },
            validation: {
              mimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
            },
          }),
        ],
      };
    }

    if (model.modelName === "SubCategory") {
      const subCatProvider = new CloudinaryProvider();
      const replaceSubCatKeyWithUrl = async (response, request, context) => {
        if (subCatProvider.lastUploadedUrl && context.record && context.record.isValid()) {
          console.log('🔗 Replacing SubCategory image key with full URL:', subCatProvider.lastUploadedUrl);
          await context.record.update({ image: subCatProvider.lastUploadedUrl });
          subCatProvider.lastUploadedUrl = null;
          return { ...response, record: context.record.toJSON(context.currentAdmin) };
        }
        return response;
      };

      return {
        resource: model,
        options: {
          // Show "SubCatName (CategoryName)" in reference dropdowns
          recordRepresentation: (record) => {
            const catName = record.populated?.category?.params?.name || '';
            return catName ? `${record.params.name} (${catName})` : record.params.name;
          },
          listProperties: ["name", "category", "image"],
          editProperties: ["name", "category", "uploadImage"],
          showProperties: ["name", "category", "image"],
          actions: {
            new: { after: [replaceSubCatKeyWithUrl] },
            edit: { after: [replaceSubCatKeyWithUrl] },
            // Customize search to populate category for display in dropdowns
            search: {
              after: async (response) => {
                if (response.records) {
                  // The category should already be populated by AdminJS
                  // Just update titles to include category name
                  response.records = response.records.map(record => {
                    const catName = record.populated?.category?.params?.name || '';
                    if (catName) {
                      record.title = `${record.title} (${catName})`;
                    }
                    return record;
                  });
                }
                return response;
              },
            },
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
            uploadImage: {
              label: "Click to Upload Image to Cloudinary",
              type: "file",
              mimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
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
              uploadPath: (record, filename) => {
                const id = record.id() || `new_${Date.now()}`;
                return `${id}/${filename}`;
              },
            },
            validation: {
              mimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
            },
          }),
        ],
      };
    }

    if (model.modelName === "HomeComponent") {
      const bannerProvider = new CloudinaryProvider();
      const replaceBannerKeyWithUrl = async (response, request, context) => {
        if (bannerProvider.lastUploadedUrl && context.record && context.record.isValid()) {
          console.log('🔗 Replacing bannerImage key with full URL:', bannerProvider.lastUploadedUrl);
          await context.record.update({ bannerImage: bannerProvider.lastUploadedUrl });
          bannerProvider.lastUploadedUrl = null;
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
          listProperties: ["order", "title", "type", "isActive"],
          editProperties: ["title", "type", "isActive", "order", "bigDeal", "miniDeals", "products", "bannerImage", "carouselImages"],
          actions: {
            new: { after: [replaceBannerKeyWithUrl] },
            edit: { after: [replaceBannerKeyWithUrl] },
          },
          properties: {
            type: {
              availableValues: [
                { value: "CATEGORY_STRIP", label: "Category Strip" },
                { value: "CATEGORY_CLUSTERS", label: "2x2 Dynamic Category Grid" },
                { value: "FEATURED_DEALS", label: "Deals Section (Configurable)" },
                { value: "PRODUCT_SCROLLER", label: "Product Horizontal Scroller" },
                { value: "PRODUCT_GRID", label: "Modern Product Grid" },
                { value: "PROMO_BANNER", label: "Promotional Banner" },
                { value: "IMAGE_CAROUSEL", label: "Image Carousel Slider" }
              ],
            },
            bigDeal: {
              label: "Primary Big Deal (Optional)",
              description: "ONLY effective if type is 'Deals Section'. Select 1 main product to spotlight.",
            },
            miniDeals: {
              label: "Mini Deals (Optional)",
              description: "ONLY effective if type is 'Deals Section'. Select up to 4 smaller products.",
            },
            products: {
              label: "Products Array (Optional)",
              description: "Select products for Product Scroller, Modern Product Grid, OR Category Clusters collections.",
            },
            bannerImage: {
              isVisible: { list: true, filter: false, show: true, edit: false },
              isRequired: false,
            },
            uploadBanner: {
              label: "Click to Upload Banner Image to Cloudinary",
            },
            carouselImages: {
              label: "Carousel Image URLs (Optional)",
              description: "ONLY effective if type is 'Image Carousel Slider'. Add list of image links.",
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
              uploadPath: (record, filename) => {
                const id = record.id() || `new_${Date.now()}`;
                return `${id}/${filename}`;
              },
            },
            validation: {
              mimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
            },
          }),
        ],
      };
    }

    if (model.modelName === "Product") {
      // Store the last uploaded URL for retrieval in the after-hook
      const productProvider = new CloudinaryProvider();

      // After-hook that replaces the stored key with the full Cloudinary URL
      const replaceKeyWithUrl = async (response, request, context) => {
        const url = productProvider.lastUploadedUrl;
        const recordId = response.record?.params?._id;

        if (url && recordId) {
          logToFile(`🔗 Syncing Cloudinary URL for Product ${recordId}: ${url}`);
          console.log(`🔗 Syncing Cloudinary URL for Product ${recordId}: ${url}`);
          try {
            await mongoose.models.Product.findByIdAndUpdate(recordId, { image: url });
            // Update the response record so the UI shows the new URL immediately
            if (response.record && response.record.params) {
              response.record.params.image = url;
            }
          } catch (e) {
            logToFile(`❌ Sync Error for Product: ${e.message}`);
            console.error('❌ Sync Error for Product:', e.message);
          }
          // Important: Clear the lastUploadedUrl to prevent it from leaking to other requests
          productProvider.lastUploadedUrl = null;
        } else {
          logToFile(`ℹ️ Sync Hook called but no data: url=${url}, recordId=${recordId}`);
        }
        return response;
      };

      return {
        resource: model,
        options: {
          listProperties: ["name", "price", "stock", "isAvailable", "quantity", "superCategory", "category", "subCategory", "image"],
          editProperties: ["name", "description", "uploadFile", "price", "discountPrice", "quantity", "stock", "isAvailable", "superCategory", "category", "subCategory"],
          showProperties: ["name", "description", "price", "discountPrice", "quantity", "stock", "isAvailable", "superCategory", "category", "subCategory", "image"],
          actions: {
            new: { after: [replaceKeyWithUrl] },
            edit: { after: [replaceKeyWithUrl] },
          },
          properties: {
            name: {
              label: "Product Name",
              isRequired: true,
            },
            description: {
              type: "richtext",
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
            quantity: {
              label: "Quantity / Weight (e.g. 80gm, 1kg)",
              isRequired: true,
            },
            stock: {
              label: "Stock Quantity",
              type: "number",
              helpText: "Current inventory count for this product.",
            },
            isAvailable: {
              label: "Is Available?",
              type: "boolean",
              helpText: "Toggle to show/hide product from the store.",
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
            image: {
              isVisible: { list: true, filter: false, show: true, edit: false },
              isRequired: false,
            },
            uploadFile: {
              label: "Click to Upload Image to Cloudinary",
              type: "file",
              mimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
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
              uploadPath: (record, filename) => {
                const id = record.id() || `new_${Date.now()}`;
                return `${id}/${filename}`;
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
      return {
        resource: model,
        options: {
          navigation: {
            name: "Home Page Builder",
            icon: "Layout",
          },
          listProperties: ["name", "themeColor", "showBanner", "isDefault", "isActive"],
          editProperties: ["name", "nameAlignment", "icon", "banner", "themeColor", "showBanner", "isDefault", "isActive", "order", "components"],
          properties: {
            name: { label: "Variation Name (e.g. Holi Special)" },
            nameAlignment: {
              label: "Name Alignment (UI)",
              availableValues: [
                { value: "left", label: "Left Aligned" },
                { value: "right", label: "Right Aligned" }
              ]
            },
            themeColor: { label: "Theme Accent Color (HEX)", helpText: "Hex code for the occasion theme (e.g. #FF5733)" },
            showBanner: { label: "Show Occasion Banner?" },
            isDefault: { label: "Is Default Variation?", helpText: "Only one should be default." },
            components: {
              label: "Assigned Home Components",
              description: "Select and order components for this variation screen."
            }
          }
        }
      };
    }

    if (model.modelName !== "Order") {
      return { resource: model };
    }

    return {
      resource: model,
      options: {
        actions: {
          assignMockDriver: {
            actionType: "record",
            icon: "UserPlus",
            guard: "Assign a mock driver to this order?",
            handler: async (request, response, context) => {
              const { record } = context;
              if (!record) {
                return {
                  notice: { message: "Order record not found", type: "error" },
                };
              }

              const Order = mongoose.models.Order;
              const DeliveryPartner = mongoose.models.DeliveryPartner;

              const dbOrder = await Order.findById(record.params._id);
              if (!dbOrder) {
                return {
                  notice: { message: "Order not found", type: "error" },
                };
              }

              if (dbOrder.deliveryPartner) {
                return {
                  notice: { message: "Order already has a driver assigned", type: "info" },
                };
              }

              const driver = await DeliveryPartner.findOne({ isActivated: true }).sort({ createdAt: 1 });
              if (!driver) {
                return {
                  notice: { message: "No active drivers found. Seed mock drivers first.", type: "error" },
                };
              }

              const populatedOrder = await assignDriverToOrder(dbOrder, driver);
              if (app.io && populatedOrder) {
                app.io.to(String(populatedOrder._id)).emit("liveTrackingUpdates", {
                  ...populatedOrder.toObject(),
                  deliveryPartnerName: populatedOrder.deliveryPartner?.name || "Delivery Partner",
                });
                app.io.emit("admin:order-assigned", {
                  orderId: String(populatedOrder._id),
                  orderNumber: populatedOrder.orderId,
                  driverName: populatedOrder.deliveryPartner?.name || "Delivery Partner",
                });
              }

              return {
                record: record.toJSON(context.currentAdmin),
                notice: {
                  message: `Assigned ${driver.name || "driver"} to order ${dbOrder.orderId || dbOrder._id}`,
                  type: "success",
                },
              };
            },
          },
          markOutForDelivery: {
            actionType: "record",
            icon: "Truck",
            guard: "Mark this order as Out for Delivery?",
            handler: async (request, response, context) => {
              const { record } = context;
              if (!record) {
                return { notice: { message: "Order not found", type: "error" } };
              }

              const Order = mongoose.models.Order;
              const dbOrder = await Order.findById(record.params._id);

              if (!dbOrder.deliveryPartner) {
                return { notice: { message: "Assign a Driver first!", type: "error" } };
              }

              dbOrder.status = "arriving";
              await dbOrder.save();

              const populatedOrder = await hydrateOrderForTracking(dbOrder._id);
              if (app.io && populatedOrder) {
                app.io.to(String(populatedOrder._id)).emit("liveTrackingUpdates", {
                  ...populatedOrder.toObject(),
                  deliveryPartnerName: populatedOrder.deliveryPartner?.name || "Delivery Partner",
                });
              }

              return {
                record: record.toJSON(context.currentAdmin),
                notice: { message: "Order marked Out for Delivery! Map UI updated.", type: "success" },
              };
            },
          },
          markDelivered: {
            actionType: "record",
            icon: "CheckSquare",
            guard: "Mark this order as Delivered?",
            handler: async (request, response, context) => {
              const { record } = context;
              if (!record) {
                return { notice: { message: "Order not found", type: "error" } };
              }

              const Order = mongoose.models.Order;
              const dbOrder = await Order.findById(record.params._id);

              dbOrder.status = "delivered";
              await dbOrder.save();

              const populatedOrder = await hydrateOrderForTracking(dbOrder._id);
              if (app.io && populatedOrder) {
                app.io.to(String(populatedOrder._id)).emit("liveTrackingUpdates", {
                  ...populatedOrder.toObject(),
                  deliveryPartnerName: populatedOrder.deliveryPartner?.name || "Delivery Partner",
                });
              }

              return {
                record: record.toJSON(context.currentAdmin),
                notice: { message: "Order marked Delivered!", type: "success" },
              };
            },
          },
          edit: {
            after: async (originalResponse, request, context) => {
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

                  if (dbOrder.status === "available") {
                    dbOrder.status = "confirmed";
                    changed = true;
                  }
                }
              }

              if (changed) {
                await dbOrder.save();
              }

              const populatedOrder = await hydrateOrderForTracking(orderId);
              if (app.io && populatedOrder) {
                app.io.to(String(populatedOrder._id)).emit("liveTrackingUpdates", {
                  ...populatedOrder.toObject(),
                  deliveryPartnerName: populatedOrder.deliveryPartner?.name || "Delivery Partner",
                });
              }

              return originalResponse;
            },
          },
        },
      },
    };
  });

  const admin = new AdminJS({
    rootPath: "/admin",
    resources,
    componentLoader,
    pages: {
      'Live Support': {
        component: Components.SupportDashboard,
        icon: 'Chat',
      }
    },
    branding: {
      companyName: "SabJab Premium Store",
      withMadeWithLove: false,
      logo: "https://res.cloudinary.com/dponzgerb/image/upload/v1723444869/category/uic8gcnbzknosdvva13o.png",
      theme: {
        colors: {
          primary100: "#6F4E37", // Espresso Coffee
          primary80: "#8B5A2B",  // Caramel Brown
          primary60: "#A0522D",  // Sienna
          accent: "#3C2A21",     // Dark Roast Macchiato
          love: "#6F4E37",
          grey100: "#1A110B", // Dark Sidebar (Almost Black/Brown)
          grey80: "#2B1D14",  // Section Headers
          grey60: "#3D2A1C",  // Card borders
          grey40: "#AAAAAA",
          grey20: "#DDDDDD",
          filterBg: "#120B06", // Deepest background
          white: "#F5F0EB", // Warm text inverse
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
      cookiePassword: process.env.COOKIE_PASSWORD || "cookie-password",
    },
  });

  if (process.env.NODE_ENV !== "production") {
    admin.watch();
  }

  // ✅ IMPORTANT: In your AdminJS version, fastify app must be passed here
  await AdminJSFastify.buildRouter(admin, app);

  console.log(`✅ AdminJS running at http://localhost:${process.env.PORT || 5001}/admin`);
}
