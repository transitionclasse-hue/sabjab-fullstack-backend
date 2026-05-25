import { Order, DeliveryPartner, Customer, Branch, Product, Coupon, GreenPoints, GreenPointsConfig, Referral, WalletTransaction, Admin, GlobalConfig, StoreStatus } from "../../models/index.js";
import PricingConfig from "../../models/pricingConfig.js";
import { sendPushNotification } from "../../utils/notification.js";
import { getDistanceKm, isValidLatLng } from "../../utils/geo.js";
import { computeDriverEarning } from "../../utils/driverEarning.js";
import crypto from "crypto";

const ORDER_STATUS = {
    AVAILABLE: "available",
    WAREHOUSE_PROCESSING: "warehouse_processing",
    DISPATCHED: "dispatched",
    IN_TRANSIT: "in_transit",
    REACHED_AT_BRANCH: "reached_at_branch",
    ASSIGNED: "assigned",
    CONFIRMED: "confirmed",
    ARRIVING: "arriving",
    AT_LOCATION: "at_location",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
};
const ASSIGNMENT_TIMEOUT_MS = 5 * 60 * 1000;

const VALID_DRIVER_STATUSES = new Set([
    ORDER_STATUS.WAREHOUSE_PROCESSING,
    ORDER_STATUS.DISPATCHED,
    ORDER_STATUS.IN_TRANSIT,
    ORDER_STATUS.REACHED_AT_BRANCH,
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

/** @param {object|number} orderOrTotal - Order doc (preferred) or legacy order total number */
export const calculateDriverEarning = async (orderOrTotal = 0) => {
    const config = await PricingConfig.findOne({ key: "primary" });
    const order =
        orderOrTotal && typeof orderOrTotal === "object" ? orderOrTotal : null;
    return computeDriverEarning(config, order);
};

const isAssignmentExpired = (assignedAt, timeoutMs = ASSIGNMENT_TIMEOUT_MS) =>
    Boolean(assignedAt) && (Date.now() - new Date(assignedAt).getTime() >= timeoutMs);

export const expireStaleAssignedOrders = async (io = null) => {
    let timeoutMs = ASSIGNMENT_TIMEOUT_MS;
    try {
        const config = await GlobalConfig.findOne({ key: "assignment_timeout_config" });
        if (config?.value?.minutes) {
            timeoutMs = config.value.minutes * 60 * 1000;
        }
    } catch (err) {
        console.error("Error reading assignment timeout config in expireStaleAssignedOrders:", err.message);
    }
    const cutoff = new Date(Date.now() - timeoutMs);
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
        const { items, branchId, totalAmount, deliveryAddress, couponCode, paymentMethod, orderType, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        const customerData = await Customer.findById(userId);
        let branchData = await Branch.findById(branchId);

        // --- STORE STATUS VALIDATION ---
        const storeConfig = await StoreStatus.findOne({ key: "primary" });
        if (storeConfig && storeConfig.acceptOrders === false) {
            return reply.status(400).send({ message: "Store is currently not accepting new orders." });
        }
        // -------------------------------

        // --- ONLINE PAYMENT SIGNATURE VERIFICATION ---
        if (paymentMethod === "Online") {
            if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
                return reply.status(400).send({ message: "Online payment details are missing." });
            }
            const text = razorpay_order_id + "|" + razorpay_payment_id;
            const generated_signature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "mockSecret123")
                .update(text)
                .digest("hex");

            if (generated_signature !== razorpay_signature) {
                console.error(`[Razorpay] Verification failed for Order: ${razorpay_order_id}`);
                return reply.status(400).send({ message: "Payment verification failed. Invalid signature." });
            }
            console.log(`[Razorpay] Verified payment ${razorpay_payment_id} for order ${razorpay_order_id}`);
        }
        // ----------------------------------------------

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
        let orderStandardSubtotal = 0;
        const resolvedItems = [];

        // 1. Initial pass: resolve products and standard prices to compute standard subtotal
        for (const item of items) {
            const pid = item._id || item.id;
            const product = await Product.findById(pid);
            if (!product) {
                return reply.status(404).send({ message: `Product ${pid} not found` });
            }

            const requestedCount = item.qty || item.quantity || item.count || 1;
            const variationId = item.variationId || item.variation?._id || item.variation?.id;

            let stdPrice = product.discountPrice || product.price;
            let targetObj = product;

            if (variationId || item.variation?.name) {
                let variation = null;
                if (variationId) {
                    variation = product.variations.id(variationId);
                }
                if (!variation && item.variation?.name) {
                    variation = product.variations.find(v => v.name === item.variation.name);
                }
                if (variation) {
                    stdPrice = variation.discountPrice || variation.price;
                    targetObj = variation;
                }
            }

            orderStandardSubtotal += stdPrice * requestedCount;
            resolvedItems.push({
                item,
                product,
                targetObj,
                stdPrice,
                requestedCount,
                variationId
            });
        }

        const stockUpdates = [];
        // 2. Second pass: perform stock validation, compute dynamic offer pricing, and prepare stock updates
        for (const resolved of resolvedItems) {
            const { item, product, targetObj, stdPrice, requestedCount, variationId } = resolved;

            if (!product.isAvailable) {
                return reply.status(400).send({ message: `${product.name} is currently unavailable` });
            }

            // NEW: User Stock Limit per Product check
            if (product.userStockLimit && requestedCount > product.userStockLimit) {
                return reply.status(400).send({ 
                    message: `Limit exceeded: You can buy maximum ${product.userStockLimit} units of ${product.name}`,
                    limitExceeded: true
                });
            }

            let variationData = null;
            if (targetObj !== product) { // variation
                const variation = targetObj;
                if (!variation.isAvailable) {
                    return reply.status(400).send({ message: `Variation ${variation.name} of ${product.name} is unavailable` });
                }

                if (variation.stock !== undefined && variation.stock < requestedCount) {
                    return reply.status(400).send({
                        message: `Insufficient stock for ${product.name} (${variation.name}). Available: ${variation.stock}`,
                        shortage: true
                    });
                }

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

            // Dynamic Price calculation with Conditional Offer
            let finalPrice = stdPrice;
            if (targetObj.isInOffer) {
                const meetMinPurchase = !targetObj.offerMinPurchase || (orderStandardSubtotal >= targetObj.offerMinPurchase);
                if (meetMinPurchase) {
                    const offerPrice = targetObj.offerPrice || 0;
                    const limit = targetObj.offerQtyLimit || 0;
                    if (limit > 0) {
                        const offerQty = Math.min(requestedCount, limit);
                        const standardQty = Math.max(0, requestedCount - limit);
                        const totalCost = (offerQty * offerPrice) + (standardQty * stdPrice);
                        finalPrice = totalCost / requestedCount; // average price per unit
                    } else {
                        finalPrice = offerPrice;
                    }
                }
            }

            item.itemPrice = finalPrice; // Store for total calculation
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
            paymentStatus: paymentMethod === "Online" ? "Paid" : (paymentMethod === "Direct_UPI" ? "Pending Verification" : "Pending"),
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
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
        newOrder.driverEarning = await calculateDriverEarning(newOrder);

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

        // Notify all online drivers about the new available order (ONLY for Quick orders and not waiting on consumer UPI)
        if (savedOrder.orderType === "quick" && savedOrder.paymentStatus !== "Pending Verification") {
            console.log(`📡 [Socket] Emitting driver:new-order for order ${populatedOrder.orderId}`);
            const maskedOrderForDriverBatch = await maskOrderForDriver(populatedOrder, "DeliveryPartner");
            req.server.io.emit("driver:new-order", {
                order: maskedOrderForDriverBatch
            });
        }

        // 🆕 NEW: Push Notifications
        (async () => {
            try {
                if (savedOrder.orderType === "quick" && savedOrder.paymentStatus !== "Pending Verification") {
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

        let timeoutMs = ASSIGNMENT_TIMEOUT_MS;
        try {
            const config = await GlobalConfig.findOne({ key: "assignment_timeout_config" });
            if (config?.value?.minutes) {
                timeoutMs = config.value.minutes * 60 * 1000;
            }
        } catch (err) {
            console.error("Error reading assignment timeout config in confirmOrder:", err.message);
        }

        if (order.status === ORDER_STATUS.ASSIGNED && isAssignmentExpired(order.assignedAt, timeoutMs)) {
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
                    order.driverEarning = await calculateDriverEarning(order);
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

                // NEW: Process Reel Commissions
                try {
                    const { processReelCommission } = await import("../../utils/commission.js");
                    await processReelCommission(order._id);
                } catch (commError) {
                    console.error("[OrderUpdate] Reel commission processing failed:", commError.message);
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
                        // 🆕 NEW: Notify Driver of Delivery Earning
                        if (order.deliveryPartner) {
                            await sendPushNotification(
                                String(order.deliveryPartner),
                                "Order Delivered! ✅",
                                `You earned ₹${order.driverEarning || 0} for delivering order #${order.orderId}.`,
                                { orderId: String(order._id), type: 'ORDER_DELIVERED' },
                                'DeliveryPartner'
                            ).catch(e => console.error("Driver delivery notification error:", e.message));
                        }

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

// Helper to mark order as paid online and complete delivery
export const processSuccessfulDeliveryPayment = async (order, razorpay_payment_id, razorpay_order_id, razorpay_signature, io) => {
    const oldStatus = order.status;
    order.status = ORDER_STATUS.DELIVERED;
    order.paymentMethod = "Online";
    order.paymentStatus = "Paid";
    if (razorpay_payment_id) order.razorpay_payment_id = razorpay_payment_id;
    if (razorpay_order_id) order.razorpay_order_id = razorpay_order_id;
    if (razorpay_signature) order.razorpay_signature = razorpay_signature;
    order.deliveredAt = new Date();

    // Calculate delivery time
    const startTime = order.pickedUpAt || order.assignedAt || order.createdAt;
    if (startTime) {
        const durationMs = order.deliveredAt.getTime() - new Date(startTime).getTime();
        order.deliveryTimeMinutes = Math.max(1, Math.round(durationMs / 60000));
    }

    // Calculate return expiry for items
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
    if (order.returnWindow > 0) {
        order.returnExpiresAt = new Date(order.deliveredAt.getTime() + (order.returnWindow * 3600000));
    }

    // Calculate Driver Earning
    if (!order.driverEarning || order.driverEarning <= 0) {
        order.driverEarning = await calculateDriverEarning(order);
    }

    // Create wallet transaction for driver
    if (order.deliveryPartner && order.driverEarning > 0) {
        await WalletTransaction.create({
            deliveryPartner: order.deliveryPartner,
            order: order._id,
            amount: order.driverEarning,
            type: "credit",
            txnType: "delivery_fee",
            description: `Delivery fee for order #${order.orderId}`,
            status: "completed"
        });
    }

    // Coins rewards
    if (order.rewardCoinsEarned > 0 && order.customer) {
        const rewardExits = await WalletTransaction.findOne({
            order: order._id,
            txnType: "reward_coins",
            customer: order.customer
        });

        if (!rewardExits) {
            await WalletTransaction.create({
                customer: order.customer,
                order: order._id,
                amount: order.rewardCoinsEarned,
                type: "credit",
                txnType: "reward_coins",
                description: `SabJab Coins earned for order #${order.orderId}`,
                status: "completed"
            });
        }
    }

    // Seller earnings
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
            }
        }
    }

    // Reel commissions
    try {
        const { processReelCommission } = await import("../../utils/commission.js");
        await processReelCommission(order._id);
    } catch (commError) {
        console.error("[processSuccessfulDeliveryPayment] Reel commission processing failed:", commError.message);
    }

    await order.save();

    // Push notifications
    (async () => {
        try {
            if (order.customer) {
                await sendPushNotification(
                    String(order.customer),
                    `Order Delivered`,
                    `Your order #${order.orderId} is now delivered. Thank you!`,
                    { orderId: String(order._id), type: 'ORDER_STATUS_UPDATE' },
                    'Customer'
                );
            }
            if (order.deliveryPartner) {
                await sendPushNotification(
                    String(order.deliveryPartner),
                    "Order Delivered! ✅",
                    `You earned ₹${order.driverEarning || 0} for delivering order #${order.orderId}.`,
                    { orderId: String(order._id), type: 'ORDER_DELIVERED' },
                    'DeliveryPartner'
                );
            }
        } catch (notifyErr) {
            console.error("[processSuccessfulDeliveryPayment] Push notify error:", notifyErr.message);
        }
    })();

    // Sockets
    const populatedOrder = await Order.findById(order._id).populate("customer branch items.item deliveryPartner");
    if (io && populatedOrder) {
        io.to(order._id.toString()).emit("liveTrackingUpdates", {
            ...populatedOrder.toObject(),
            deliveryPartnerName: populatedOrder?.deliveryPartner?.name || "",
        });
        io.emit("admin:order-status-update", {
            orderId: String(order._id),
            status: ORDER_STATUS.DELIVERED,
            orderNumber: populatedOrder.orderId,
            amount: populatedOrder.totalPrice,
            paymentMethod: populatedOrder.paymentMethod,
            driverName: populatedOrder.deliveryPartner?.name || "Delivery Partner"
        });
        if (populatedOrder.deliveryPartner?._id) {
            const maskedOrderForAssignedDriver = await maskOrderForDriver(populatedOrder, "DeliveryPartner");
            io.to(String(populatedOrder.deliveryPartner._id)).emit("driver:order-status-update", {
                orderId: String(order._id),
                status: ORDER_STATUS.DELIVERED,
                order: maskedOrderForAssignedDriver,
                orderNumber: populatedOrder.orderId,
            });
        }
        if (populatedOrder.customer?._id) {
            io.to(String(populatedOrder.customer._id)).emit("customer:order-status-update", {
                orderId: String(order._id),
                status: ORDER_STATUS.DELIVERED,
                orderNumber: populatedOrder.orderId,
            });
        }
    }
};

// Verify Online Payment during Doorstep Delivery (Driver QR scan)
export const verifyDeliveryPayment = async (req, reply) => {
    try {
        const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body || {};
        if (!orderId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return reply.status(400).send({ message: "Required payment parameters are missing." });
        }

        // Verify Razorpay signature
        const text = razorpay_order_id + "|" + razorpay_payment_id;
        const generated_signature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "mockSecret123")
            .update(text)
            .digest("hex");

        if (generated_signature !== razorpay_signature) {
            console.error(`[Razorpay Delivery] Verification failed for Order: ${razorpay_order_id}`);
            return reply.status(400).send({ message: "Payment verification failed. Invalid signature." });
        }

        let order;
        if (orderId && orderId.length === 24) {
            order = await Order.findById(orderId);
        }
        if (!order && orderId) {
            order = await Order.findOne({ orderId: orderId });
        }
        if (!order) {
            return reply.status(404).send({ message: "Order not found." });
        }

        await processSuccessfulDeliveryPayment(
            order,
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            req.server.io
        );

        return reply.status(200).send({ success: true, message: "Payment verified and order delivered." });
    } catch (err) {
        console.error("verifyDeliveryPayment critical error:", err);
        return reply.status(500).send({ message: "Verification failed.", error: err.message });
    }
};

// Request manual payment confirmation from manager
export const requestPaymentConfirmation = async (req, reply) => {
    try {
        const { orderId } = req.params;
        let order;
        if (orderId && orderId.length === 24) {
            order = await Order.findById(orderId).populate("deliveryPartner");
        } else {
            order = await Order.findOne({ orderId }).populate("deliveryPartner");
        }
        if (!order) {
            return reply.status(404).send({ message: "Order not found." });
        }

        console.log(`[Payment confirmation] Driver ${order.deliveryPartner?.name || 'Unknown'} requesting confirmation for Order #${order.orderId}`);

        // Emit socket event to managers
        if (req.server.io) {
            req.server.io.emit("admin:payment-confirmation-request", {
                orderId: order._id.toString(),
                orderNumber: order.orderId,
                driverName: order.deliveryPartner?.name || "Delivery Partner",
                amount: order.totalPrice
            });
        }

        return reply.status(200).send({ success: true, message: "Confirmation request sent to manager." });
    } catch (err) {
        console.error("requestPaymentConfirmation error:", err);
        return reply.status(500).send({ message: "Failed to send request.", error: err.message });
    }
};

// Confirm payment manually by manager
export const confirmPaymentManually = async (req, reply) => {
    try {
        const { orderId } = req.params;
        let order;
        if (orderId && orderId.length === 24) {
            order = await Order.findById(orderId);
        } else {
            order = await Order.findOne({ orderId });
        }
        if (!order) {
            return reply.status(404).send({ message: "Order not found." });
        }

        console.log(`[Manual confirmation] Manager confirming payment for Order #${order.orderId}`);

        // Run helper to mark order as delivered and paid
        await processSuccessfulDeliveryPayment(
            order,
            `manual_${Date.now()}`, // mock payment ID
            "", // no order ID needed
            "", // no signature needed
            req.server.io
        );

        return reply.status(200).send({ success: true, message: "Payment confirmed successfully." });
    } catch (err) {
        console.error("confirmPaymentManually error:", err);
        return reply.status(500).send({ message: "Failed to confirm payment.", error: err.message });
    }
};

// Reject payment confirmation by manager
export const rejectPaymentConfirmation = async (req, reply) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body || {};
        let order;
        if (orderId && orderId.length === 24) {
            order = await Order.findById(orderId).populate("deliveryPartner");
        } else {
            order = await Order.findOne({ orderId }).populate("deliveryPartner");
        }
        if (!order) {
            return reply.status(404).send({ message: "Order not found." });
        }

        console.log(`[Manual confirmation] Manager rejected payment request for Order #${order.orderId}. Reason: ${reason || 'None'}`);

        // Emit rejection socket event to driver
        if (req.server.io && order.deliveryPartner?._id) {
            req.server.io.to(order.deliveryPartner._id.toString()).emit("driver:payment-confirmation-rejected", {
                orderId: order._id.toString(),
                message: reason || "Manager rejected the payment request. Please verify the transfer again."
            });
        }

        return reply.status(200).send({ success: true, message: "Payment request rejected." });
    } catch (err) {
        console.error("rejectPaymentConfirmation error:", err);
        return reply.status(500).send({ message: "Failed to reject request.", error: err.message });
    }
};

// CONSUMER PAYMENT CONFIRMATION BYPASS CONTROLLERS

// Request manager to confirm consumer's Direct UPI payment
export const requestConsumerPaymentConfirmation = async (req, reply) => {
    try {
        const { orderId } = req.params;
        let order;
        if (orderId && orderId.length === 24) {
            order = await Order.findById(orderId).populate("customer");
        } else {
            order = await Order.findOne({ orderId }).populate("customer");
        }
        if (!order) {
            return reply.status(404).send({ message: "Order not found." });
        }

        console.log(`[Consumer Payment] Requesting confirmation for Order #${order.orderId}`);

        // Emit socket event to managers
        if (req.server.io) {
            req.server.io.emit("admin:consumer-payment-verification-request", {
                orderId: order._id.toString(),
                orderNumber: order.orderId,
                customerName: order.customer?.name || "Customer",
                amount: order.totalPrice
            });
        }

        return reply.status(200).send({ success: true, message: "Confirmation request sent to manager." });
    } catch (err) {
        console.error("requestConsumerPaymentConfirmation error:", err);
        return reply.status(500).send({ message: "Failed to send request.", error: err.message });
    }
};

// Confirm consumer payment manually by manager
export const confirmConsumerPayment = async (req, reply) => {
    try {
        const { orderId } = req.params;
        let order;
        if (orderId && orderId.length === 24) {
            order = await Order.findById(orderId).populate("customer branch items.item deliveryPartner");
        } else {
            order = await Order.findOne({ orderId }).populate("customer branch items.item deliveryPartner");
        }
        if (!order) {
            return reply.status(404).send({ message: "Order not found." });
        }

        console.log(`[Consumer Payment] Manager confirming payment for Order #${order.orderId}`);

        order.paymentStatus = "Paid";
        order.status = "confirmed";
        await order.save();

        if (req.server.io) {
            // Notify customer
            req.server.io.to(order._id.toString()).emit("customer:payment-confirmed", {
                orderId: order._id.toString(),
                message: "Payment verified successfully!"
            });
            req.server.io.to(order._id.toString()).emit("liveTrackingUpdates", {
                ...order.toObject()
            });

            // NOW emit to drivers!
            if (order.orderType === "quick") {
                const { maskOrderForDriver } = await import("./helpers.js");
                const maskedOrderForDriverBatch = await maskOrderForDriver(order, "DeliveryPartner");
                req.server.io.emit("driver:new-order", { order: maskedOrderForDriverBatch });

                // Driver push notifications
                const { DeliveryPartner } = await import("../../models/user.js");
                const { sendPushNotification } = await import("../../services/notificationService.js");
                const onlineDrivers = await DeliveryPartner.find({ isOnline: true, pushToken: { $ne: null } });
                for (const driver of onlineDrivers) {
                    await sendPushNotification(
                        driver._id,
                        "New Order Available! 🚀",
                        `New order #${order.orderId} from ${order.branch?.name || "SabJab"}`,
                        { orderId: String(order._id), type: "new_order" },
                        "DeliveryPartner"
                    );
                }
            }
            
            // Notify admin website of order state change
            req.server.io.emit("admin:order-status-update", {
                orderId: String(order._id),
                status: order.status,
                paymentStatus: order.paymentStatus
            });
        }

        return reply.status(200).send({ success: true, message: "Consumer payment confirmed successfully." });
    } catch (err) {
        console.error("confirmConsumerPayment error:", err);
        return reply.status(500).send({ message: "Failed to confirm consumer payment.", error: err.message });
    }
};

// Reject consumer payment by manager
export const rejectConsumerPayment = async (req, reply) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body || {};
        let order;
        if (orderId && orderId.length === 24) {
            order = await Order.findById(orderId);
        } else {
            order = await Order.findOne({ orderId });
        }
        if (!order) {
            return reply.status(404).send({ message: "Order not found." });
        }

        console.log(`[Consumer Payment] Manager rejected payment request for Order #${order.orderId}. Reason: ${reason || 'None'}`);

        order.status = "cancelled";
        await order.save();

        // Emit rejection socket event to customer
        if (req.server.io) {
            req.server.io.to(order._id.toString()).emit("customer:payment-rejected", {
                orderId: order._id.toString(),
                message: reason || "Manager rejected the payment request. The order has been cancelled."
            });
            
            // Notify admin website of order state change
            req.server.io.emit("admin:order-status-update", {
                orderId: String(order._id),
                status: order.status,
                paymentStatus: order.paymentStatus
            });
        }

        return reply.status(200).send({ success: true, message: "Consumer payment request rejected." });
    } catch (err) {
        console.error("rejectConsumerPayment error:", err);
        return reply.status(500).send({ message: "Failed to reject consumer request.", error: err.message });
    }
};
