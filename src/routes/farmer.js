import { Farmer } from "../models/user.js";
import { ProduceQuote } from "../models/produceQuote.js";
import { Category } from "../models/category.js";
import jwt from "jsonwebtoken";
import { verifyToken } from "../middleware/auth.js";
import bcrypt from "bcrypt";

export const farmerRoutes = async (fastify, options) => {
  
  // Register a new farmer
  fastify.post("/farmer/auth/register", async (req, reply) => {
    try {
      const { name, phone, password, village, farmAddress } = req.body;
      
      const existing = await Farmer.findOne({ phone });
      if (existing) {
        return reply.status(400).send({ success: false, message: "Phone number already registered" });
      }

      const farmer = new Farmer({
        name,
        phone,
        password,
        village,
        farmAddress,
        role: "Farmer"
      });

      await farmer.save();
      
      const token = jwt.sign({ id: farmer._id, role: farmer.role }, process.env.JWT_SECRET || "sabjab_secret", { expiresIn: "30d" });
      
      reply.status(201).send({ success: true, user: { _id: farmer._id, name: farmer.name, phone: farmer.phone, role: farmer.role }, token });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ success: false, message: "Server error" });
    }
  });

  // Login farmer
  fastify.post("/farmer/auth/login", async (req, reply) => {
    try {
      const { phone, password } = req.body;
      
      const farmer = await Farmer.findOne({ phone, role: "Farmer" });
      if (!farmer) {
        return reply.status(401).send({ success: false, message: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, farmer.password);
      if (!isMatch) {
        return reply.status(401).send({ success: false, message: "Invalid credentials" });
      }

      const token = jwt.sign({ id: farmer._id, role: farmer.role }, process.env.JWT_SECRET || "sabjab_secret", { expiresIn: "30d" });
      
      reply.send({ success: true, user: { _id: farmer._id, name: farmer.name, phone: farmer.phone, role: farmer.role, isApproved: farmer.isApproved }, token });
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ success: false, message: "Server error" });
    }
  });

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
      const categories = await Category.find({}).select("name image");
      reply.send({ success: true, items: categories });
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
