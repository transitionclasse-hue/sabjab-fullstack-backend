import { Order, DeliveryPartner, Branch, Customer, Product, Category, Occasion, HomeComponent, Payout, WalletTransaction, GlobalConfig, GigSchedule } from "../models/index.js";
import PricingConfig from "../models/pricingConfig.js";
import GreenPointsConfig from "../models/greenPointsConfig.js";
import GreenPoints from "../models/greenPoints.js";
import Referral from "../models/referral.js";
import { expireStaleAssignedOrders, maskOrderForDriver } from "./order/order.js";
import { sendPushNotification, broadcastPushNotification } from "../utils/notification.js";

const parseBool = (v) => String(v).toLowerCase() === "true";

export const getManagerOverview = async (req, reply) => {
  try {
    await expireStaleAssignedOrders(req.server.io);
    const [totalOrders, activeOrders, deliveredOrders, customers, drivers, revenueAgg, profitAgg, activeOccasion, lowStockCount, totalProducts, availableOrders] = await Promise.all([
      Order.countDocuments({}),
      Order.countDocuments({ status: { $in: ["available", "assigned", "confirmed", "arriving", "at_location"] } }),
      Order.countDocuments({ status: "delivered" }),
      Customer.countDocuments({}),
      DeliveryPartner.countDocuments({}),
      Order.aggregate([
        { $match: { status: "delivered" } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
      ]),
      // Inventory Profit: Revenue - (Cost of Goods + Driver Earnings) for Quick orders only
      Order.aggregate([
        { $match: { status: "delivered", orderType: { $ne: "choice" } } },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.item",
            foreignField: "_id",
            as: "productInfo"
          }
        },
        { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$_id",
            totalPrice: { $first: "$totalPrice" },
            driverEarning: { $first: "$driverEarning" },
            totalCost: {
              $sum: {
                $multiply: [
                  { $ifNull: ["$productInfo.costPrice", 0] },
                  { $ifNull: ["$items.count", 1] }
                ]
              }
            }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalPrice" },
            totalCost: { $sum: "$totalCost" },
            totalDriverEarnings: { $sum: { $ifNull: ["$driverEarning", 0] } }
          }
        }
      ]),
      Occasion.findOne({ isDefault: true }).select("themeEffect searchBarStyle ultraConfig").lean().then(res => res || Occasion.findOne({ isActive: true }).sort({ order: 1 }).select("themeEffect searchBarStyle ultraConfig").lean()),
      Product.countDocuments({
        $or: [
          { $expr: { $lte: ["$stock", "$lowStockThreshold"] } },
          { 
            variations: { 
              $elemMatch: { 
                $and: [
                  { stock: { $exists: true } },
                  { $expr: { $lte: ["$stock", "$lowStockThreshold"] } }
                ] 
              } 
            } 
          }
        ]
      }).catch(() => 0),
      Product.countDocuments({}),
      Order.find({ status: "available" })
        .sort({ updatedAt: -1 })
        .limit(3)
        .populate("customer branch items.item deliveryPartner")
    ]);

    // Fetch actual low stock items (top 5)
    const lowStockItems = await Product.aggregate([
      {
        $addFields: {
          isLow: {
            $or: [
              { $lte: ["$stock", "$lowStockThreshold"] },
              {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: { $ifNull: ["$variations", []] },
                        as: "v",
                        cond: { $lte: ["$$v.stock", "$$v.lowStockThreshold"] }
                      }
                    }
                  },
                  0
                ]
              }
            ]
          }
        }
      },
      { $match: { isLow: true } },
      { $limit: 5 },
      { $sort: { stock: 1 } }
    ]);
    const populatedLowStock = await Category.populate(lowStockItems, { path: "category" });

    // Use a more robust check for variations in overview
    const lowStockCountFinal = await Product.aggregate([
      {
        $addFields: {
          isLow: {
            $or: [
              { $lte: ["$stock", "$lowStockThreshold"] },
              {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: { $ifNull: ["$variations", []] },
                        as: "v",
                        cond: { $lte: ["$$v.stock", "$$v.lowStockThreshold"] }
                      }
                    }
                  },
                  0
                ]
              }
            ]
          }
        }
      },
      { $match: { isLow: true } },
      { $count: "count" }
    ]);

    const actualLowStockCount = lowStockCountFinal[0]?.count || 0;

    const totalRevenue = revenueAgg[0]?.total || 0;

    const profitData = profitAgg[0] || { totalRevenue: 0, totalCost: 0, totalDriverEarnings: 0 };
    const inventoryProfit = Math.round(profitData.totalRevenue - profitData.totalCost - profitData.totalDriverEarnings);

    // Calculate driver availability stats (real-time vs scheduled)
    const localDateObj = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const todayStr = localDateObj.toISOString().split("T")[0];
    const hours = String(localDateObj.getUTCHours()).padStart(2, '0');
    const minutes = String(localDateObj.getUTCMinutes()).padStart(2, '0');
    const currentTimeStr = `${hours}:${minutes}`;

    const [allDrivers, schedulesToday] = await Promise.all([
      DeliveryPartner.find({}).select("isOnline").lean(),
      GigSchedule.find({ date: todayStr }).lean()
    ]);

    const driverSchedules = new Map();
    for (const s of schedulesToday) {
      if (!s.deliveryPartner) continue;
      const driverId = s.deliveryPartner.toString();
      if (!driverSchedules.has(driverId)) {
        driverSchedules.set(driverId, []);
      }
      driverSchedules.get(driverId).push(s);
    }

    let scheduledCount = 0;
    let activeAndScheduledCount = 0;
    let activeButUnscheduledCount = 0;
    let offlineAndScheduledCount = 0;

    for (const driver of allDrivers) {
      const driverId = driver._id.toString();
      const schedules = driverSchedules.get(driverId) || [];
      const isScheduledNow = schedules.some(s => currentTimeStr >= s.startTime && currentTimeStr <= s.endTime);
      const isOnlineNow = !!driver.isOnline;

      if (isScheduledNow) {
        scheduledCount++;
        if (isOnlineNow) {
          activeAndScheduledCount++;
        } else {
          offlineAndScheduledCount++;
        }
      } else {
        if (isOnlineNow) {
          activeButUnscheduledCount++;
        }
      }
    }

    const driverAvailability = {
      scheduledCount,
      activeAndScheduledCount,
      activeButUnscheduledCount,
      offlineAndScheduledCount
    };

    return reply.send({
      totalOrders,
      activeOrders,
      deliveredOrders,
      totalCustomers: customers,
      totalDrivers: drivers,
      totalRevenue,
      inventoryProfit,
      lowStockCount: actualLowStockCount,
      totalProducts: totalProducts || 0,
      availableOrders,
      lowStockItems: populatedLowStock,
      themeEffect: activeOccasion?.themeEffect || "none",
      searchBarStyle: activeOccasion?.searchBarStyle || "standard",
      driverAvailability,
    });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch overview", error: error.message });
  }
};

