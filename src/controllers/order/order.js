import { Order, DeliveryPartner, Customer, Branch, Product, Coupon, GreenPoints, GreenPointsConfig, Referral, WalletTransaction, Admin, GlobalConfig } from "../../models/index.js";
import PricingConfig from "../../models/pricingConfig.js";
import { sendPushNotification } from "../../utils/notification.js";
import { getDistanceKm, isValidLatLng } from "../../utils/geo.js";

const ORDER_STATUS = {
    AVAILABLE: "available",
    ASSIGNED: "assigned",
    CONFIRMED: "confirmed",
    ARRIVING: "arriving",
    AT_LOCATION: "at_location",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
};
const ASSIGNMENT_TIMEOUT_MS = 5 * 60 * 1000;

const VALID_DRIVER_STATUSES = new Set([
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.ARRIVING,
    ORDER_STATUS.AT_LOCATION,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.CANCELLED,
]);

// Helper to mask order details for drivers if configured
export const maskOrderForDriver = async (order, role) => {
    if (role !== "DeliveryPartner") return order;

    try {
        const config = await GlobalConfig.findOne({ key: "order_masking_config" });
        if (config?.value?.maskCustomerNumber && config?.value?.proxyNumber) {
            const orderObj = typeof order.toObject === 'function' ? order.toObject() : order;
            if (orderObj.customerInfo) {
                orderObj.customerInfo.phone = config.value.proxyNumber;
                orderObj.customerInfo.isMasked = true; // Flag for frontend to show "Masked" tag if wanted
            }
            return orderObj;
        }
    } catch (err) {
        console.error("Masking logic error:", err.message);
    }
    return order;
};

export const calculateDriverEarning = async (orderTotal = 0) => {
    const config = await PricingConfig.findOne({ key: "primary" });
    const driverFee = config?.defaultDriverEarning ?? 30; // UPDATED: Use defaultDriverEarning config
    return driverFee;
};

const isAssignmentExpired = (assignedAt) =>
    Boolean(assignedAt) && (Date.now() - new Date(assignedAt).getTime() >= ASSIGNMENT_TIMEOUT_MS);

export const expireStaleAssignedOrders = async (io = null) => {
    const cutoff = new Date(Date.now() - ASSIGNMENT_TIMEOUT_MS);
    const staleOrders = await Order.find({
        status: ORDER_STATUS.ASSIGNED,
        assignedAt: { $lte: cutoff },
        deliveryPartner: { $ne: null },
    });

    if (!staleOrders.length) return 0;

    for (const staleOrder of staleOrders) {
        const previousDriverId = staleOrder.deliveryPartner ? String(staleOrder.deliveryPartner) : null;
        staleOrder.status = ORDER_STATUS.AVAILABLE;
        staleOrder.deliveryPartner = undefined;
        staleOrder.assignedAt = undefined;
        staleOrder.deliveryPersonLocation = undefined;
        await staleOrder.save();

        if (io) {
            io.to(String(staleOrder._id)).emit("liveTrackingUpdates", {
                ...staleOrder.toObject(),
                deliveryPartnerName: "",
            });
            io.emit("admin:order-status-update", {
                orderId: String(staleOrder._id),
                status: ORDER_STATUS.AVAILABLE,
                orderNumber: staleOrder.orderId,
            });
            if (previousDriverId) {
                io.to(previousDriverId).emit("driver:assignment-expired", {
                    orderId: String(staleOrder._id),
                    orderNumber: staleOrder.orderId,
                });
            }
        }
    }

    return staleOrders.length;
};

