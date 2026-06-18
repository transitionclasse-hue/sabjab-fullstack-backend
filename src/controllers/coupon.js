import { Coupon } from "../models/coupon.js";

export const getActiveCoupons = async (req, reply) => {
    try {
        const now = new Date();
        const { isMilestone } = req.query;

        const query = {
            isActive: true,
            expirationDate: { $gt: now },
            $or: [
                { usageLimit: null },
                { $expr: { $lt: ["$usedCount", "$usageLimit"] } }
            ]
        };

        if (isMilestone === "true") {
            query.isMilestone = true;
        } else {
            query.isMilestone = { $ne: true };
            query.isHidden = { $ne: true };
        }

        const coupons = await Coupon.find(query).sort({ createdAt: -1 });

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