export const getFinanceStats = async (req, reply) => {
  try {
    const { timeframe = 'month' } = req.query;
    let startDate = new Date();

    if (timeframe === 'day') startDate.setHours(0, 0, 0, 0);
    else if (timeframe === 'week') startDate.setDate(startDate.getDate() - 7);
    else startDate.setDate(startDate.getDate() - 30);

    const matchQuery = {
      status: "delivered",
      createdAt: { $gte: startDate }
    };

    const stats = await Order.aggregate([
      { $match: matchQuery },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.item",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          totalPrice: { $first: "$totalPrice" },
          discountAmount: { $first: "$discountAmount" },
          driverEarning: { $first: "$driverEarning" },
          totalCost: {
            $sum: {
              $multiply: [
                { $ifNull: ["$productInfo.costPrice", 0] },
                { $ifNull: ["$items.count", 1] }
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          grossRevenue: { $sum: "$totalPrice" },
          totalDiscounts: { $sum: "$discountAmount" },
          totalCOGS: { $sum: "$totalCost" },
          totalDriverEarnings: { $sum: "$driverEarning" },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    const data = stats[0] || {
      grossRevenue: 0,
      totalDiscounts: 0,
      totalCOGS: 0,
      totalDriverEarnings: 0,
      orderCount: 0
    };

    const grossProfit = data.grossRevenue - data.totalCOGS;
    const ebitda = grossProfit - data.totalDriverEarnings; 
    
    // Monthly/Daily breakdown for chart
    const dailyBreakdown = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" },
          profit: { $sum: { $subtract: ["$totalPrice", "$driverEarning"] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return reply.send({
      summary: {
        ...data,
        grossProfit,
        ebitda,
        netProfit: Math.round(ebitda * 0.85), // 15% estimated other costs
      },
      dailyBreakdown,
      timeframe
    });
  } catch (error) {
    console.error('Finance stats error:', error);
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const getLowStockProducts = async (req, reply) => {
  try {
    const products = await Product.aggregate([
      {
        $addFields: {
          isLow: {
            $or: [
              { $lte: ["$stock", "$lowStockThreshold"] },
              {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: { $ifNull: ["$variations", []] },
                        as: "v",
                        cond: { $lte: ["$$v.stock", "$$v.lowStockThreshold"] }
                      }
                    }
                  },
                  0
                ]
              }
            ]
          }
        }
      },
      { $match: { isLow: true } },
      { $sort: { stock: 1 } }
    ]);

    // Populate category after aggregation
    const populatedProducts = await Category.populate(products, { path: "category" });

    return reply.send(populatedProducts);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch low stock products", error: error.message });
  }
};

export const getInventoryStats = async (req, reply) => {
  try {
    const [totalProducts, categoryStats, variationsStats] = await Promise.all([
      Product.countDocuments({}),
      Product.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "categoryInfo"
          }
        },
        { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } }
      ]),
      Product.countDocuments({ variations: { $exists: true, $not: { $size: 0 } } })
    ]);

    return reply.send({
      totalProducts,
      categoryStats: categoryStats.map(c => ({
        name: c.categoryInfo?.name || "Uncategorized",
        count: c.count
      })),
      productsWithVariations: variationsStats
    });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch inventory stats", error: error.message });
  }
};

export const updateInventoryStock = async (req, reply) => {
  try {
    const { productId, variationId, stock, threshold, rake } = req.body;
    const product = await Product.findById(productId);
    if (!product) return reply.status(404).send({ message: "Product not found" });

    if (variationId) {
      const variation = product.variations.id(variationId);
      if (!variation) return reply.status(404).send({ message: "Variation not found" });
      if (stock !== undefined) {
        variation.stock = Number(stock);
        variation.lastRestockedAt = new Date();
      }
      if (threshold !== undefined) variation.lowStockThreshold = Number(threshold);
      if (rake !== undefined) variation.rake = rake;
    } else {
      if (stock !== undefined) {
        product.stock = Number(stock);
        product.lastRestockedAt = new Date();
      }
      if (threshold !== undefined) product.lowStockThreshold = Number(threshold);
      if (rake !== undefined) product.rake = rake;
    }

    await product.save();
    return reply.send({ message: "Inventory updated successfully", product });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to update inventory", error: error.message });
  }
};

export const getManagerOrders = async (req, reply) => {
  try {
    await expireStaleAssignedOrders(req.server.io);
    const { status, activeOnly } = req.query || {};
    const query = {};
    if (status) query.status = status;
    if (parseBool(activeOnly)) query.status = { $in: ["available", "assigned", "confirmed", "arriving", "at_location"] };

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("customer branch items.item deliveryPartner");

    return reply.send(orders);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch orders", error: error.message });
  }
};

export const getManagerDrivers = async (req, reply) => {
  try {
    const drivers = await DeliveryPartner.find({}).sort({ createdAt: -1 }).populate("branch");
    return reply.send(drivers);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch drivers", error: error.message });
  }
};

export const updateDriverCodLimit = async (req, reply) => {
  try {
    const { id } = req.params;
    const { codLimit } = req.body;

    if (codLimit === undefined || codLimit < 0) {
      return reply.status(400).send({ message: "Invalid COD Limit amount" });
    }

    const driver = await DeliveryPartner.findByIdAndUpdate(
      id,
      { codLimit: Number(codLimit) },
      { new: true }
    );

    if (!driver) {
      return reply.status(404).send({ message: "Driver not found" });
    }

    return reply.send({ message: "Limit updated successfully", driver });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to update driver limit", error: error.message });
  }
};

export const getGlobalCodLimit = async (req, reply) => {
  try {
    let config = await PricingConfig.findOne({ key: "primary" });
    if (!config) {
      config = await PricingConfig.create({ key: "primary" });
    }
    return reply.send({ defaultDriverCodLimit: config.defaultDriverCodLimit });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch global COD limit", error: error.message });
  }
};

export const updateGlobalCodLimit = async (req, reply) => {
  try {
    const { defaultDriverCodLimit } = req.body;
    let config = await PricingConfig.findOne({ key: "primary" });
    if (!config) {
      config = await PricingConfig.create({ key: "primary", defaultDriverCodLimit });
    } else {
      config.defaultDriverCodLimit = defaultDriverCodLimit;
      await config.save();
    }
    return reply.send({ message: "Global COD Limit updated", defaultDriverCodLimit: config.defaultDriverCodLimit });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to update global COD limit", error: error.message });
  }
};

