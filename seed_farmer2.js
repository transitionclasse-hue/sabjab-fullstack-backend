import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

import { Farmer } from "./src/models/user.js";

async function seedFarmer() {
  try {
    const uri = "mongodb+srv://transitionclasse_db_user:devu1234@cluster0.7chsse0.mongodb.net/sabjab12?retryWrites=true&w=majority&appName=Cluster00";
    await mongoose.connect(uri);
    console.log("Connected to Sabjab MongoDB");

    const phone = "9999999999";
    const password = "password123";

    const existing = await Farmer.findOne({ phone });
    if (existing) {
      console.log("Dummy farmer already exists in this database!");
      // let's update password just in case
      existing.password = await bcrypt.hash(password, 10);
      await existing.save();
      console.log("Updated existing farmer.");
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
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

seedFarmer();
