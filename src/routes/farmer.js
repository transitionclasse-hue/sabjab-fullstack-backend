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

  // Get items that can be sold (from approved categories or default Vegetables & Fruits)
  fastify.get("/farmer/produce-items", async (req, reply) => {
    try {
      const approvedCategories = await Category.find({
        $or: [
          { isApprovedForFarmers: true },
          { name: { $regex: /vegetables?\s*(&|and)\s*fruits?/i } }
        ]
      });
      const categoryIds = approvedCategories.map(cat => cat._id);

      const products = await Product.find({ 
        category: { $in: categoryIds },
        isAvailable: true, 
        isApproved: true 
      }).select("name image");
      reply.send({ success: true, items: products });
    } catch (error) {
      reply.status(500).send({ success: false, message: "Server error" });
    }
  });

  // Get categories available to farmers
  fastify.get("/farmer/categories", async (req, reply) => {
    try {
      const categories = await Category.find({
        $or: [
          { isApprovedForFarmers: true },
          { name: { $regex: /vegetables?\s*(&|and)\s*fruits?/i } }
        ]
      }).select("name image");
      reply.send({ success: true, categories });
    } catch (error) {
      reply.status(500).send({ success: false, message: "Server error" });
    }
  });

  // Upload a new product by farmer (pending manager approval)
  fastify.post("/farmer/products", { preHandler: [verifyToken] }, async (req, reply) => {
    try {
      const { name, categoryId, description, price } = req.body;
      if (!name || !categoryId) {
        return reply.status(400).send({ success: false, message: "Name and Category are required." });
      }

      const category = await Category.findOne({
        _id: categoryId,
        $or: [
          { isApprovedForFarmers: true },
          { name: { $regex: /vegetables?\s*(&|and)\s*fruits?/i } }
        ]
      });
      if (!category) {
        return reply.status(400).send({ success: false, message: "Invalid or unauthorized category." });
      }

      const product = new Product({
        name,
        category: categoryId,
        description: description || "",
        price: Number(price) || 0,
        quantity: "1 kg",
        isApproved: false,
        isAvailable: true,
        farmerId: req.user.id
      });

      await product.save();
      reply.status(201).send({ success: true, product, message: "Product uploaded successfully, pending approval." });
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