export const getSuggestedDriverEarning = async (req, reply) => {
  try {
    const order = await Order.findById(req.params.orderId).populate("branch");
    if (!order) return reply.status(404).send({ message: "Order not found" });

    const config = await PricingConfig.findOne({ key: "primary" });
    const { computeDriverEarning, getOrderDeliveryDistanceKm } = await import(
      "../utils/driverEarning.js"
    );
    const distanceKm = getOrderDeliveryDistanceKm(order);

    return reply.send({
      earning: computeDriverEarning(config, order),
      distanceKm: distanceKm != null ? Number(distanceKm.toFixed(2)) : null,
      mode: config?.driverEarningMode || "flat",
      unit: config?.driverRateUnit || "km",
    });
  } catch (error) {
    return reply.status(500).send({
      message: "Failed to calculate suggested driver earning",
      error: error.message,
    });
  }
};

export const assignDriverByManager = async (req, reply) => {
  try {
    const { orderId } = req.params;
    const { driverId, deliveryFee } = req.body || {};

    const [order, driver] = await Promise.all([
      Order.findById(orderId),
      DeliveryPartner.findById(driverId),
    ]);

    if (!order) return reply.status(404).send({ message: "Order not found" });
    if (!driver) return reply.status(404).send({ message: "Driver not found" });

    order.deliveryPartner = driver._id;
    order.status = "assigned";
    order.assignedAt = new Date();

    // Set custom driver earning if provided from manager, else auto-calculate
    if (deliveryFee !== undefined && deliveryFee !== null && deliveryFee !== "") {
      order.driverEarning = Number(deliveryFee);
    } else {
      const { computeDriverEarning } = await import("../utils/driverEarning.js");
      const config = await PricingConfig.findOne({ key: "primary" });
      const populated = await Order.findById(orderId).populate("branch");
      order.driverEarning = computeDriverEarning(config, populated || order);
    }

    order.deliveryPersonLocation = {
      latitude: driver.liveLocation?.latitude ?? order.pickupLocation?.latitude,
      longitude: driver.liveLocation?.longitude ?? order.pickupLocation?.longitude,
      address: "Assigned from Manager App",
    };
    await order.save();

    const populatedOrder = await Order.findById(order._id).populate(
      "customer branch items.item deliveryPartner"
    );

    req.server.io.to(String(order._id)).emit("orderConfirmed", populatedOrder);
    req.server.io.to(String(order._id)).emit("liveTrackingUpdates", {
      ...populatedOrder.toObject(),
      deliveryPartnerName: populatedOrder?.deliveryPartner?.name || "Delivery Partner",
    });
    req.server.io.emit("admin:order-assigned", {
      orderId: String(order._id),
      orderNumber: order.orderId,
      driverName: populatedOrder?.deliveryPartner?.name || "Delivery Partner",
    });
    req.server.io.emit("admin:order-status-update", {
      orderId: String(order._id),
      status: "assigned",
      orderNumber: order.orderId,
    });
    const maskedOrderForAssignedDriver = await maskOrderForDriver(populatedOrder, "DeliveryPartner");
    req.server.io.to(String(driver._id)).emit("driver:order-assigned", {
      order: maskedOrderForAssignedDriver,
    });

    // Send Push Notification to Driver
    const { sendPushNotification } = await import("../utils/notification.js");
    await sendPushNotification(
      String(driver._id),
      "New Order Assigned! 📦",
      `You have a new order #${populatedOrder.orderId} from ${populatedOrder.branch?.name || 'SabJab'}.`,
      { orderId: String(populatedOrder._id), type: 'ORDER_ASSIGNED' },
      'DeliveryPartner'
    );

    req.server.io.to(String(driver._id)).emit("driver:order-status-update", {
      orderId: String(order._id),
      status: "assigned",
      order: maskedOrderForAssignedDriver,
      orderNumber: order.orderId,
    });

    return reply.send(populatedOrder);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to assign driver", error: error.message });
  }
};

export const updateOrderStatusByManager = async (req, reply) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return reply.code(404).send({ message: "Order not found" });
    }

    const oldStatus = order.status;

    if (status === "cancelled") {
      const restrictedStatuses = ["dispatched", "in_transit", "arriving", "at_location", "reached_location", "delivered"];
      if (restrictedStatuses.includes(oldStatus)) {
        return reply.code(400).send({ message: "Order cannot be cancelled as it is already out for delivery or delivered" });
      }
    }

    order.status = status;

    if (status === "assigned" && oldStatus !== "assigned") {
      order.assignedAt = new Date();
    }

    await order.save();

    // TRIGGER EARNING LOGIC if manager marks as DELIVERED
    if (status === "delivered" && oldStatus !== "delivered") {
      console.log(`[ManagerUpdate] BUSINESS LOGIC: Processing delivery for ${orderId}`);
      order.deliveredAt = new Date();

      try {
        // Earning logic (Same as driver-side but triggered by manager)
        // Preserve custom earning if set
        if (!order.driverEarning || order.driverEarning <= 0) {
          const calculateDriverEarning = (await import("./order/order.js")).calculateDriverEarning;
          order.driverEarning = await calculateDriverEarning(order);
        }

        if (order.deliveryPartner && order.driverEarning > 0) {
          const feeTxn = await WalletTransaction.create({
            deliveryPartner: order.deliveryPartner,
            order: order._id,
            amount: order.driverEarning,
            type: "credit",
            txnType: "delivery_fee",
            description: `Delivery fee for order #${order.orderId} (via Manager)`,
            status: "completed"
          });
          console.log(`[ManagerUpdate] SUCCESS: Created delivery fee transaction ${feeTxn._id}`);
        }

        if (order.paymentMethod === "COD" && order.totalPrice > 0) {
          order.codCollected = order.totalPrice;
          if (order.deliveryPartner) {
            const codTxn = await WalletTransaction.create({
              deliveryPartner: order.deliveryPartner,
              order: order._id,
              amount: order.totalPrice,
              type: "debit",
              txnType: "cod_collection",
              description: `COD collected for order #${order.orderId} (via Manager)`,
              status: "completed"
            });
            console.log(`[ManagerUpdate] SUCCESS: Created COD collection transaction ${codTxn._id}`);
          }
        }
        await order.save();

        // Send push notification to the driver
        if (order.deliveryPartner) {
          await sendPushNotification(
            String(order.deliveryPartner),
            "Order Delivered! ✅",
            `You earned ₹${order.driverEarning || 0} for delivering order #${order.orderId}.`,
            { orderId: String(order._id), type: 'ORDER_DELIVERED' },
            'DeliveryPartner'
          ).catch(e => console.error("Driver delivery notification error:", e.message));
        }
      } catch (calcError) {
        console.error("[ManagerUpdate] Order delivery logic failed:", calcError.message);
      }
    }

    const populatedOrder = await Order.findById(order._id).populate(
      "customer branch items.item deliveryPartner"
    );

    req.server.io.to(String(order._id)).emit("liveTrackingUpdates", {
      ...populatedOrder.toObject(),
      status,
    });
    req.server.io.emit("admin:order-status-update", {
      orderId: String(order._id),
      status,
      orderNumber: populatedOrder.orderId,
    });
    if (order.deliveryPartner) {
      const maskedOrderForAssignedDriverStatus = await maskOrderForDriver(populatedOrder, "DeliveryPartner");
      req.server.io.to(String(order.deliveryPartner)).emit("driver:order-status-update", {
        orderId: String(order._id),
        status,
        order: maskedOrderForAssignedDriverStatus,
        orderNumber: populatedOrder.orderId,
      });
    }

    return reply.send(populatedOrder);
  } catch (error) {
    return reply.code(500).send({ message: "Failed to update order status", error });
  }
};