// Create a new order (Initial Customer Action)
export const createOrder = async (req, reply) => {
    try {
        const { userId } = req.user;
        const { items, branchId, totalAmount, deliveryAddress, couponCode, paymentMethod, orderType } = req.body;

        const customerData = await Customer.findById(userId);
        let branchData = await Branch.findById(branchId);

        // FALLBACK: If no branchId provided or branch not found, pick the first available branch
        if (!branchData) {
            console.log("No valid branchId provided, falling back to first available branch");
            branchData = await Branch.findOne({});
            if (!branchData) {
                return reply.status(404).send({ message: "No branches registered in system" });
            }
        }

        console.log("=== CREATE ORDER DEBUG ===");
        console.log("Token userId:", userId);
        console.log("Found Customer:", customerData ? "YES" : "NO");
        console.log("Found Branch:", branchData ? "YES" : "NO");

        if (!customerData) {
            console.log("Customer not found for ID:", userId);
            return reply.status(404).send({ message: "Customer not found" });
        }

        const resolvedBranchId = branchData?._id;
        if (!resolvedBranchId) {
            return reply.status(400).send({ message: "Unable to resolve branch for this order" });
        }

        // --- GEOFENCING VALIDATION ---
        const userLat = Number(deliveryAddress?.latitude || deliveryAddress?.coords?.lat);
        const userLng = Number(deliveryAddress?.longitude || deliveryAddress?.coords?.lng);
        const branchLat = Number(branchData.location?.latitude);
        const branchLng = Number(branchData.location?.longitude);

        if (isValidLatLng(userLat, userLng) && isValidLatLng(branchLat, branchLng)) {
            const distance = getDistanceKm(userLat, userLng, branchLat, branchLng);
            const radius = branchData.deliveryRadius || 2.5;

            if (distance > radius) {
                console.log(`[Geofence] REJECTED: Distance ${distance.toFixed(2)}km > Radius ${radius}km`);
                return reply.status(400).send({
                    message: `We do not deliver to this location yet. Your distance (${distance.toFixed(2)} km) exceeds our delivery range (${radius} km).`,
                    outOfRange: true,
                    distance: distance.toFixed(2),
                    radius
                });
            }
        }
        // -----------------------------

        // --- STOCK VALIDATION & ATOMIC UPDATES ---
        const stockUpdates = [];
        for (const item of items) {
            const pid = item._id || item.id;
            const product = await Product.findById(pid);

            if (!product) {
                return reply.status(404).send({ message: `Product ${pid} not found` });
            }

            if (!product.isAvailable) {
                return reply.status(400).send({ message: `${product.name} is currently unavailable` });
            }

            const requestedCount = item.qty || item.quantity || item.count || 1;

            // NEW: User Stock Limit per Product check
            if (product.userStockLimit && requestedCount > product.userStockLimit) {
                return reply.status(400).send({ 
                    message: `Limit exceeded: You can buy maximum ${product.userStockLimit} units of ${product.name}`,
                    limitExceeded: true
                });
            }

            const variationId = item.variationId || item.variation?._id || item.variation?.id;

            let price = product.price;
            let variationData = null;

            if (variationId || item.variation?.name) {
                // Try to find variation by ID first, then fallback to Name matching
                let variation = null;
                if (variationId) {
                    variation = product.variations.id(variationId);
                }

                if (!variation && item.variation?.name) {
                    console.log(`[Order] ID match failed for ${product.name}, falling back to Name: ${item.variation.name}`);
                    variation = product.variations.find(v => v.name === item.variation.name);
                }

                if (!variation) {
                    return reply.status(400).send({ message: `Variation not found for ${product.name}` });
                }

                if (!variation.isAvailable) {
                    return reply.status(400).send({ message: `Variation ${variation.name} of ${product.name} is unavailable` });
                }

                if (variation.stock !== undefined && variation.stock < requestedCount) {
                    return reply.status(400).send({
                        message: `Insufficient stock for ${product.name} (${variation.name}). Available: ${variation.stock}`,
                        shortage: true
                    });
                }
                price = variation.price;
                variationData = {
                    name: variation.name,
                    price: variation.price,
                    discountPrice: variation.discountPrice
                };
                stockUpdates.push({ product, requestedCount, variationId: variation._id, isVariation: true });
            } else {
                if (product.stock !== undefined && product.stock < requestedCount) {
                    return reply.status(400).send({
                        message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
                        shortage: true
                    });
                }
                stockUpdates.push({ product, requestedCount, isVariation: false });
                variationData = {
                    name: "Standard",
                    price: product.price,
                    discountPrice: product.discountPrice || product.price
                };
            }

            item.itemPrice = price; // Store for total calculation
            item.variationData = variationData;
            item.isChoice = product.isChoice;
            item.deliveryDays = product.deliveryDays || 0;
        }

        // Calculate actual itemsTotal from DB prices for coupon validation
        const itemsTotal = stockUpdates.reduce((sum, u, idx) => sum + (items[idx].itemPrice || 0) * u.requestedCount, 0);

        // Atomic stock decrementing
        for (const update of stockUpdates) {
            if (update.isVariation) {
                const variation = update.product.variations.id(update.variationId);
                variation.stock -= update.requestedCount;
            } else {
                update.product.stock -= update.requestedCount;
            }
            await update.product.save();
        }
        // ----------------------------------------

        // --- COUPON VALIDATION ---
        let discountAmount = 0;
        let validatedCouponCode = null;

        if (couponCode) {
            const coupon = await Coupon.findOne({
                code: couponCode.toUpperCase(),
                isActive: true,
                expirationDate: { $gt: new Date() },
                $or: [
                    { usageLimit: null },
                    { $expr: { $lt: ["$usedCount", "$usageLimit"] } }
                ]
            });

            if (coupon) {
                // Calculate item total for minOrderAmount check

                if (!coupon.minOrderAmount || itemsTotal >= coupon.minOrderAmount) {
                    validatedCouponCode = coupon.code;
                    if (coupon.discountType === "percentage") {
                        discountAmount = (itemsTotal * coupon.discountValue) / 100;
                        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                            discountAmount = coupon.maxDiscount;
                        }
                    } else {
                        discountAmount = coupon.discountValue;
                    }

                    // Increment usedCount
                    coupon.usedCount += 1;
                    await coupon.save();
                }
            }
        }
        // -------------------------

        // --- RETURN WINDOW CALCULATION ---
        const orderReturnWindow = Math.max(...stockUpdates.map(u => u.product.returnWindow || 0), 0);
        // ---------------------------------

        const newOrder = new Order({
            customer: userId,
            items: items.map((item, idx) => {
                const deliveryDays = item.deliveryDays || 0;
                const expectedDate = new Date();
                expectedDate.setDate(expectedDate.getDate() + deliveryDays);

                return {
                    id: item._id || item.id,
                    item: item._id || item.id,
                    count: item.qty || item.quantity || item.count || 1,
                    variation: item.variationData,
                    returnWindow: stockUpdates[idx].product.returnWindow || 0,
                    isChoice: item.isChoice,
                    deliveryStatus: item.isChoice ? "pending" : "delivered", // Quick deliveries are "delivered" in terms of Choice logistics
                    expectedDate: expectedDate
                };
            }),
            orderType: orderType || "quick",
            branch: resolvedBranchId,
            totalPrice: Number(totalAmount),
            paymentMethod: paymentMethod || "COD",
            couponCode: validatedCouponCode,
            discountAmount: discountAmount,
            returnWindow: orderReturnWindow, // SNAPSHOT the return window
            customerInfo: {
                name: deliveryAddress?.recipientName || customerData.name || "Customer",
                phone: deliveryAddress?.recipientPhone || customerData.phone || "No Phone",
            },
            deliveryLocation: {
                latitude: deliveryAddress?.coords?.lat || deliveryAddress?.latitude || 0,
                longitude: deliveryAddress?.coords?.lng || deliveryAddress?.longitude || 0,
                address: deliveryAddress ? (deliveryAddress.address || `${deliveryAddress.houseNo}, ${deliveryAddress.area}`) : "No address available",
            },
            pickupLocation: {
                latitude: branchData?.location?.latitude ?? null,
                longitude: branchData?.location?.longitude ?? null,
                address: branchData?.address ?? "Store",
            },
        });

        // --- HIGH VALUE ORDER OTP LOGIC ---
        try {
            const hvc = await GlobalConfig.findOne({ key: "high_value_order_config" });
            if (hvc?.value?.enabled && totalAmount >= (hvc.value.threshold || 1000)) {
                newOrder.isHighValueOrder = true;
                newOrder.deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP
                console.log(`[OrderOTP] Secure OTP ${newOrder.deliveryOtp} generated for Order #${newOrder.orderId} (Value: ${totalAmount})`);
            }
        } catch (hvcError) {
            console.error("[OTP] High-value config fetch failed:", hvcError.message);
        }
        // ----------------------------------

        // --- REWARD COINS CALCULATION ---
        try {
            const pricingConfig = await PricingConfig.findOne({ key: "primary" });
            if (pricingConfig?.rewardCoinsEnabled && itemsTotal >= (pricingConfig.minAmountForCoins || 0)) {
                let eligibleTotal = 0;
                for (const item of items) {
                    const productId = item._id || item.id;
                    const product = await Product.findById(productId).populate("category");
                    if (product?.category?.canEarnCoins !== false) {
                        const itemQty = item.qty || item.quantity || item.count || 1;
                        eligibleTotal += (item.itemPrice || 0) * itemQty;
                    }
                }
                const coinsEarned = Math.floor((eligibleTotal * (pricingConfig.rewardCoinsPercentage || 1)) / 100);
                if (coinsEarned > 0) {
                    newOrder.rewardCoinsEarned = coinsEarned;
                    console.log(`[OrderRewards] Calculated ${coinsEarned} SabJab Coins for Order #${newOrder.orderId} (Eligible Total: ${eligibleTotal})`);
                }
            }
        } catch (rewardError) {
            console.error("[OrderRewards] Calculation failed:", rewardError.message);
        }
        // --------------------------------
        newOrder.driverEarning = await calculateDriverEarning(Number(totalAmount));

        const savedOrder = await newOrder.save();
        const populatedOrder = await Order.findById(savedOrder._id).populate(
            "customer branch items.item deliveryPartner"
        );

        // Admin panel realtime notification + initial room payload
        req.server.io.emit("admin:new-order", {
            orderId: String(savedOrder._id),
            orderNumber: savedOrder.orderId,
            status: savedOrder.status,
            createdAt: savedOrder.createdAt,
        });
        req.server.io.to(String(savedOrder._id)).emit("liveTrackingUpdates", {
            ...populatedOrder.toObject(),
            deliveryPartnerName: populatedOrder?.deliveryPartner?.name || "",
        });

        // Notify all online drivers about the new available order (ONLY for Quick orders)
        if (savedOrder.orderType === "quick") {
            console.log(`📡 [Socket] Emitting driver:new-order for order ${populatedOrder.orderId}`);
            const maskedOrderForDriverBatch = await maskOrderForDriver(populatedOrder, "DeliveryPartner");
            req.server.io.emit("driver:new-order", {
                order: maskedOrderForDriverBatch
            });
        }

        // 🆕 NEW: Push Notifications
        (async () => {
            try {
                if (savedOrder.orderType === "quick") {
                    const onlineDrivers = await DeliveryPartner.find({ isOnline: true, pushToken: { $ne: null } });
                    for (const driver of onlineDrivers) {
                        await sendPushNotification(
                            driver._id,
                            "New Order Available! 🚀",
                            `New order #${populatedOrder.orderId} from ${populatedOrder.branch?.name || "SabJab"}`,
                            { orderId: String(savedOrder._id), type: "new_order" },
                            "DeliveryPartner"
                        );
                    }
                }

                // 2. Notify Admins/Managers
                const admins = await Admin.find({ pushToken: { $ne: null } });
                for (const admin of admins) {
                    await sendPushNotification(
                        admin._id,
                        "New Order Received! 📋",
                        `Order #${populatedOrder.orderId} placed by ${populatedOrder.customer?.name || "Customer"}`,
                        { orderId: String(savedOrder._id), type: "admin_new_order" },
                        "Admin"
                    );
                }
            } catch (err) {
                console.error("New order push failed:", err);
            }
        })();

        return reply.status(201).send({ order: savedOrder, message: "Order created successfully" });
    } catch (error) {
        console.error("Order Creation Error:", error);
        return reply.status(500).send({ message: "Failed to create order", error: error.message });
    }
};

