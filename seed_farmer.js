import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

import { Farmer } from "./src/models/user.js";

async function seedFarmer() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://Eterna-Elegance:Eterna%40123@eterna.72rts.mongodb.net/Sabjab-Backend");
    console.log("Connected to MongoDB");

    const phone = "9999999999";
    const password = "password123";

    const existing = await Farmer.findOne({ phone });
    if (existing) {
      console.log("Dummy farmer already exists!");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const farmer = new Farmer({
      name: "Raju Farmer",
      phone: phone,
      password: hashedPassword,
      village: "Kisan Nagar",
      farmAddress: "Plot 42, Green Fields",
      role: "Farmer"
    });

    await farmer.save();
    console.log("Successfully created dummy farmer account:");
    console.log(`Phone: ${phone}`);
    console.log(`Password: ${password}`);
    process.exit(0);
  } catch (err) {
    console.error("Error seeding farmer:", err);
    process.exit(1);
  }
}

seedFarmer();
