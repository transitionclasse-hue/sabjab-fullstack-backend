import Ticket from "../models/ticket.js";
import SupportMessage from "../models/supportMessage.js";
import mongoose from "mongoose";

/**
 * Create a new support ticket
 */
export const createTicket = async (req, reply) => {
    try {
        const userId = req.user.userId;
        const { category, subject, description, orderId } = req.body;

        if (!category || !subject || !description) {
            return reply.status(400).send({ message: "Category, subject and description are required" });
        }

        const ticketData = {
            customer: userId,
            category,
            subject,
            description,
        };

        if (orderId) {
            ticketData.order = orderId;
        }

        const ticket = await Ticket.create(ticketData);

        // Create the initial message in the ticket thread
        await SupportMessage.create({
            customer: userId,
            ticket: ticket._id,
            sender: "customer",
            message: description,
        });

        return reply.send({
            success: true,
            message: "Ticket created successfully",
            ticket,
        });
    } catch (error) {
        console.error("Create Ticket Error:", error);
        return reply.status(500).send({ message: "Failed to create ticket" });
    }
};

/**
 * List all tickets for the logged-in user
 */
export const getUserTickets = async (req, reply) => {
    try {
        const userId = req.user.userId;
        const tickets = await Ticket.find({ customer: userId })
            .sort({ updatedAt: -1 })
            .populate("order", "orderId status totalPrice createdAt");

        return reply.send({
            success: true,
            tickets,
        });
    } catch (error) {
        console.error("Get User Tickets Error:", error);
        return reply.status(500).send({ message: "Failed to fetch tickets" });
    }
};

/**
 * Get details of a single ticket including its message history
 */
export const getTicketDetails = async (req, reply) => {
    try {
        const { ticketId } = req.params;
        const userId = req.user.userId;

        const ticket = await Ticket.findOne({ _id: ticketId, customer: userId })
            .populate("order", "orderId status totalPrice createdAt");

        if (!ticket) {
            return reply.status(404).send({ message: "Ticket not found" });
        }

        const messages = await SupportMessage.find({ ticket: ticketId })
            .sort({ createdAt: 1 });

        return reply.send({
            success: true,
            ticket,
            messages,
        });
    } catch (error) {
        console.error("Get Ticket Details Error:", error);
        return reply.status(500).send({ message: "Failed to fetch ticket details" });
    }
};

/**
 * Reply to an existing ticket
 */
export const replyToTicket = async (req, reply) => {
    try {
        const { ticketId } = req.params;
        const { message } = req.body;
        const userId = req.user.userId;

        if (!message) {
            return reply.status(400).send({ message: "Message is required" });
        }

        const ticket = await Ticket.findOne({ _id: ticketId, customer: userId });

        if (!ticket) {
            return reply.status(404).send({ message: "Ticket not found" });
        }

        if (ticket.status === "Closed") {
            return reply.status(400).send({ message: "Cannot reply to a closed ticket" });
        }

        const newMessage = await SupportMessage.create({
            customer: userId,
            ticket: ticket._id,
            sender: "customer",
            message,
        });

        // Update ticket's last message timestamp and ensure status is Open if it was previously Resolved/Pending
        ticket.lastMessageAt = new Date();
        if (ticket.status === "Resolved") {
            ticket.status = "Open";
        }
        await ticket.save();

        return reply.send({
            success: true,
            message: newMessage,
        });
    } catch (error) {
        console.error("Reply to Ticket Error:", error);
        return reply.status(500).send({ message: "Failed to send reply" });
    }
};
