import { Order, DeliveryPartner, Customer, Branch, Product, Coupon, GreenPoints, GreenPointsConfig, Referral } from "../../models/index.js";
import PricingConfig from "../../models/pricingConfig.js";

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

        if (order.status !== "available") {
            return reply.status(400).send({ message: "Order is not available" }); //
        }

        order.status = "confirmed"; //
        order.deliveryPartner = userId; //
        order.deliveryPersonLocation = { //
            latitude: deliveryPersonLocation?.latitude, //
            longitude: deliveryPersonLocation?.longitude, //
            address: deliveryPersonLocation.address || "", //
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

        return reply.send(order); //
    } catch (error) {
        return reply.status(500).send({ message: "Failed to confirm order", error }); //
    }
};

// Update Order Status (Live Tracking Updates)
export const updateOrderStatus = async (req, reply) => {
    try {
        const { orderId } = req.params; //
        const { status, deliveryPersonLocation } = req.body; //
        const { userId } = req.user; //

        const deliveryPerson = await DeliveryPartner.findById(userId); //
        if (!deliveryPerson) {
            return reply.status(404).send({ message: "Delivery Person not found" }); //
        }

        const order = await Order.findById(orderId); //
        if (!order) {
            return reply.status(404).send({ message: "Order not found" }); //
        }

        if (["cancelled", "delivered"].includes(order.status)) {
            return reply.status(400).send({ message: "Order cannot be updated" }); //
        }

        if (order.deliveryPartner.toString() !== userId) {
            return reply.status(403).send({ message: "Unauthorized" }); //
        }

        const oldStatus = order.status;
        order.status = status;
        order.deliveryPersonLocation = deliveryPersonLocation;
        if (status === "delivered" && oldStatus !== "delivered") {
            // Driver Earning
            if (!order.driverEarning) {
                const config = await PricingConfig.findOne({ key: "primary" });
                const baseFee = config?.baseDeliveryFee ?? 20;
                const freeThreshold = config?.freeDeliveryThreshold ?? 199;
                const freeEnabled = config?.freeDeliveryEnabled ?? true;
                const itemsTotal = order.totalPrice || 0;
                order.driverEarning = freeEnabled && itemsTotal >= freeThreshold ? 0 : baseFee;
            }

            // Award Green Points to Customer
            try {
                const gpConfig = await GreenPointsConfig.getConfig();
                if (gpConfig.earnRules.sustainablePurchase?.enabled) {
                    const pointsPerHundred = gpConfig.earnRules.sustainablePurchase.pointsPerHundred || 1;
                    const points = Math.floor((order.totalPrice / 100) * pointsPerHundred);

                    if (points > 0) {
                        const gpRecord = await GreenPoints.getOrCreate(order.customer);
                        await gpRecord.earnPoints(
                            "sustainable_purchase",
                            points,
                            `Reward for Order #${order.orderId || order._id}`,
                            order.orderId || order._id
                        );

                        // Sync balance to customer model for fast access
                        await Customer.findByIdAndUpdate(order.customer, {
                            greenPointsBalance: gpRecord.totalBalance
                        });
                    }
                }
            } catch (gpError) {
                console.error("Failed to award Green Points:", gpError);
            }

            // --- REFERRAL BONUS (On Delivery) ---
            try {
                const gpConfig = await GreenPointsConfig.getConfig();
                const refSettings = gpConfig.earnRules.referral;

                if (refSettings.enabled && refSettings.trigger === "first_purchase") {
                    // Check if customer was referred
                    const customer = await Customer.findById(order.customer);

                    if (customer.referredBy) {
                        // Check if this is the customer's first delivered order
                        const deliveredCount = await Order.countDocuments({
                            customer: order.customer,
                            status: "delivered"
                        });

                        // If count is 1 (this order), it's the first one!
                        if (deliveredCount === 1) {
                            const referral = await Referral.findOne({
                                referrer: customer.referredBy,
                                referee: order.customer,
                                bonusesAwarded: false
                            });

                            if (referral) {
                                const awardToReferrer = ["referrer", "both"].includes(refSettings.awardTo);
                                const awardToReferee = ["referee", "both"].includes(refSettings.awardTo);

                                if (awardToReferrer) {
                                    const referrerGP = await GreenPoints.getOrCreate(referral.referrer);
                                    await referrerGP.earnPoints(
                                        "referral",
                                        referral.referrerPoints,
                                        `Referral bonus for ${customer.name || 'Friend'}'s first order`,
                                        referral.referralCode
                                    );
                                    await Customer.findByIdAndUpdate(referral.referrer, {
                                        greenPointsBalance: referrerGP.totalBalance
                                    });
                                }

                                if (awardToReferee) {
                                    const refereeGP = await GreenPoints.getOrCreate(order.customer);
                                    await refereeGP.earnPoints(
                                        "referral",
                                        referral.refereePoints,
                                        "First order referral bonus",
                                        referral.referralCode
                                    );
                                    await Customer.findByIdAndUpdate(order.customer, {
                                        greenPointsBalance: refereeGP.totalBalance
                                    });
                                }

                                await referral.markBonusesAwarded();
                                console.log(`✅ Referral bonuses awarded for order ${order._id}`);
                            }
                        }
                    }
                }
            } catch (refError) {
                console.error("Failed to award Referral Bonus:", refError);
            }
            // -------------------------------------
        }

        // --- STOCK RESTORATION ON CANCELLATION ---
        if (status === "cancelled" && oldStatus !== "cancelled") {
            for (const orderItem of order.items) {
                const product = await Product.findById(orderItem.item);
                if (product) {
                    product.stock += (orderItem.count || 0);
                    await product.save();
                }
            }
        }
        // -----------------------------------------

        await order.save();

        const populatedOrder = await Order.findById(order._id).populate(
            "customer branch items.item deliveryPartner"
        );
        req.server.io.to(orderId).emit("liveTrackingUpdates", {
            ...populatedOrder.toObject(),
            deliveryPartnerName: populatedOrder?.deliveryPartner?.name || "",
        }); //

        req.server.io.emit("admin:system-alert", {
            message: `Order #${populatedOrder.orderId || order._id.toString().substring(0, 8)} status updated to ${status}`,
            orderId: String(order._id),
            status: status
        });

        return reply.send(order); //
    } catch (error) {
        return reply.status(500).send({ message: "Failed to update order status", error }); //
    }
};

