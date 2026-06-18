import { Farmer } from "../models/user.js";
import { ProduceQuote } from "../models/produceQuote.js";
import Category from "../models/category.js";
import Product from "../models/products.js";
import jwt from "jsonwebtoken";
import { verifyToken } from "../middleware/auth.js";
import bcrypt from "bcrypt";

import { requestFarmerOtp, verifyFarmerOtp, registerFarmerDetails } from "../controllers/auth/farmerAuth.js";

export const farmerRoutes = async (fastify, options) => {
  
  // Auth Endpoints
  fastify.post("/farmer/auth/request-otp", requestFarmerOtp);
  fastify.post("/farmer/auth/verify-otp", verifyFarmerOtp);
  fastify.post("/farmer/auth/register-details", registerFarmerDetails);

  // Get farmer profile
  fastify.get("/farmer/profile", { preHandler: [verifyToken] }, async (req, reply) => {
    try {
      const farmer = await Farmer.findById(req.user.id).select("-password");
      if (!farmer) return reply.status(404).send({ success: false, message: "Farmer not found" });
      reply.send({ success: true, farmer });
    } catch (error) {
      reply.status(500).send({ success: false, message: "Server error" });
    }
  });

  // Get items that can be sold
  fastify.get("/farmer/produce-items", async (req, reply) => {
    try {
      const products = await Product.find({ isAvailable: true }).select("name image");
      reply.send({ success: true, items: products });
    } catch (error) {
      reply.status(500).send({ success: false, message: "Server error" });
    }
  });

  // Submit a new produce quote
  fastify.post("/farmer/quotes", { preHandler: [verifyToken] }, async (req, reply) => {
    try {
      const { itemName, quantity, unit, expectedPricePerUnit, handoverTimeSlot } = req.body;
      
      const quote = new ProduceQuote({
        farmer: req.user.id,
        itemName,
        quantity,
        unit,
        expectedPricePerUnit,
        handoverTimeSlot
      });

      await quote.save();
      reply.status(201).send({ success: true, quote });
    } catch (error) {
      fastify.log.error("Submit quote error:", error);
      reply.status(500).send({ success: false, message: "Server error" });
    }
  });

  // Get farmer's quotes
  fastify.get("/farmer/quotes", { preHandler: [verifyToken] }, async (req, reply) => {
    try {
      const quotes = await ProduceQuote.find({ farmer: req.user.id }).sort({ createdAt: -1 });
      reply.send({ success: true, quotes });
    } catch (error) {
      reply.status(500).send({ success: false, message: "Server error" });
    }
  });
};
