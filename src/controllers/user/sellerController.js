import { Order, WalletTransaction, Product } from "../../models/index.js";
import { Seller } from "../../models/user.js";

export const getSellerOrders = async (req, reply) => {
    try {
        const { userId } = req.user;

        // Fetch orders that contain items belonging to this seller
        // We first find the seller's product IDs
        const sellerProducts = await Product.find({ sellerId: userId }).select("_id");
        const productIds = sellerProducts.map(p => p._id.toString());

        if (productIds.length === 0) {
            return reply.send([]);
        }

        // Find orders containing these products
        const orders = await Order.find({
            "items.item": { $in: productIds }
        })
        .populate("customer", "name phone")
        .populate("items.item")
        .sort({ createdAt: -1 });

        // Filter items in each order to ONLY show what belongs to this seller
        const sellerOrders = orders.map(order => {
            const orderObj = order.toObject();
            const filteredItems = orderObj.items.filter(item => 
                item.item && item.item.sellerId && item.item.sellerId.toString() === userId
            );

            // Calculate seller's specific earning for this order
            const sellerEarning = filteredItems.reduce((sum, item) => {
                const price = item.variation?.price || item.item?.price || 0;
                return sum + (price * (item.count || 1));
            }, 0);

            return {
                ...orderObj,
                items: filteredItems,
                sellerEarning
            };
        });

        return reply.send(sellerOrders);
    } catch (error) {
        console.error("Get Seller Orders Error:", error);
        return reply.status(500).send({ message: "Failed to fetch orders", error: error.message });
    }
};

export const getSellerWalletDetails = async (req, reply) => {
    try {
        const { userId } = req.user;

        const seller = await Seller.findById(userId).select("walletBalance");
        if (!seller) {
            return reply.status(404).send({ message: "Seller not found" });
        }

        const transactions = await WalletTransaction.find({ seller: userId })
            .sort({ createdAt: -1 })
            .limit(50);

        return reply.send({
            balance: seller.walletBalance || 0,
            transactions
        });
    } catch (error) {
        console.error("Get Seller Wallet Error:", error);
        return reply.status(500).send({ message: "Failed to fetch wallet info", error: error.message });
    }
};