export const getManagerBranches = async (req, reply) => {
  try {
    const branches = await Branch.find({}).sort({ name: 1 }).populate("deliveryPartners");
    // Also include counts for stats
    const branchesWithStats = await Promise.all(branches.map(async (b) => {
      const driverCount = b.deliveryPartners?.length || 0;
      const orderCount = await Order.countDocuments({ branch: b._id });
      // Example revenue calculation (delivered only)
      const revenueData = await Order.aggregate([
        { $match: { branch: b._id, status: "delivered" } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
      ]);

      return {
        ...b.toObject(),
        driverCount,
        orderCount,
        revenue: revenueData[0]?.total || 0
      };
    }));

    return reply.send(branchesWithStats);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch branches", error: error.message });
  }
};

export const createManagerBranch = async (req, reply) => {
  try {
    const branch = new Branch(req.body);
    await branch.save();
    return reply.status(201).send(branch);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to create branch", error: error.message });
  }
};

export const updateManagerBranch = async (req, reply) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findByIdAndUpdate(id, req.body, { new: true });
    if (!branch) return reply.status(404).send({ message: "Branch not found" });
    return reply.send(branch);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to update branch", error: error.message });
  }
};

export const deleteManagerBranch = async (req, reply) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findByIdAndDelete(id);
    if (!branch) return reply.status(404).send({ message: "Branch not found" });
    return reply.send({ message: "Branch deleted successfully" });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to delete branch", error: error.message });
  }
};

export const getManagerCustomers = async (req, reply) => {
  try {
    const customers = await Customer.find()
      .select("-password -otp -otpExpires")
      .sort({ createdAt: -1 })
      .lean();

    // Add order statistics for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const [totalOrders, totalSpent] = await Promise.all([
          Order.countDocuments({ customer: customer._id }),
          Order.aggregate([
            { $match: { customer: customer._id, status: "delivered" } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
          ])
        ]);

        let status = 'active';
        const now = new Date();
        const lastActive = customer.lastActive ? new Date(customer.lastActive) : null;
        
        if (customer.appUninstalled) {
          status = 'uninstalled';
        } else if (!lastActive) {
          status = 'inactive';
        } else {
          const diffDays = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));
          if (diffDays > 30) status = 'inactive';
          else if (diffDays > 7) status = 'at_risk';
        }

        return {
          ...customer,
          name: customer.name || customer.email || `Customer ${customer.phone || customer._id}`,
          totalOrders: totalOrders || 0,
          totalSpent: totalSpent[0]?.total || 0,
          status,
          lastActive: customer.lastActive
        };
      })
    );

    return reply.send(customersWithStats);
  } catch (error) {
    return reply.code(500).send({ message: "Failed to fetch customers", error });
  }
};

// =====================================================
// GREEN POINTS MANAGEMENT
// =====================================================
export const getGreenPointsConfig = async (req, reply) => {
  try {
    let config = await GreenPointsConfig.findOne({});

    if (!config) {
      // Return default config if none exists
      return reply.send({
        earnRules: [],
        redeemRules: [],
        settings: {
          enabled: true,
          minRedemptionPoints: 50,
          bonusPerReferral: 10,
        },
      });
    }

    return reply.send(config);
  } catch (error) {
    return reply.code(500).send({ message: "Failed to fetch green points config", error });
  }
};

export const updateGreenPointsConfig = async (req, reply) => {
  try {
    const { earnRules, redeemRules, settings } = req.body;

    let config = await GreenPointsConfig.findOne({});

    if (!config) {
      config = new GreenPointsConfig({
        earnRules: earnRules || [],
        redeemRules: redeemRules || [],
        settings: settings || {},
      });
    } else {
      if (earnRules) config.earnRules = earnRules;
      if (redeemRules) config.redeemRules = redeemRules;
      if (settings) config.settings = { ...config.settings, ...settings };
    }

    await config.save();

    return reply.send({
      message: "Green points config updated successfully",
      config,
    });
  } catch (error) {
    return reply.code(500).send({ message: "Failed to update green points config", error });
  }
};

export const getGreenPointsStats = async (req, reply) => {
  try {
    const [
      totalGreenPoints,
      totalRedeemed,
      totalTransactions,
      topEarners,
    ] = await Promise.all([
      GreenPoints.aggregate([
        { $group: { _id: null, total: { $sum: "$totalBalance" } } },
      ]),
      GreenPoints.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $reduce: {
                  input: "$transactions",
                  initialValue: 0,
                  in: {
                    $cond: [
                      { $eq: ["$$this.type", "redeem"] },
                      { $add: ["$$value", "$$this.amount"] },
                      "$$value",
                    ],
                  },
                },
              },
            },
          },
        },
      ]),
      GreenPoints.countDocuments({}),
      GreenPoints.aggregate([
        { $sort: { totalBalance: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "customers",
            localField: "customer",
            foreignField: "_id",
            as: "customerInfo",
          },
        },
        {
          $project: {
            customer: { $arrayElemAt: ["$customerInfo.name", 0] },
            balance: "$totalBalance",
            lifetime: "$lifetime",
          },
        },
      ]),
    ]);

    return reply.send({
      totalGreenPointsInSystem: totalGreenPoints[0]?.total || 0,
      totalPointsRedeemed: totalRedeemed[0]?.total || 0,
      totalUsersWithPoints: totalTransactions,
      topEarners,
    });
  } catch (error) {
    return reply.code(500).send({ message: "Failed to fetch green points stats", error });
  }
};

// =====================================================
// REFERRAL MANAGEMENT
// =====================================================
const safeDate = (d) => {
  try {
    if (!d) return "N/A";
    const date = new Date(d);
    if (isNaN(date.getTime())) return "N/A";
    return date.toISOString().split("T")[0];
  } catch (e) {
    return "N/A";
  }
};


