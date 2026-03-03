import { Customer } from "../models/user.js";

/**
 * Determines if sensitive items should be hidden for the current request.
 * Default is true (hide sensitive) for public/unauthenticated requests.
 * @param {Object} req - Fastify request object
 * @returns {Promise<boolean>} - True if sensitive items should be HIDDEN
 */
export const getSafeSensitiveMode = async (req) => {
    try {
        if (!req.user || !req.user.userId) {
            return true; // Default to hiding sensitive items for public/unauthenticated users
        }

        if (req.user.role === 'Admin' || req.user.role === 'DeliveryPartner') {
            return false; // Show everything for Staff
        }

        const user = await Customer.findById(req.user.userId).select("sensitiveMode");
        if (!user) return true;

        return user.sensitiveMode !== false; // Hide if true or undefined
    } catch (error) {
        console.error("Error in getSafeSensitiveMode:", error);
        return true; // Safety default
    }
};
