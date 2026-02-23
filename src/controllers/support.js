import GlobalConfig from "../models/globalConfig.js";
import SupportMessage from "../models/supportMessage.js";

export const getSupportConfig = async (req, reply) => {
    try {
        const config = await GlobalConfig.findOne({ key: "support_contact" });

        // Default fallback if not set in DB
        const defaultValue = {
            phone: "+911234567890",
            email: "support@sabjab.com"
        };

        return reply.send({
            success: true,
            support: config ? config.value : defaultValue
        });
    } catch (error) {
        console.error("Get Support Config Error:", error);
        return reply.status(500).send({ message: "Failed to fetch support config" });
    }
};

export const getSupportMessages = async (req, reply) => {
    try {
        const userId = req.user.userId;
        const messages = await SupportMessage.find({ customer: userId })
            .sort({ createdAt: 1 }) // Chronological order for chat
            .limit(50);

        return reply.send({
            success: true,
            messages
        });
    } catch (error) {
        console.error("Get Support Messages Error:", error);
        return reply.status(500).send({ message: "Failed to fetch messages" });
    }
};

export const sendSupportMessage = async (req, reply) => {
    try {
        const userId = req.user.userId;
        const { message } = req.body;

        if (!message) {
            return reply.status(400).send({ message: "Message is required" });
        }

        const newMessage = await SupportMessage.create({
            customer: userId,
            sender: "customer",
            message
        });

        return reply.send({
            success: true,
            message: newMessage
        });
    } catch (error) {
        console.error("Send Support Message Error:", error);
        return reply.status(500).send({ message: "Failed to send message" });
    }
};