export const getManagerAnalytics = async (req, reply) => {
  try {
    const { range } = req.query || { range: '7d' };
    const days = range === '90d' ? 90 : range === '30d' ? 30 : 7;

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const prevStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Basic Metrics (Current Period)
    const currentStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: "delivered" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
          totalOrders: { $sum: 1 },
          customerIds: { $addToSet: "$customer" }
        }
      }
    ]);

    // Basic Metrics (Previous Period)
    const prevStats = await Order.aggregate([
      { $match: { createdAt: { $gte: prevStartDate, $lt: startDate }, status: "delivered" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
          totalOrders: { $sum: 1 },
          customerIds: { $addToSet: "$customer" }
        }
      }
    ]);

    const curr = currentStats[0] || { totalRevenue: 0, totalOrders: 0, customerIds: [] };
    const prev = prevStats[0] || { totalRevenue: 0, totalOrders: 0, customerIds: [] };

    const calcChange = (c, p) => p === 0 ? (c > 0 ? 100 : 0) : Math.round(((c - p) / p) * 100);

    // Chart Data (Daily breakdown)
    const dateMap = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dateMap[key] = {
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: 0,
        orders: 0
      };
    }

    const dailyStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: "delivered" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 }
        }
      }
    ]);

    dailyStats.forEach(stat => {
      if (dateMap[stat._id]) {
        dateMap[stat._id].revenue = stat.revenue;
        dateMap[stat._id].orders = stat.orders;
      }
    });

    const chartKeys = Object.keys(dateMap).sort();

    // Category Breakdown
    const categoryStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: "delivered" } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.item",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: "$productInfo" },
      {
        $lookup: {
          from: "categories",
          localField: "productInfo.category",
          foreignField: "_id",
          as: "categoryInfo"
        }
      },
      { $unwind: "$categoryInfo" },
      {
        $group: {
          _id: "$categoryInfo.name",
          count: { $sum: "$items.quantity" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Top Products
    const topProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: "delivered" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.item",
          sales: { $sum: "$items.quantity" }
        }
      },
      { $sort: { sales: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ["$productInfo.name", "Unknown Item"] },
          sales: 1
        }
      }
    ]);

    const activeCustomers = curr.customerIds.length;
    const prevActiveCustomers = prev.customerIds.length;
    const avgOrderValue = curr.totalOrders > 0 ? Math.round(curr.totalRevenue / curr.totalOrders) : 0;
    const prevAvgOrderValue = prev.totalOrders > 0 ? Math.round(prev.totalRevenue / prev.totalOrders) : 0;

    return reply.send({
      totalRevenue: curr.totalRevenue,
      revenueChange: calcChange(curr.totalRevenue, prev.totalRevenue),
      totalOrders: curr.totalOrders,
      ordersChange: calcChange(curr.totalOrders, prev.totalOrders),
      avgOrderValue,
      aovChange: calcChange(avgOrderValue, prevAvgOrderValue),
      activeCustomers,
      customersChange: calcChange(activeCustomers, prevActiveCustomers),
      ordersChart: {
        labels: chartKeys.map(k => dateMap[k].label),
        data: chartKeys.map(k => dateMap[k].orders)
      },
      revenueChart: {
        labels: chartKeys.map(k => dateMap[k].label),
        data: chartKeys.map(k => dateMap[k].revenue)
      },
      categoryChart: {
        labels: categoryStats.map(c => c._id),
        data: categoryStats.map(c => c.count)
      },
      topProducts
    });

  } catch (error) {
    console.error("Analytics Error:", error);
    return reply.status(500).send({ message: "Failed to fetch analytics", error: error.message });
  }
};

export const getReferralStats = async (req, reply) => {
  try {
    console.log("Fetching Manager Referral Stats [SAFE_MODE]...");

    // Use individual catches to identify exactly which query fails
    const totalReferrals = await Referral.countDocuments({}).catch(err => {
      console.error("Error in totalReferrals count:", err);
      return 0;
    });

    const activeReferralCodes = await Referral.countDocuments({ status: "active" }).catch(err => {
      console.error("Error in activeReferralCodes count:", err);
      return 0;
    });

    const redeemedCodes = await Referral.countDocuments({ status: "used" }).catch(err => {
      console.error("Error in redeemedCodes count:", err);
      return 0;
    });

    const pendingBonuses = await Referral.countDocuments({ bonusesAwarded: false, status: "used" }).catch(err => {
      console.error("Error in pendingBonuses count:", err);
      return 0;
    });

    const topReferrersRaw = await Referral.aggregate([
      {
        $group: {
          _id: "$referrer",
          referralCode: { $first: "$referralCode" },
          usageCount: { $sum: { $cond: [{ $eq: ["$status", "used"] }, 1, 0] } },
        },
      },
      { $sort: { usageCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "_id",
          as: "customerInfo",
        },
      },
    ]).catch(err => {
      console.error("Error in topReferrers aggregation:", err);
      return [];
    });

    const topReferrers = (topReferrersRaw || []).map(item => ({
      code: item.referralCode || "N/A",
      customerId: item._id,
      name: item.customerInfo?.[0]?.name || "Unknown User",
      referrals: item.usageCount || 0,
      earned: (item.usageCount || 0) * 10,
    }));

    const recentReferrals = await Referral.find({})
      .limit(20)
      .populate("referrer", "name")
      .sort({ createdAt: -1 })
      .lean()
      .catch(err => {
        console.error("Error in recentReferrals find:", err);
        return [];
      });

    const recentFormatted = (recentReferrals || []).map((ref) => {
      try {
        return {
          code: ref.referralCode || "UNKNOWN",
          referrer: ref.referrer?.name || (typeof ref.referrer === 'string' ? "ID: " + ref.referrer : "Unknown User"),
          status: ref.status || "active",
          date: safeDate(ref.createdAt),
          bonus: 10,
        };
      } catch (e) {
        return { code: "ERR", referrer: "Error", status: "active", date: "N/A", bonus: 0 };
      }
    });

    const result = {
      totalReferrals,
      activeReferralCodes,
      redeemedCodes,
      pendingBonuses,
      avgConversionRate: totalReferrals > 0 ? ((redeemedCodes / totalReferrals) * 100).toFixed(1) : 0,
      topReferrers,
      recentReferrals: recentFormatted,
    };

    return reply.send(result);
  } catch (error) {
    console.error("CRITICAL Referral Stats Error:", error);
    return reply.status(200).send({
      totalReferrals: 0,
      activeReferralCodes: 0,
      redeemedCodes: 0,
      pendingBonuses: 0,
      avgConversionRate: "0.0",
      topReferrers: [],
      recentReferrals: [],
      _debug_error: error.message
    });
  }
};

export const getAllReferralCodes = async (req, reply) => {
  try {
    console.log("Fetching All Referral Codes [SAFE_MODE]...");
    const codes = await Referral.find({})
      .populate("referrer", "name")
      .sort({ createdAt: -1 })
      .lean()
      .catch(err => {
        console.error("Error fetching referral codes list:", err);
        return [];
      });

    const formatted = (codes || []).map((code) => {
      try {
        return {
          code: code.referralCode || "N/A",
          customerId: code.referrer?._id || code.referrer || null,
          name: code.referrer?.name || (typeof code.referrer === 'string' ? 'ID: ' + code.referrer : "Unknown"),
          created: safeDate(code.createdAt),
          used: code.status === "used" ? 1 : 0,
          unused: code.status === "active" ? 1 : 0,
          status: code.status || "active",
        };
      } catch (e) {
        return { code: "ERR", name: "Error", status: "error" };
      }
    });

    return reply.send(formatted);
  } catch (error) {
    console.error("CRITICAL All Referral Codes Error:", error);
    return reply.status(200).send([]);
  }
};