// Confirm Order (Assign Delivery Partner)
export const confirmOrder = async (req, reply) => {
    try {
        const { orderId } = req.params; //
        const { userId } = req.user; //
        const { deliveryPersonLocation } = req.body; //

        const deliveryPerson = await DeliveryPartner.findById(userId); //
        if (!deliveryPerson) {
            return reply.status(404).send({ message: "Delivery Person not found" }); //
        }

        const order = await Order.findById(orderId); //
        if (!order) {
            return reply.status(404).send({ message: "Order not found" }); //
        }

        if (order.status === ORDER_STATUS.ASSIGNED && isAssignmentExpired(order.assignedAt)) {
            order.status = ORDER_STATUS.AVAILABLE;
            order.deliveryPartner = undefined;
            order.assignedAt = undefined;
            order.deliveryPersonLocation = undefined;
            await order.save();
            return reply.status(400).send({ message: "Assignment expired. Order returned to manager." });
        }

        if (![ORDER_STATUS.AVAILABLE, ORDER_STATUS.ASSIGNED].includes(order.status)) {
            return reply.status(400).send({ message: "Order is not available for confirmation" }); //
        }

        order.status = ORDER_STATUS.CONFIRMED; //
        order.deliveryPartner = userId; //
        order.deliveryPersonLocation = {
            latitude: deliveryPersonLocation?.latitude || 0,
            longitude: deliveryPersonLocation?.longitude || 0,
            address: deliveryPersonLocation?.address || "Location detail missing",
        };

        await order.save(); //
        const populatedOrder = await Order.findById(order._id).populate(
            "customer branch items.item deliveryPartner"
        );
        req.server.io.to(orderId).emit('orderConfirmed', populatedOrder); //
        req.server.io.emit("admin:order-assigned", {
            orderId: String(order._id),
            orderNumber: order.orderId,
            driverName: populatedOrder?.deliveryPartner?.name || "Delivery Partner",
        });
        req.server.io.emit("admin:order-status-update", {
            orderId: String(order._id),
            status: ORDER_STATUS.CONFIRMED,
            orderNumber: order.orderId,
        });
        const maskedOrderForAssignedDriver = await maskOrderForDriver(populatedOrder, "DeliveryPartner");
        req.server.io.to(String(userId)).emit("driver:order-status-update", {
            orderId: String(order._id),
            status: ORDER_STATUS.CONFIRMED,
            order: maskedOrderForAssignedDriver,
            orderNumber: order.orderId,
        });

        return reply.send(maskedOrderForAssignedDriver);
    } catch (error) {
        return reply.status(500).send({ message: "Failed to confirm order", error });
    }
};

