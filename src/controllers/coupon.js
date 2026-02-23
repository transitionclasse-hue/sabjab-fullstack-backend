import { Coupon } from "../models/coupon.js";

export const getActiveCoupons = async (req, reply) => {
    try {
        const now = new Date();
        // Fetch coupons that are:
        // 1. Active
        // 2. Not expired
        // 3. Haven't reached usage limit (if applicable)
        const coupons = await Coupon.find({
            isActive: true,
            expirationDate: { $gt: now },
            $or: [
                { usageLimit: null },
                { $expr: { $lt: ["$usedCount", "$usageLimit"] } }
            ]
        }).sort({ createdAt: -1 });

        return reply.send({
            success: true,
            coupons,
        });
    } catch (error) {
        console.error("Fetch Coupons Error:", error);
        return reply.status(500).send({
            success: false,
            message: "Failed to fetch coupons",
            error: error.message,
        });
    }
};
