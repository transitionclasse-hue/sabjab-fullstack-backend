import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { Farmer } from "./src/models/user.js";

async function seedTestFarmer() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb+srv://transitionclasse_db_user:devu1234@cluster0.7chsse0.mongodb.net/sabjab12?retryWrites=true&w=majority&appName=Cluster00";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const phone = 9999999999;
    
    let farmer = await Farmer.findOne({ phone });
    if (farmer) {
      console.log("Dummy farmer exists, updating approval status...");
      farmer.name = "Test Farmer";
      farmer.village = "Kisan Nagar";
      farmer.farmAddress = "Plot 42, Green Fields";
      farmer.isApproved = true;
      farmer.isActivated = true;
      farmer.role = "Farmer";
      await farmer.save();
      console.log("Successfully updated and approved the test farmer account.");
    } else {
      console.log("Creating new dummy farmer...");
      farmer = new Farmer({
        name: "Test Farmer",
        phone: phone,
        village: "Kisan Nagar",
        farmAddress: "Plot 42, Green Fields",
        isApproved: true,
        isActivated: true,
        role: "Farmer"
      });
      await farmer.save();
      console.log("Successfully created and approved a new test farmer account.");
    }

    process.exit(0);
  } catch (err) {
    console.error("Error seeding test farmer:", err);
    process.exit(1);
  }
}

seedTestFarmer();
