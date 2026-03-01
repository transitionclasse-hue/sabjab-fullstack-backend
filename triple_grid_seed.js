import mongoose from "mongoose";
import dotenv from "dotenv";
import HomeComponent from "./src/models/homeComponent.js";
import Product from "./src/models/products.js";
import Occasion from "./src/models/occasion.js";
import SuperCategory from "./src/models/superCategory.js";

dotenv.config();

/**
 * 🚀 TRIPLE GRID SEEDER
 * This script creates a backend component for the "Triple Screen" layout
 * and attaches it to your active homepage variations.
 */
const seedTripleGrid = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB...");

        // 1. Fetch top supercategories
        const superCats = await SuperCategory.find().sort({ order: 1 });
        console.log(`Found ${superCats.length} supercategories.`);

        if (superCats.length < 3) {
            console.log("⚠️ Need at least 3 supercategories to build the triple grid.");
            process.exit(0);
        }

        // 2. Prepare sections data by finding products for each
        const sectionsData = await Promise.all(superCats.slice(0, 3).map(async (sc, idx) => {
            const products = await Product.find({ superCategory: sc._id }).limit(4).select('_id');
            return {
                title: sc.name,
                subtitle: `Explore ${sc.name} items`,
                color: ["#E53935", "#1E88E5", "#43A047"][idx % 3],
                products: products.map(p => p._id),
                categoryId: null // Can be linked to a specific category if needed
            };
        }));

        // 3. Create the HomeComponent entry
        // Remove existing one if we want to reset
        await HomeComponent.deleteMany({ type: "TRIPLE_SECTION_GRID" });

        const component = await HomeComponent.create({
            title: "Our Top Picks",
            type: "TRIPLE_SECTION_GRID",
            sections: sectionsData,
            isActive: true
        });

        console.log(`✅ Created TRIPLE_SECTION_GRID component: ${component._id}`);

        // 4. Attach to all Active Homepage Variations (Occasions)
        const activeVariations = await Occasion.find({ isActive: true });

        for (const variation of activeVariations) {
            // Check if already present
            if (!variation.components.includes(component._id)) {
                variation.components.unshift(component._id); // Push to TOP
                await variation.save();
                console.log(`🔗 Linked to variation: ${variation.name}`);
            }
        }

        console.log("🎉 Triple Grid Backend Seeding Complete!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding Error:", error);
        process.exit(1);
    }
};

seedTripleGrid();
