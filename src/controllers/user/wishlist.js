import { Customer } from "../../models/user.js";

// Toggle Wishlist Item
export const toggleWishlist = async (req, reply) => {
    try {
        const { userId } = req.user;
        const { productId } = req.body;

        if (!productId) {
            return reply.code(400).send({ message: "Product ID is required" });
        }

        const customer = await Customer.findById(userId);
        if (!customer) {
            return reply.code(404).send({ message: "Customer not found" });
        }

        const index = customer.wishlist.indexOf(productId);
        if (index === -1) {
            customer.wishlist.push(productId);
        } else {
            customer.wishlist.splice(index, 1);
        }

        await customer.save();

        const updatedCustomer = await Customer.findById(userId).populate("wishlist");

        return reply.send({ message: "Wishlist updated", wishlist: updatedCustomer.wishlist });
    } catch (error) {
        req.log.error(error);
        return reply.code(500).send({ message: "Internal server error", error: error.message });
    }
};

// Get User Wishlist
export const getWishlist = async (req, reply) => {
    try {
        const { userId } = req.user;

        const customer = await Customer.findById(userId).populate("wishlist");
        if (!customer) {
            return reply.code(404).send({ message: "Customer not found" });
        }

        return reply.send({ wishlist: customer.wishlist });
    } catch (error) {
        req.log.error(error);
        return reply.code(500).send({ message: "Internal server error", error: error.message });
    }
};
