import mongoose from "mongoose";
import dotenv from "dotenv";
import Occasion from "./src/models/occasion.js";
import Product from "./src/models/products.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://transitionclasse_db_user:devu1234@cluster0.7chsse0.mongodb.net/sabjab";

// Festive Mock Data Layout
const mockOccasions = [
    { name: "Holi Specials", icon: "https://res.cloudinary.com/dponzgerb/image/upload/v1723444869/category/vyakccm3axdyt8yei8wc.png", banner: "https://res.cloudinary.com/dponzgerb/image/upload/v1723444870/category/f6er254kgnmymlbguddd.png", order: 1 },
    { name: "Diwali Fest", icon: "https://res.cloudinary.com/dponzgerb/image/upload/v1723444869/category/diucqrlsuqympqtwdkip.png", banner: "https://res.cloudinary.com/dponzgerb/image/upload/v1723444869/category/diucqrlsuqympqtwdkip.png", order: 2 },
    { name: "Summer Chill", icon: "https://res.cloudinary.com/dponzgerb/image/upload/v1723444869/category/uic8gcnbzknosdvva13o.png", banner: "https://res.cloudinary.com/dponzgerb/image/upload/v1723444869/category/uic8gcnbzknosdvva13o.png", order: 3 },
    { name: "Pure Organic", icon: "https://res.cloudinary.com/dponzgerb/image/upload/v1723444869/category/cq7m7yxuttemyb4tkidp.png", banner: "https://res.cloudinary.com/dponzgerb/image/upload/v1723444869/category/cq7m7yxuttemyb4tkidp.png", order: 4 },
];

const seedOccasions = async () => {
    try {
        console.log("🌱 Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected securely!");

        // 1. WIPE existing occasions
        await Occasion.deleteMany({});
        console.log("🧹 Cleared old Occasions.");

        // 2. Fetch some valid products from our database to assign to occasions dynamically
        const allProducts = await Product.find().limit(50);
        const productIds = allProducts.map(p => p._id);

        if (productIds.length === 0) {
            console.log("❌ No products found in database! Please seed Blinkit products first.");
            process.exit(1);
        }

        for (const occ of mockOccasions) {
            // Assign a random subset of 6-10 products to each occasion so the list looks full
            const numProducts = Math.floor(Math.random() * 5) + 6;

            // Shuffle array to get unique random clusters
            const selectedProducts = productIds.sort(() => 0.5 - Math.random()).slice(0, numProducts);

            await Occasion.create({
                name: occ.name,
                icon: occ.icon,
                banner: occ.banner,
                order: occ.order,
                products: selectedProducts,
                isActive: true
            });
        }

        console.log(`✅ Successfully seeded ${mockOccasions.length} Curated Occasions!`);

    } catch (err) {
        console.error("❌ Seeding Error:", err);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from DB.");
        process.exit(0);
    }
};

seedOccasions();