// Fetch all orders with optional filters
export const getOrders = async (req, reply) => {
    try {
        const { status, customerId, deliveryPartnerId, branchId } = req.query; //
        const { userId, role } = req.user || {};
        let query = {};

        if (status) query.status = status; //

        // Enforce tenant isolation based on authenticated role.
        if (role === "Customer") {
            query.customer = userId;
        } else if (role === "DeliveryPartner") {
            // Drivers can see orders assigned to them OR available orders
            query.$or = [
                { deliveryPartner: userId },
                { status: "available" }
            ];
        } else if (role === "Admin" || role === "Manager") {
            // Admin/Manager can filter by any ID
            if (customerId) query.customer = customerId;
            if (deliveryPartnerId) query.deliveryPartner = deliveryPartnerId;
        } else {
            // Safety: If role is unknown, return nothing rather than everything
            return reply.send([]);
        }

        if (branchId) {
            query.branch = branchId;
        }

        const orders = await Order.find(query).populate(
            "customer branch items.item deliveryPartner" //
        );

        return reply.send(orders); //
    } catch (error) {
        return reply.status(500).send({ message: "Failed to retrieve orders", error }); //
    }
};

// Fetch a single order by ID
export const getOrderById = async (req, reply) => {
    try {
        const { orderId } = req.params; //
        const { userId, role } = req.user || {};
        const order = await Order.findById(orderId).populate(
            "customer branch items.item deliveryPartner" //
        );

        if (!order) {
            return reply.status(404).send({ message: "Order not found" }); //
        }

        // Enforce access control on single-order fetch.
        const orderCustomerId = order.customer?._id || order.customer;
        const orderPartnerId = order.deliveryPartner?._id || order.deliveryPartner;

        if (role === "Customer" && String(orderCustomerId) !== String(userId)) {
            return reply.status(403).send({ message: "Unauthorized access to this order" });
        }

        if (role === "DeliveryPartner" && String(orderPartnerId) !== String(userId)) {
            return reply.status(403).send({ message: "Unauthorized access to this order" });
        }

        return reply.send(order); //
    } catch (error) {
        return reply.status(500).send({ message: "Failed to retrieve order", error }); //
    }
};
