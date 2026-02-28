import mongoose from "mongoose";
import dotenv from "dotenv";
import SuperCategory from "./src/models/superCategory.js";
import Category from "./src/models/category.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const debug = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to DB");

        const superCats = await SuperCategory.find();
        console.log("--- SUPERCATEGORIES ---");
        superCats.forEach(sc => {
            console.log(`ID: ${sc._id}, Name: "${sc.name}"`);
        });

        const cats = await Category.find().populate("superCategory");
        console.log("\n--- CATEGORIES ---");
        cats.forEach(c => {
            console.log(`ID: ${c._id}, Name: "${c.name}", SuperCategory: ${c.superCategory ? (typeof c.superCategory === 'object' ? c.superCategory.name : c.superCategory) : 'NONE'}`);
        });

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

debug();
