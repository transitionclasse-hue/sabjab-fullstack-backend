// src/models/tokriPreorder.js
import mongoose from "mongoose";

const tokriPreorderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        qty: { type: Number, default: 1 },
        name: String,
        unit: String,
        price: Number,
      },
    ],
    status: { type: String, enum: ["committed", "checked_out"], default: "committed" },
  },
  { timestamps: true }
);

export const TokriPreorder = mongoose.model("TokriPreorder", tokriPreorderSchema);