// =====================================================
// HOME LAYOUT & COMPONENT MANAGEMENT
// =====================================================

export const getManagerOccasions = async (req, reply) => {
  try {
    const occasions = await Occasion.find({}).sort({ order: 1 }).populate("components");
    return reply.send(occasions);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch occasions", error: error.message });
  }
};

export const getManagerHomeComponents = async (req, reply) => {
  try {
    const components = await HomeComponent.find({}).lean();
    return reply.send(components);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch components", error: error.message });
  }
};

export const createManagerOccasion = async (req, reply) => {
  try {
    const { name, icon, banner, themeColor, themeMode, nameAlignment, isDefault, ultraConfig } = req.body;

    // If setting as default, unset others
    if (isDefault) {
      await Occasion.updateMany({}, { isDefault: false });
    }

    const occasion = new Occasion({
      name,
      icon,
      banner,
      themeColor,
      themeMode,
      nameAlignment,
      isDefault,
      ultraConfig: {
        ...(ultraConfig || {}),
        showSearchGap: ultraConfig?.showSearchGap !== false,
        showSpecialOccasion: ultraConfig?.showSpecialOccasion !== false,
        isTopBarTransparent: ultraConfig?.isTopBarTransparent || false,
        isSearchTransparent: ultraConfig?.isSearchTransparent || false,
        isOccasionTransparent: ultraConfig?.isOccasionTransparent || false,
      },
      order: (await Occasion.countDocuments({})) + 1
    });

    await occasion.save();
    return reply.status(201).send(occasion);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to create occasion", error: error.message });
  }
};

export const updateManagerOccasion = async (req, reply) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.isDefault) {
      await Occasion.updateMany({ _id: { $ne: id } }, { isDefault: false });
    }

    if (updateData.components && Array.isArray(updateData.components)) {
        const componentIds = [];
        for (const comp of updateData.components) {
            if (typeof comp === 'object' && comp._id) {
                if (comp.isActive !== undefined) {
                    await HomeComponent.findByIdAndUpdate(comp._id, { isActive: comp.isActive });
                }
                componentIds.push(comp._id);
            } else {
                componentIds.push(comp);
            }
        }
        updateData.components = componentIds;
    }

    if (updateData.ultraConfig) {
        // Use dot notation to avoid overwriting the entire ultraConfig object
        const ultraConfig = updateData.ultraConfig;
        delete updateData.ultraConfig;
        Object.keys(ultraConfig).forEach(key => {
            updateData[`ultraConfig.${key}`] = ultraConfig[key];
        });
    }

    const occasion = await Occasion.findByIdAndUpdate(id, { $set: updateData }, { new: true }).populate("components");
    if (!occasion) return reply.status(404).send({ message: "Occasion not found" });

    return reply.send(occasion);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to update occasion", error: error.message });
  }
};

export const deleteManagerOccasion = async (req, reply) => {
  try {
    const { id } = req.params;
    const occasion = await Occasion.findByIdAndDelete(id);
    if (!occasion) return reply.status(404).send({ message: "Occasion not found" });

    return reply.send({ message: "Occasion deleted successfully" });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to delete occasion", error: error.message });
  }
};

export const createManagerHomeComponent = async (req, reply) => {
  try {
    const { occasionId, ...componentData } = req.body;

    const component = new HomeComponent(componentData);
    await component.save();

    if (occasionId) {
      await Occasion.findByIdAndUpdate(occasionId, {
        $push: { components: component._id }
      });
    }

    return reply.status(201).send(component);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to create component", error: error.message });
  }
};

export const updateManagerHomeComponent = async (req, reply) => {
  try {
    const { id } = req.params;
    const component = await HomeComponent.findByIdAndUpdate(id, req.body, { new: true });
    if (!component) return reply.status(404).send({ message: "Component not found" });

    return reply.send(component);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to update component", error: error.message });
  }
};

export const deleteManagerHomeComponent = async (req, reply) => {
  try {
    const { id } = req.params;
    const component = await HomeComponent.findByIdAndDelete(id);
    if (!component) return reply.status(404).send({ message: "Component not found" });

    // Also remove from all occasions
    await Occasion.updateMany({}, { $pull: { components: id } });

    return reply.send({ message: "Component deleted successfully" });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to delete component", error: error.message });
  }
};

// =====================================================
// DRIVER FINANCIAL MANAGEMENT & REPORTING
// =====================================================

export const getManagerDriverFinance = async (req, reply) => {
  try {
    const drivers = await DeliveryPartner.find({ isActivated: true }).lean();

    const driversWithStats = await Promise.all(
      drivers.map(async (driver) => {
        // 1. Pending Payout (Completed delivery fees not yet paid out)
        // We look for 'delivery_fee' transactions that haven't been 'payout'ed
        // For simplicity in this implementation, we calculate current wallet balance for earnings
        const earningsTxns = await WalletTransaction.find({
          deliveryPartner: driver._id,
          txnType: "delivery_fee",
          status: "completed"
        }).lean();

        const payoutTxns = await WalletTransaction.find({
          deliveryPartner: driver._id,
          txnType: "payout",
          status: "completed"
        }).lean();

        const totalEarned = earningsTxns.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        const totalPaid = payoutTxns.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        const pendingPayout = Math.max(0, totalEarned - totalPaid);

        // 2. Cash in Hand (Net COD collection)
        const codTxns = await WalletTransaction.find({
          deliveryPartner: driver._id,
          txnType: { $in: ["cod_collection", "cod_settlement"] },
          status: "completed"
        }).lean();

        const cashInHand = codTxns.reduce((sum, tx) => {
          if (tx.txnType === "cod_collection") return sum + (tx.amount || 0);
          if (tx.txnType === "cod_settlement") return sum - (tx.amount || 0);
          return sum;
        }, 0);

        return {
          ...driver,
          pendingPayout,
          cashInHand: Math.max(0, cashInHand),
          totalLifetimeEarnings: totalEarned
        };
      })
    );

    return reply.send(driversWithStats);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch driver finance", error: error.message });
  }
};

export const settleDriverCod = async (req, reply) => {
  try {
    const { id } = req.params;
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return reply.status(400).send({ message: "Invalid settlement amount" });
    }

    const transaction = new WalletTransaction({
      deliveryPartner: id,
      amount: amount,
      type: "debit",
      txnType: "cod_settlement",
      status: "completed",
      description: description || "Manual COD settlement by manager"
    });

    await transaction.save();
    return reply.send({ message: "COD settled successfully", transaction });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to settle COD", error: error.message });
  }
};