// Update Order Status (Live Tracking Updates)
export const updateOrderStatus = async (req, reply) => {
    try {
        const { orderId } = req.params;
        const { status, deliveryPersonLocation } = req.body;
        const { userId } = req.user;

        const deliveryPerson = await DeliveryPartner.findById(userId);
        if (!deliveryPerson) {
            return reply.status(404).send({ message: "Delivery Person not found" });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return reply.status(404).send({ message: "Order not found" });
        }

        if ([ORDER_STATUS.CANCELLED, ORDER_STATUS.DELIVERED].includes(order.status)) {
            return reply.status(400).send({ message: "Order cannot be updated" });
        }

        if (order.deliveryPartner && order.deliveryPartner.toString() !== userId) {
            return reply.status(403).send({ message: "Unauthorized. You are not the assigned delivery partner." });
        }

        if (!order.deliveryPartner && status !== ORDER_STATUS.CONFIRMED) {
            return reply.status(400).send({ message: "Order must be confirmed/accepted before status updates." });
        }

        if (!VALID_DRIVER_STATUSES.has(status)) {
            return reply.status(400).send({ message: "Invalid order status update" });
        }

        const oldStatus = order.status;
        console.log(`[StatusUpdate] START: Order ${orderId} | New: ${status} | Old: ${oldStatus}`);

        // OTP Verification for High-Value Orders
        if (status === ORDER_STATUS.DELIVERED && order.isHighValueOrder) {
            const { otp } = req.body;
            if (!otp) {
                return reply.status(400).send({ 
                    message: "OTP is compulsory for high-value orders. Please ask the customer for the code.", 
                    otpRequired: true 
                });
            }
            if (otp !== order.deliveryOtp) {
                return reply.status(400).send({ 
                    message: "Invalid Delivery OTP. Please ask the customer for the correct code.", 
                    otpInvalid: true 
                });
            }
            console.log(`[OrderOTP] SUCCESS: OTP ${otp} verified for Order #${order.orderId}`);
        }

        // Assign driver if accepting an available order
        if (status === ORDER_STATUS.CONFIRMED && !order.deliveryPartner) {
            console.log(`[StatusUpdate] AUTO-ASSIGN: Driver ${userId} to order ${orderId}`);
            order.deliveryPartner = userId;
        }

        order.status = status;
        order.deliveryPersonLocation = deliveryPersonLocation;

        // 1. Status-specific logic (DO NOT SAVE HERE, modify order object)
        if (status === ORDER_STATUS.ARRIVING && !order.pickedUpAt) {
            order.pickedUpAt = new Date();
        }

        if (status === ORDER_STATUS.DELIVERED && oldStatus !== ORDER_STATUS.DELIVERED) {
            console.log(`[StatusUpdate] BUSINESS LOGIC: Processing delivery for ${orderId}`);
            order.deliveredAt = new Date();
            
            // Calculate Delivery Time (in minutes)
            const startTime = order.pickedUpAt || order.assignedAt || order.createdAt;
            if (startTime) {
                const durationMs = order.deliveredAt.getTime() - new Date(startTime).getTime();
                // Professional floor: at least 1 minute, avoid 0 or negative
                order.deliveryTimeMinutes = Math.max(1, Math.round(durationMs / 60000));
                console.log(`[StatusUpdate] TIMING: Order #${order.orderId} delivered in ${order.deliveryTimeMinutes} minutes.`);
            }

            // Calculate return expiry for each item
            if (order.items && order.items.length > 0) {
                order.items.forEach(item => {
                    if (item.returnWindow > 0) {
                        item.returnExpiresAt = new Date(order.deliveredAt.getTime() + (item.returnWindow * 3600000));
                    }
                    if (order.orderType === "choice") {
                        item.deliveryStatus = "delivered";
                    }
                });
            }

            // Keep legacy top-level expiry for backward compatibility
            if (order.returnWindow > 0) {
                order.returnExpiresAt = new Date(order.deliveredAt.getTime() + (order.returnWindow * 3600000));
            }

            try {
                // Driver Earning Logic - Update BEFORE creating transaction
                // Preserve custom earning if set by manager
                if (!order.driverEarning || order.driverEarning <= 0) {
                    order.driverEarning = await calculateDriverEarning(order.totalPrice || 0);
                }

                // Handle Driver Earnings Transaction
                if (order.deliveryPartner && order.driverEarning > 0) {
                    const feeTxn = await WalletTransaction.create({
                        deliveryPartner: order.deliveryPartner,
                        order: order._id,
                        amount: order.driverEarning,
                        type: "credit",
                        txnType: "delivery_fee",
                        description: `Delivery fee for order #${order.orderId}`,
                        status: "completed"
                    });
                    console.log(`[OrderUpdate] SUCCESS: Created delivery fee transaction ${feeTxn._id} for driver ${order.deliveryPartner}`);
                }

                // Handle COD Collection Tracking
                if (order.paymentMethod === "COD" && order.totalPrice > 0) {
                    order.codCollected = order.totalPrice; // Assuming totalAmount is totalPrice
                    if (order.deliveryPartner) {
                        const codTxn = await WalletTransaction.create({
                            deliveryPartner: order.deliveryPartner,
                            order: order._id,
                            amount: order.totalPrice, // Assuming totalAmount is totalPrice
                            type: "debit", // Cash liability
                            txnType: "cod_collection",
                            description: `COD collected for order #${order.orderId}`,
                            status: "completed"
                        });
                        console.log(`[OrderUpdate] SUCCESS: Created COD collection transaction ${codTxn._id} for driver ${order.deliveryPartner}`);
                    }
                }

                // Handle SabJab Coins Reward
                if (order.rewardCoinsEarned > 0 && order.customer) {
                    const rewardExits = await WalletTransaction.findOne({
                        order: order._id,
                        txnType: "reward_coins",
                        customer: order.customer
                    });

                    if (!rewardExits) {
                        const rewardTxn = await WalletTransaction.create({
                            customer: order.customer,
                            order: order._id,
                            amount: order.rewardCoinsEarned,
                            type: "credit",
                            txnType: "reward_coins",
                            description: `SabJab Coins earned for order #${order.orderId}`,
                            status: "completed"
                        });
                        console.log(`[OrderRewards] SUCCESS: Awarded ${order.rewardCoinsEarned} SabJab Coins to customer ${order.customer} for order ${order.orderId}`);
                    }
                }

                // NEW: Credit Sellers for delivered items
                if (order.items && order.items.length > 0) {
                    const sellerEarnings = new Map();

                    for (const orderItem of order.items) {
                        const product = await Product.findById(orderItem.item);
                        if (product && product.sellerId) {
                            const sellerId = product.sellerId.toString();
                            const itemPrice = orderItem.variation?.price || product.price || 0;
                            const itemEarning = itemPrice * (orderItem.count || 1);

                            sellerEarnings.set(sellerId, (sellerEarnings.get(sellerId) || 0) + itemEarning);
                        }
                    }

                    for (const [sellerId, amount] of sellerEarnings) {
                        if (amount > 0) {
                            await WalletTransaction.create({
                                seller: sellerId,
                                order: order._id,
                                amount: amount,
                                type: "credit",
                                txnType: "seller_sale",
                                description: `Earning from order #${order.orderId}`,
                                status: "completed"
                            });
                            console.log(`[OrderUpdate] SUCCESS: Credited ₹${amount} to seller ${sellerId} for order ${order.orderId}`);
                        }
                    }
                }
            } catch (calcError) {
                console.error("[StatusUpdate] Order delivery logic failed:", calcError.message);
            }
        }

        if (status === ORDER_STATUS.CANCELLED && oldStatus !== ORDER_STATUS.CANCELLED) {
            console.log(`[StatusUpdate] BUSINESS LOGIC: Stock return for ${orderId}`);
            try {
                for (const orderItem of order.items) {
                    const product = await Product.findById(orderItem.item);
                    if (product) {
                        product.stock += (orderItem.count || 0);
                        await product.save();
                    }
                }
            } catch (stockError) {
                console.error("[StatusUpdate] Stock return failed:", stockError.message);
            }
        }

        // 2. CONSOLIDATED SAVE
        console.log(`[StatusUpdate] DB_SAVE: Order ${orderId}`);
        await order.save();
        console.log(`[StatusUpdate] DB_SAVE_SUCCESS: Order ${orderId}`);

        // 3. Post-Save Side Effects (Non-blocking)
        try {
            // Notifications & Points logic (wrapped in catch-all for extreme safety)
            (async () => {
                try {
                    // Push Notification
                    if (order.customer) {
                        await sendPushNotification(
                            String(order.customer),
                            `Order ${status.toUpperCase()}`,
                            `Your order #${order.orderId} is now ${status.replace("_", " ")}`,
                            { orderId: String(order._id), type: 'ORDER_STATUS_UPDATE' },
                            'Customer'
                        );
                    }

                    // Green Points & Referral (Only on Delivered)
                    if (status === ORDER_STATUS.DELIVERED && oldStatus !== ORDER_STATUS.DELIVERED) {
                        // 🆕 NEW: Notify Admins of Delivery
                        const admins = await Admin.find({ pushToken: { $ne: null } });
                        for (const admin of admins) {
                            await sendPushNotification(
                                admin._id,
                                "Order Delivered! ✅",
                                `Order #${order.orderId} has been successfully delivered.`,
                                { orderId: String(order._id), type: "admin_order_delivered" },
                                "Admin"
                            );
                        }

                        const gpConfig = await GreenPointsConfig.getConfig();
                        if (gpConfig?.earnRules?.sustainablePurchase?.enabled && order.customer) {
                            const points = Math.floor((order.totalPrice / 100) * (gpConfig.earnRules.sustainablePurchase.pointsPerHundred || 1));
                            if (points > 0) {
                                const gpRecord = await GreenPoints.getOrCreate(order.customer);
                                await gpRecord.earnPoints("sustainable_purchase", points, `Order #${order.orderId}`, order._id);
                                await Customer.findByIdAndUpdate(order.customer, { greenPointsBalance: gpRecord.totalBalance });
                            }
                        }

                        // Referral
                        const customer = await Customer.findById(order.customer);
                        if (customer?.referredBy) {
                            const orderCount = await Order.countDocuments({ customer: order.customer, status: "delivered" });
                            if (orderCount === 1) {
                                const referral = await Referral.findOne({ referee: order.customer, bonusesAwarded: false });
                                if (referral && gpConfig?.earnRules?.referral?.enabled) {
                                    const rGP = await GreenPoints.getOrCreate(referral.referrer);
                                    await rGP.earnPoints("referral", referral.referrerPoints, `Referral bonus`, referral.referralCode);
                                    const refGP = await GreenPoints.getOrCreate(order.customer);
                                    await refGP.earnPoints("referral", referral.refereePoints, `Welcome bonus`, referral.referralCode);
                                    await Promise.all([
                                        Customer.findByIdAndUpdate(referral.referrer, { greenPointsBalance: rGP.totalBalance }),
                                        Customer.findByIdAndUpdate(order.customer, { greenPointsBalance: refGP.totalBalance }),
                                        referral.markBonusesAwarded()
                                    ]);
                                }
                            }
                        }
                        // --- CREDIT SABJAB COINS ON DELIVERY ---
                        if (order.rewardCoinsEarned > 0) {
                            const WalletTransaction = (await import("../../models/walletTransaction.js")).default;
                            const txn = new WalletTransaction({
                                customer: order.customer,
                                amount: order.rewardCoinsEarned,
                                type: "credit",
                                txnType: "reward_coins",
                                description: `Reward for order #${order.orderId}`,
                                status: "completed",
                            });
                            await txn.save();
                            console.log(`[OrderRewards] Created Reward Transaction for ${order.rewardCoinsEarned} SabJab Coins for Customer ${order.customer}`);
                        }
                        // ----------------------------------------
                    }
                } catch (innerError) {
                    console.error("[StatusUpdate] Async side-effects error:", innerError.message);
                }
            })();
        } catch (ignored) { }

        // 4. Final Response Preparation
        console.log(`[StatusUpdate] HYDRATE: Order ${orderId}`);
        const populatedOrder = await Order.findById(order._id).populate("customer branch items.item deliveryPartner");

        if (req.server.io && populatedOrder) {
            console.log(`[StatusUpdate] SOCKET_EMIT: Order ${orderId}`);
            try {
                req.server.io.to(orderId).emit("liveTrackingUpdates", {
                    ...populatedOrder.toObject(),
                    deliveryPartnerName: populatedOrder?.deliveryPartner?.name || "",
                });
                req.server.io.emit("admin:order-status-update", {
                    orderId: String(order._id),
                    status: status,
                    orderNumber: populatedOrder.orderId
                });
                if (populatedOrder.deliveryPartner?._id) {
                    const maskedOrderForAssignedDriver = await maskOrderForDriver(populatedOrder, "DeliveryPartner");
                    req.server.io.to(String(populatedOrder.deliveryPartner._id)).emit("driver:order-status-update", {
                        orderId: String(order._id),
                        status,
                        order: maskedOrderForAssignedDriver,
                        orderNumber: populatedOrder.orderId,
                    });
                }

                // NEW: Global emission to the Customer's personal socket room
                if (populatedOrder.customer?._id) {
                    req.server.io.to(String(populatedOrder.customer._id)).emit("customer:order-status-update", {
                        orderId: String(order._id),
                        status,
                        orderNumber: populatedOrder.orderId,
                    });
                }
                // NEW: Notify Sellers of Order Status Changes
                if (populatedOrder.items && populatedOrder.items.length > 0) {
                    const uniqueSellers = new Set();
                    populatedOrder.items.forEach(orderItem => {
                        if (orderItem.item?.sellerId) uniqueSellers.add(String(orderItem.item.sellerId));
                        else if (orderItem.item?.seller) uniqueSellers.add(String(orderItem.item.seller));
                    });

                    uniqueSellers.forEach(sellerId => {
                        req.server.io.to(sellerId).emit("seller:order-status-update", {
                            orderId: String(order._id),
                            status,
                            orderNumber: populatedOrder.orderId,
                        });
                    });
                }
            } catch (socketError) {
                console.error("[StatusUpdate] Socket error:", socketError.message);
            }
        }

        console.log(`[StatusUpdate] COMPLETED: Order ${orderId}`);
        const maskedOrder = await maskOrderForDriver(populatedOrder, req.user?.role);
        return reply.send(maskedOrder);
    } catch (error) {
        console.error("updateOrderStatus CRITICAL ERROR:", error);
        return reply.status(500).send({
            message: "Failed to update order status",
            error: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined
        });
    }
};

