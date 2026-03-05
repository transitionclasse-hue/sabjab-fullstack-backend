import mongoose from "mongoose";
import Counter from "./counter.js";

const ticketSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
        },
        ticketId: {
            type: String,
            unique: true,
        },
        category: {
            type: String,
            enum: ["Order Issue", "Payment", "App Feedback", "Product Quality", "General"],
            required: true,
        },
        subject: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
        },
        status: {
            type: String,
            enum: ["Open", "Pending", "Resolved", "Closed"],
            default: "Open",
        },
        priority: {
            type: String,
            enum: ["Low", "Medium", "High"],
            default: "Medium",
        },
        lastMessageAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

ticketSchema.index({ customer: 1, status: 1 });
ticketSchema.index({ ticketId: 1 });

async function getNextSequenceValue(sequenceName) {
    const sequenceDocument = await Counter.findOneAndUpdate(
        { name: sequenceName },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
    );

    return sequenceDocument.sequence_value;
}

ticketSchema.pre("save", async function (next) {
    if (this.isNew && !this.ticketId) {
        const sequenceValue = await getNextSequenceValue("ticketId");
        this.ticketId = `TKT${sequenceValue.toString().padStart(5, "0")}`;
    }
    next();
});

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;