export const bulkProcessPayout = async (req, reply) => {
  try {
    const { payouts } = req.body; // Array of { driverId, amount }

    if (!Array.isArray(payouts) || payouts.length === 0) {
      return reply.status(400).send({ message: "Invalid payouts data" });
    }

    const results = await Promise.all(
      payouts.map(async (p) => {
        try {
          const payout = new Payout({
            deliveryPartner: p.driverId,
            amount: p.amount,
            status: "completed",
            completedAt: new Date(),
            meta: { processedBy: "manager_bulk" }
          });
          await payout.save();

          const transaction = new WalletTransaction({
            deliveryPartner: p.driverId,
            amount: p.amount,
            type: "debit",
            txnType: "payout",
            status: "completed",
            description: "Bulk payout processed by manager"
          });
          await transaction.save();

          return { driverId: p.driverId, status: "success" };
        } catch (err) {
          return { driverId: p.driverId, status: "failed", error: err.message };
        }
      })
    );

    return reply.send({ message: "Bulk payout processing completed", results });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to process bulk payouts", error: error.message });
  }
};

export const getDriverDetailedReport = async (req, reply) => {
  try {
    const { id } = req.params;

    const [driver, transactions, payouts, orders] = await Promise.all([
      DeliveryPartner.findById(id).lean(),
      WalletTransaction.find({ deliveryPartner: id }).sort({ createdAt: -1 }).limit(50).lean(),
      Payout.find({ deliveryPartner: id }).sort({ createdAt: -1 }).limit(20).lean(),
      Order.find({ deliveryPartner: id }).sort({ createdAt: -1 }).limit(20).lean()
    ]);

    if (!driver) return reply.status(404).send({ message: "Driver not found" });

    return reply.send({
      driver,
      transactions,
      payouts,
      recentOrders: orders
    });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch driver report", error: error.message });
  }
};

export const getManagerDispatchOrders = async (req, reply) => {
  try {
    const orders = await Order.find({
      status: { $in: ["confirmed", "arriving", "at_location"] }
    }).populate("deliveryPartner branch customer").sort({ updatedAt: -1 });
    return reply.send(orders);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch dispatch orders", error: error.message });
  }
};

export const getManagerDriverRankings = async (req, reply) => {
  try {
    const drivers = await DeliveryPartner.find({}).lean();
    return reply.send(drivers);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch rankings", error: error.message });
  }
};

export const getManagerFinanceHistory = async (req, reply) => {
  try {
    const history = await WalletTransaction.find({
      txnType: { $in: ["payout", "cod_settlement"] }
    }).populate("deliveryPartner").sort({ createdAt: -1 }).limit(50);
    return reply.send(history);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch finance history", error: error.message });
  }
};

export const getManagerDriverActivity = async (req, reply) => {
  try {
    const drivers = await DeliveryPartner.find({}, "name email phone isOnline lastSeen batteryLevel liveLocation branch").populate("branch").lean();
    return reply.send(drivers);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch driver activity", error: error.message });
  }
};

// =====================================================
// SAFE MODE (WEBVIEW) CONFIGURATION
// =====================================================

export const getSafeModeConfig = async (req, reply) => {
  try {
    const config = await GlobalConfig.findOne({ key: "safe_mode_config" }).lean();
    if (!config) {
      return reply.send({
        success: true,
        data: {
          isWebViewMode: false,
          webViewUrl: "https://sabjab.com"
        }
      });
    }
    return reply.send({ success: true, data: config.value });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch safe mode config", error: error.message });
  }
};

export const updateSafeModeConfig = async (req, reply) => {
  try {
    const { isWebViewMode, webViewUrl } = req.body;
    let config = await GlobalConfig.findOne({ key: "safe_mode_config" });

    if (!config) {
      config = new GlobalConfig({
        key: "safe_mode_config",
        value: { isWebViewMode, webViewUrl },
        description: "Controls the WebView fallback for native apps (Safe Mode)"
      });
    } else {
      config.value = { isWebViewMode, webViewUrl };
    }

    await config.save();
    return reply.send({ success: true, message: "Safe Mode config updated successfully", data: config.value });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to update safe mode config", error: error.message });
  }
};