// Fetch all orders with optional filters
export const getOrders = async (req, reply) => {
    try {
        // Run cleanup in background - do not await to avoid blocking current request
        expireStaleAssignedOrders(req.server.io);


        const { status, customerId, deliveryPartnerId, branchId } = req.query;
        const { userId, role } = req.user || {};
        let query = {};

        if (status) query.status = status;

        if (role === "Customer") {
            query.customer = userId;
        } else if (role === "DeliveryPartner") {
            query.$or = [
                { deliveryPartner: userId },
                { status: "available" }
            ];
        } else if (role === "Admin" || role === "Manager") {
            if (customerId) query.customer = customerId;
            if (deliveryPartnerId) query.deliveryPartner = deliveryPartnerId;
        } else {
            return reply.send([]);
        }

        if (branchId) query.branch = branchId;

        const orders = await Order.find(query).populate(
            "customer branch items.item deliveryPartner"
        );

        if (role === "DeliveryPartner") {
            const maskedOrders = await Promise.all(orders.map(o => maskOrderForDriver(o, role)));
            return reply.send(maskedOrders);
        }

        return reply.send(orders);
    } catch (error) {
        return reply.status(500).send({ message: "Failed to retrieve orders", error: error.message });
    }
};

export const releaseOrderAssignment = async (req, reply) => {
    try {
        const { orderId } = req.params;
        const { userId, role } = req.user || {};

        const order = await Order.findById(orderId);
        if (!order) return reply.status(404).send({ message: "Order not found" });

        if (order.status !== ORDER_STATUS.ASSIGNED) {
            return reply.status(400).send({ message: "Order is not in assigned state" });
        }

        const assignedDriverId = order.deliveryPartner ? String(order.deliveryPartner) : "";
        const isManager = role === "Manager" || role === "Admin";
        const isAssignedDriver = role === "DeliveryPartner" && assignedDriverId === String(userId);

        if (!isManager && !isAssignedDriver) {
            return reply.status(403).send({ message: "Unauthorized to release assignment" });
        }

        order.status = ORDER_STATUS.AVAILABLE;
        order.deliveryPartner = undefined;
        order.assignedAt = undefined;
        order.deliveryPersonLocation = undefined;
        await order.save();

        const populatedOrder = await Order.findById(order._id).populate(
            "customer branch items.item deliveryPartner"
        );

        if (req.server.io) {
            req.server.io.to(String(order._id)).emit("liveTrackingUpdates", {
                ...populatedOrder.toObject(),
                deliveryPartnerName: "",
            });
            req.server.io.emit("admin:order-status-update", {
                orderId: String(order._id),
                status: ORDER_STATUS.AVAILABLE,
                orderNumber: populatedOrder.orderId,
            });
            if (assignedDriverId) {
                req.server.io.to(String(assignedDriverId)).emit("driver:order-status-update", {
                    orderId: String(order._id),
                    status: ORDER_STATUS.AVAILABLE,
                    order: populatedOrder,
                    orderNumber: populatedOrder.orderId,
                });
            }
        }

        return reply.send(populatedOrder);
    } catch (error) {
        return reply.status(500).send({ message: "Failed to release assignment", error: error.message });
    }
};

