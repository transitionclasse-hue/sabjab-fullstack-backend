import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
    },
    label: { type: String, required: true }, // 'Home', 'Work', 'Other'
    houseNo: { type: String },
    area: { type: String },
    landmark: { type: String },
    pincode: { type: String },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
});

export const Address = mongoose.model("Address", addressSchema);
