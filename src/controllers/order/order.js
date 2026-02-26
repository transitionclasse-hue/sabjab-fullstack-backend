import { Order, DeliveryPartner, Customer, Branch, Product, Coupon, GreenPoints, GreenPointsConfig, Referral } from "../../models/index.js";
import PricingConfig from "../../models/pricingConfig.js";
import { sendPushNotification } from "../../utils/notification.js";

const ORDER_STATUS = {
    AVAILABLE: "available",
    ASSIGNED: "assigned",
    CONFIRMED: "confirmed",
    ARRIVING: "arriving",
    AT_LOCATION: "at_location",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
};

const VALID_DRIVER_STATUSES = new Set([
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.ARRIVING,
    ORDER_STATUS.AT_LOCATION,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.CANCELLED,
]);

const calculateDriverEarning = async (orderTotal = 0) => {
    const config = await PricingConfig.findOne({ key: "primary" });
    const baseFee = config?.baseDeliveryFee ?? 20;
    const freeThreshold = config?.freeDeliveryThreshold ?? 199;
    const freeEnabled = config?.freeDeliveryEnabled ?? true;
    return freeEnabled && Number(orderTotal) >= freeThreshold ? 0 : baseFee;
};

// Create a new order (Initial Customer Action)
export const createOrder = async (req, reply) => {
    try {
        const { userId } = req.user;
        const { items, branchId, totalAmount, deliveryAddress, couponCode } = req.body;

        const customerData = await Customer.findById(userId);
        const branchData = await Branch.findById(branchId);

        console.log("=== CREATE ORDER DEBUG ===");
        console.log("Token userId:", userId);
        console.log("Found Customer:", customerData ? "YES" : "NO");
        console.log("Found Branch:", branchData ? "YES" : "NO");

        if (!customerData) {
            console.log("Customer not found for ID:", userId);
            return reply.status(404).send({ message: "Customer not found" });
        }

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
            if (product.stock !== undefined && product.stock < requestedCount) {
                return reply.status(400).send({
                    message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
                    shortage: true
                });
            }

            stockUpdates.push({ product, requestedCount });
        }

        // Calculate actual itemsTotal from DB prices for coupon validation
        const itemsTotal = stockUpdates.reduce((sum, u) => sum + (u.product.price || 0) * u.requestedCount, 0);

        // Atomic stock decrementing
        for (const update of stockUpdates) {
            update.product.stock -= update.requestedCount;
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

        const newOrder = new Order({
            customer: userId,
            items: items.map((item) => ({
                id: item._id || item.id, // Handles both formats
                item: item._id || item.id,
                count: item.qty || item.quantity || item.count || 1,
            })),
            branch: branchId,
            totalPrice: totalAmount,
            couponCode: validatedCouponCode,
            discountAmount: discountAmount,
            deliveryLocation: {
                latitude: deliveryAddress?.coords?.lat || 0,
                longitude: deliveryAddress?.coords?.lng || 0,
                address: deliveryAddress ? `${deliveryAddress.houseNo}, ${deliveryAddress.area}` : "No address available",
            },
            pickupLocation: {
                latitude: branchData?.location?.latitude ?? null,
                longitude: branchData?.location?.longitude ?? null,
                address: branchData?.address ?? "Store",
            },

        });
        newOrder.driverEarning = await calculateDriverEarning(totalAmount);

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

        // Notify all online drivers about the new available order
        req.server.io.emit("driver:new-order", {
            order: populatedOrder
        });

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

        return reply.send(order);
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

        // Assign driver if accepting an available order
        if (status === ORDER_STATUS.CONFIRMED && !order.deliveryPartner) {
            console.log(`[StatusUpdate] AUTO-ASSIGN: Driver ${userId} to order ${orderId}`);
            order.deliveryPartner = userId;
        }

        order.status = status;
        order.deliveryPersonLocation = deliveryPersonLocation;

        // 1. Status-specific logic (DO NOT SAVE HERE, modify order object)
        if (status === ORDER_STATUS.DELIVERED && oldStatus !== ORDER_STATUS.DELIVERED) {
            console.log(`[StatusUpdate] BUSINESS LOGIC: Processing delivery for ${orderId}`);
            try {
                if (order.paymentMethod === "COD") {
                    order.codCollected = order.totalPrice;
                }
                // Driver Earning Logic
                order.driverEarning = await calculateDriverEarning(order.totalPrice || 0);
            } catch (calcError) {
                console.error("[StatusUpdate] Earning calculation failed:", calcError.message);
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
            } catch (socketError) {
                console.error("[StatusUpdate] Socket error:", socketError.message);
            }
        }

        console.log(`[StatusUpdate] COMPLETED: Order ${orderId}`);
        return reply.send(populatedOrder);
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

        return reply.send(orders);
    } catch (error) {
        return reply.status(500).send({ message: "Failed to retrieve orders", error: error.message });
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

        return reply.send(order);
    } catch (error) {
        return reply.status(500).send({ message: "Failed to retrieve order", error: error.message });
    }
};