export const rejectOrder = async (req, reply) => {
    try {
        const { orderId } = req.params;
        const { userId } = req.user;

        const order = await Order.findById(orderId);
        if (!order) return reply.status(404).send({ message: "Order not found" });

        // Drivers can only reject if it's assigned to them or if it's a general proposal
        // For simplicity, we just notify the admin that this driver declined
        const driver = await DeliveryPartner.findById(userId);

        console.log(`❌ [Rejection] Driver ${userId} rejected order ${orderId}`);

        if (req.server.io) {
            req.server.io.emit("admin:order-rejected", {
                orderId: String(order._id),
                orderNumber: order.orderId,
                driverName: driver?.name || "A Driver",
                driverId: userId
            });
        }

        return reply.send({ message: "Rejection received" });
    } catch (error) {
        return reply.status(500).send({ message: "Failed to process rejection", error: error.message });
    }
};

// Fetch a single order by ID
export const getOrderById = async (req, reply) => {
    try {
        const { orderId } = req.params;
        const { userId, role } = req.user || {};
        const order = await Order.findById(orderId).populate(
            "customer branch items.item deliveryPartner"
        );

        if (!order) {
            return reply.status(404).send({ message: "Order not found" });
        }

        const orderCustomerId = order.customer?._id || order.customer;
        const orderPartnerId = order.deliveryPartner?._id || order.deliveryPartner;

        if (role === "Customer" && String(orderCustomerId) !== String(userId)) {
            return reply.status(403).send({ message: "Unauthorized access to this order" });
        }

        if (role === "DeliveryPartner" && String(orderPartnerId) !== String(userId)) {
            return reply.status(403).send({ message: "Unauthorized access to this order" });
        }

        const maskedOrder = await maskOrderForDriver(order, role);
        return reply.send(maskedOrder);
    } catch (error) {
        return reply.status(500).send({ message: "Failed to retrieve order", error: error.message });
    }
};