export const adjustCustomerWallet = async (req, reply) => {
  try {
    const { customerId } = req.params;
    const { amount, type, txnType, description } = req.body;

    if (!amount || amount <= 0) {
      return reply.status(400).send({ message: "Invalid amount" });
    }

    if (!["credit", "debit"].includes(type)) {
      return reply.status(400).send({ message: "Type must be credit or debit" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return reply.status(404).send({ message: "Customer not found" });
    }

    const transaction = await WalletTransaction.create({
      customer: customerId,
      amount: Number(amount),
      type,
      txnType: txnType || "manual_adjustment",
      description: description || `Manual adjustment by Manager`,
      status: "completed"
    });

    return reply.send({
      success: true,
      message: `Wallet ${type === 'credit' ? 'credited' : 'debited'} successfully`,
      transaction
    });
  } catch (error) {
    console.error("Adjust Wallet Error:", error);
    return reply.status(500).send({ message: "Failed to adjust wallet", error: error.message });
  }
};

export const createManagerDriver = async (req, reply) => {
  try {
    const { name, phone, email, vehicleType, licenseNumber, branch, password } = req.body;
    const { DeliveryPartner } = await import("../models/user.js");
    
    const newDriver = new DeliveryPartner({
      name,
      phone,
      email: email || undefined,
      vehicleType,
      licenseNumber,
      branch: branch || undefined,
      role: "DeliveryPartner",
      isActivated: true,
      password: password || "password123" // Use provided password or default
    });

    await newDriver.save();
    return reply.status(201).send(newDriver);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to create driver", error: error.message });
  }
};

export const updateManagerDriver = async (req, reply) => {
  try {
    const { id } = req.params;
    const { DeliveryPartner } = await import("../models/user.js");
    
    // findByIdAndUpdate bypasses pre-save hooks (like password hashing)
    // So we must manually fetch, update, and save
    const driver = await DeliveryPartner.findById(id);
    if (!driver) return reply.status(404).send({ message: "Driver not found" });

    // Update all fields from req.body
    Object.keys(req.body).forEach(key => {
      // Don't update empty password
      if (key === 'password' && !req.body[key]) return;
      
      // Handle empty email and branch to avoid MongoDB CastError or DuplicateKey errors
      if ((key === 'email' || key === 'branch') && !req.body[key]) {
        driver[key] = undefined;
        return;
      }
      
      driver[key] = req.body[key];
    });

    await driver.save(); // This triggers the bcrypt hash pre-save hook
    return reply.send(driver);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to update driver", error: error.message });
  }
};

export const deleteManagerDriver = async (req, reply) => {
  try {
    const { id } = req.params;
    const { DeliveryPartner } = await import("../models/user.js");
    const deletedDriver = await DeliveryPartner.findByIdAndDelete(id);
    if (!deletedDriver) return reply.status(404).send({ message: "Driver not found" });
    return reply.send({ success: true, message: "Driver deleted successfully" });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to delete driver", error: error.message });
  }
};

export const getHomeScreenConfig = async (req, reply) => {
  try {
    const config = await GlobalConfig.findOne({ key: "active_home_screen" }).lean();
    return reply.send({ 
      success: true, 
      version: config?.value || "HomeScreen" 
    });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch home screen config", error: error.message });
  }
};

export const updateHomeScreenConfig = async (req, reply) => {
  try {
    const { version } = req.body;
    if (!["HomeScreen", "PremiumHomeScreen", "UltraPremiumHomeScreen"].includes(version)) {
      return reply.status(400).send({ message: "Invalid home screen version" });
    }

    await GlobalConfig.findOneAndUpdate(
      { key: "active_home_screen" },
      { value: version },
      { upsert: true }
    );

    return reply.send({ success: true, message: `Switched to ${version}` });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to update home screen config", error: error.message });
  }
};


export const getOrderMaskingConfig = async (req, reply) => {
  try {
    const config = await GlobalConfig.findOne({ key: "order_masking_config" });
    if (!config) {
      return reply.send({
        success: true,
        data: {
          maskCustomerNumber: false,
          proxyNumber: "+911234567890"
        }
      });
    }
    return reply.send({ success: true, data: config.value });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch order masking config", error: error.message });
  }
};

export const updateOrderMaskingConfig = async (req, reply) => {
  try {
    const { maskCustomerNumber, proxyNumber } = req.body;
    let config = await GlobalConfig.findOne({ key: "order_masking_config" });

    if (!config) {
      config = new GlobalConfig({
        key: "order_masking_config",
        value: { maskCustomerNumber, proxyNumber },
        description: "Mask customer phone numbers from drivers. If enabled, drivers see the proxyNumber instead."
      });
    } else {
      config.value = { maskCustomerNumber, proxyNumber };
    }

    await config.save();
    return reply.send({ success: true, message: "Order masking config updated successfully", data: config.value });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to update order masking config", error: error.message });
  }
};

export const getHighValueOrderConfig = async (req, reply) => {
  try {
    const config = await GlobalConfig.findOne({ key: "high_value_order_config" });
    if (!config) {
      return reply.send({
        success: true,
        data: {
          enabled: true,
          threshold: 1000
        }
      });
    }
    return reply.send({ success: true, data: config.value });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch high value order config", error: error.message });
  }
};

export const updateHighValueOrderConfig = async (req, reply) => {
  try {
    const { enabled, threshold } = req.body;
    let config = await GlobalConfig.findOne({ key: "high_value_order_config" });

    if (!config) {
      config = new GlobalConfig({
        key: "high_value_order_config",
        value: { enabled, threshold },
        description: "Manage security for high-value orders. If order value > threshold, OTP is mandatory."
      });
    } else {
      config.value = { enabled, threshold };
    }

    await config.save();
    return reply.send({ success: true, message: "High value order config updated successfully", data: config.value });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to update high value order config", error: error.message });
  }
};
export const getComponentPreviews = async (req, reply) => {
  try {
    const config = await GlobalConfig.findOne({ key: "component_previews" });
    return reply.send({ success: true, data: config?.value || {} });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch component previews", error: error.message });
  }
};

export const updateComponentPreview = async (req, reply) => {
  try {
    const { type, imageUrl } = req.body;
    let config = await GlobalConfig.findOne({ key: "component_previews" });

    if (!config) {
      config = new GlobalConfig({
        key: "component_previews",
        value: { [type]: imageUrl },
        description: "Mapping of component types to screenshot URLs for the Component Guide."
      });
    } else {
      const newValue = { ...config.value, [type]: imageUrl };
      config.value = newValue;
      config.markModified('value');
    }

    await config.save();
    return reply.send({ success: true, message: "Preview updated successfully", data: config.value });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to update component preview", error: error.message });
  }
};

export const sendManualNotification = async (req, reply) => {
  try {
    const { target, userId, title, body, userType, data } = req.body;

    if (!title || !body) {
      return reply.status(400).send({ message: "Title and Body are required" });
    }

    if (target === "individual") {
      if (!userId) return reply.status(400).send({ message: "UserId is required for individual target" });
      await sendPushNotification(userId, title, body, data || {}, userType || "Customer");
      return reply.send({ success: true, message: "Individual notification sent successfully" });
    } else if (target === "broadcast") {
      await broadcastPushNotification(title, body, data || {}, userType || "Customer");
      return reply.send({ success: true, message: `Broadcast sent to all ${userType}s` });
    } else {
      return reply.status(400).send({ message: "Invalid target. Use 'individual' or 'broadcast'" });
    }
  } catch (error) {
    console.error("Manual Notification Error:", error);
    return reply.status(500).send({ message: "Failed to send notification", error: error.message });
  }
};

export const getAssignmentTimeoutConfig = async (req, reply) => {
  try {
    const config = await GlobalConfig.findOne({ key: "assignment_timeout_config" });
    if (!config) {
      return reply.send({
        success: true,
        data: {
          minutes: 5
        }
      });
    }
    return reply.send({ success: true, data: config.value });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch assignment timeout config", error: error.message });
  }
};

export const updateAssignmentTimeoutConfig = async (req, reply) => {
  try {
    const { minutes } = req.body;
    if (typeof minutes !== 'number' || minutes <= 0) {
      return reply.status(400).send({ message: "Invalid minutes value. Must be a positive number." });
    }
    let config = await GlobalConfig.findOne({ key: "assignment_timeout_config" });

    if (!config) {
      config = new GlobalConfig({
        key: "assignment_timeout_config",
        value: { minutes },
        description: "Timeout duration (in minutes) for a driver to confirm an assigned order before it returns to Available status."
      });
    } else {
      config.value = { minutes };
    }

    await config.save();
    return reply.send({ success: true, message: "Assignment timeout config updated successfully", data: config.value });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to update assignment timeout config", error: error.message });
  }
};

export const getBawalConfig = async (req, reply) => {
  try {
    const config = await GlobalConfig.findOne({ key: "bawal_config" }).lean();
    if (!config) {
      return reply.send({
        success: true,
        data: {
          enabled: true
        }
      });
    }
    return reply.send({ success: true, data: config.value });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch Bawal config", error: error.message });
  }
};

export const updateBawalConfig = async (req, reply) => {
  try {
    const { enabled } = req.body;
    let config = await GlobalConfig.findOne({ key: "bawal_config" });

    if (!config) {
      config = new GlobalConfig({
        key: "bawal_config",
        value: { enabled },
        description: "Controls whether the Reels / Bawal system is enabled globally"
      });
    } else {
      config.value = { enabled };
    }

    await config.save();
    return reply.send({ success: true, message: "Bawal config updated successfully", data: config.value });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to update Bawal config", error: error.message });
  }
};


