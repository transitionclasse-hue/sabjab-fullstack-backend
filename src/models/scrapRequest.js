import mongoose from "mongoose";

const scrapRequestSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
    },
    category: {
        type: String,
        required: true,
        enum: ["plastic_bottles", "organic_waste", "newspaper_scrap", "aluminum_cans", "glass_bottles", "cardboard", "old_clothes", "e_waste"],
    },
    quantity: {
        type: Number,
        required: true,
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
        required: true,
    },
    pickupDate: {
        type: Date,
        required: true,
    },
    pickupSlot: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        default: "pending",
        enum: ["pending", "scheduled", "completed", "cancelled"],
    },
    pointsAwarded: {
        type: Number,
        default: 0,
    },
    notes: {
        type: String,
        default: "",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export const ScrapRequest = mongoose.model("ScrapRequest", scrapRequestSchema);