export const cancelOrder = async (req, reply) => {
    try {
        const { orderId } = req.params;
        const { userId } = req.user;

        const order = await Order.findById(orderId);
        if (!order) return reply.status(404).send({ message: "Order not found" });

        // Ownership validation
        if (String(order.customer) !== String(userId)) {
            return reply.status(403).send({ message: "Unauthorized: You can only cancel your own orders" });
        }

        // Status validation: Can only cancel if not yet out for delivery
        const cancelableStatuses = [ORDER_STATUS.AVAILABLE, ORDER_STATUS.ASSIGNED, ORDER_STATUS.CONFIRMED];
        if (!cancelableStatuses.includes(order.status)) {
            return reply.status(400).send({ message: `Order cannot be cancelled as it is already ${order.status.replace("_", " ")}` });
        }

        const oldStatus = order.status;
        order.status = ORDER_STATUS.CANCELLED;
        await order.save();

        // Stock Return Logic (Reuse logic from updateOrderStatus if possible, or re-implement)
        try {
            for (const orderItem of order.items) {
                const product = await Product.findById(orderItem.item);
                if (product) {
                    product.stock += (orderItem.count || 0);
                    await product.save();
                }
            }
        } catch (stockError) {
            console.error("[CancelOrder] Stock return failed:", stockError.message);
        }

        const populatedOrder = await Order.findById(order._id).populate("customer branch items.item deliveryPartner");

        // Realtime notifications
        if (req.server.io && populatedOrder) {
            req.server.io.to(orderId).emit("liveTrackingUpdates", {
                ...populatedOrder.toObject(),
                deliveryPartnerName: populatedOrder?.deliveryPartner?.name || "",
            });
            req.server.io.emit("admin:order-status-update", {
                orderId: String(order._id),
                status: ORDER_STATUS.CANCELLED,
                orderNumber: populatedOrder.orderId
            });
            if (populatedOrder.deliveryPartner?._id) {
                req.server.io.to(String(populatedOrder.deliveryPartner._id)).emit("driver:order-status-update", {
                    orderId: String(order._id),
                    status: ORDER_STATUS.CANCELLED,
                    order: populatedOrder,
                    orderNumber: populatedOrder.orderId,
                });
            }
        }

        return reply.send({ message: "Order cancelled successfully", order: populatedOrder });
    } catch (error) {
        console.error("cancelOrder error:", error);
        return reply.status(500).send({ message: "Failed to cancel order", error: error.message });
    }
};

export const getCustomerSavings = async (req, reply) => {
    try {
        const { userId } = req.user;
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const orders = await Order.find({
            customer: userId,
            status: ORDER_STATUS.DELIVERED,
            createdAt: { $gte: startOfMonth }
        }).select("discountAmount");

        const totalSavings = orders.reduce((sum, order) => sum + (order.discountAmount || 0), 0);
        return reply.send({ totalSavings });
    } catch (error) {
        console.error("getCustomerSavings error:", error);
        return reply.status(500).send({ message: "Failed to calculate savings", error: error.message });
    }
};

export const requestOrderReturn = async (req, reply) => {
    try {
        const { orderId } = req.params;
        const { itemId, reason } = req.body;
        const { userId } = req.user;

        const order = await Order.findById(orderId);
        if (!order) {
            return reply.status(404).send({ message: "Order not found" });
        }

        if (order.customer.toString() !== userId) {
            return reply.status(403).send({ message: "Unauthorized. You did not place this order." });
        }

        if (order.status !== ORDER_STATUS.DELIVERED) {
            return reply.status(400).send({ message: "Only delivered orders can be returned." });
        }

        if (itemId) {
            // Item-level return
            const item = order.items.id(itemId);
            if (!item) {
                return reply.status(404).send({ message: "Item not found in order." });
            }

            if (item.returnStatus !== "none") {
                return reply.status(400).send({ message: `Item return already ${item.returnStatus}.` });
            }

            if (!item.returnExpiresAt || new Date() > item.returnExpiresAt) {
                return reply.status(400).send({ message: "Item return window has expired." });
            }

            item.returnStatus = "requested";
            item.returnReason = reason || "No reason provided";
        } else {
            // Legacy Order-level return
            if (order.returnStatus !== "none") {
                return reply.status(400).send({ message: `Order return already ${order.returnStatus}.` });
            }

            if (!order.returnExpiresAt || new Date() > order.returnExpiresAt) {
                return reply.status(400).send({ message: "Order return window has expired." });
            }

            order.returnStatus = "requested";
            order.returnReason = reason || "No reason provided";
        }
        await order.save();

        // Notify Admin
        if (req.server.io) {
            req.server.io.emit("admin:return-requested", {
                orderId: String(order._id),
                orderNumber: order.orderId,
                reason: order.returnReason
            });
        }

        return reply.send({ success: true, message: "Return request submitted successfully.", order });
    } catch (error) {
        console.error("Request Return Error:", error);
        return reply.status(500).send({ message: "Failed to request return", error: error.message });
    }
};
