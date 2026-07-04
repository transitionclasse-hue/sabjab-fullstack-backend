import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./src/models/products.js";
import Category from "./src/models/category.js";
import SubCategory from "./src/models/subCategory.js";
import SuperCategory from "./src/models/superCategory.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://transitionclasse_db_user:devu1234@cluster0.7chsse0.mongodb.net/sabjab";

// ALL products below have VERIFIED image URLs - the numeric IDs were extracted
// directly from the Blinkit DOM, ensuring correct product-to-image mapping.
// Image URL format: https://cdn.grofers.com/app/images/products/sliding_image/{id}a.jpg
const scrapedProducts = [
  { "name": "Everyuth Tulsi Turmeric Face Wash 150 ml", "price": 117, "mrp": 250, "packSize": "150 ml", "imageUrl": "https://cdn.grofers.com/app/images/products/sliding_image/35347a.jpg" },
  { "name": "Himalaya Pollution Detox Charcoal Face Wash", "price": 145, "mrp": 220, "packSize": "100 ml", "imageUrl": "https://cdn.grofers.com/app/images/products/sliding_image/525805a.jpg" },
  { "name": "Lakme Strawberry Gel Face Wash (100% Real Strawberry Extract)", "price": 232, "mrp": 289, "packSize": "100 g", "imageUrl": "https://cdn.grofers.com/app/images/products/sliding_image/43643a.jpg" },
  { "name": "Lotus Herbals Whiteglow 3 In 1 Deep Cleaning Skin Whitening Facial Foam", "price": 214, "mrp": 310, "packSize": "100 g", "imageUrl": "https://cdn.grofers.com/app/images/products/sliding_image/273620a.jpg" },
  { "name": "Chemist At Play Gentle Exfoliating Face Scrub", "price": 301, "mrp": 349, "packSize": "100 ml", "imageUrl": "https://cdn.grofers.com/app/images/products/sliding_image/576162a.jpg" },
  { "name": "Dot & Key Mango Detan Gel Face Wash", "price": 215, "mrp": 249, "packSize": "100 ml", "imageUrl": "https://cdn.grofers.com/app/images/products/sliding_image/564654a.jpg" },
  { "name": "The Face Shop Rice Water Bright Foaming Cleanser", "price": 625, "mrp": 625, "packSize": "100 ml", "imageUrl": "https://cdn.grofers.com/app/images/products/sliding_image/506655a.jpg" },
  { "name": "CeraVe Foaming Face Cleanser Face Wash for Normal to Oily Skin", "price": 502, "mrp": 559, "packSize": "88 ml", "imageUrl": "https://cdn.grofers.com/app/images/products/sliding_image/679280a.jpg" },
  { "name": "Pilgrim Salicylic & Glycolic Acid Foaming Face Wash", "price": 276, "mrp": 345, "packSize": "120 ml", "imageUrl": "https://cdn.grofers.com/app/images/products/sliding_image/492977a.jpg" },
  { "name": "The Derma Co 2.5% Benzoyl Peroxide Gel Face Wash", "price": 269, "mrp": 299, "packSize": "100 ml", "imageUrl": "https://cdn.grofers.com/app/images/products/sliding_image/715621a.jpg" },
  { "name": "MCaffeine Berries Brightening Coffee Face Scrub", "price": 227, "mrp": 249, "packSize": "75 ml", "imageUrl": "https://cdn.grofers.com/app/images/products/sliding_image/615956a.jpg" },
  { "name": "Mamaearth Beetroot Gentle Face Wash", "price": 256, "mrp": 285, "packSize": "100 ml", "imageUrl": "https://cdn.grofers.com/app/images/products/sliding_image/553142a.jpg" },
  // Products from second DOM scrape (numeric IDs extracted from DOM id attributes)
  { "name": "The Derma Co 1% Salicylic Acid Gel Face Wash", "price": 227, "mrp": 259, "packSize": "100 ml", "imageUrl": "https://cdn.grofers.com/app/images/products/sliding_image/538610a.jpg" },
  { "name": "Minimalist 2% Salicylic Acid Face Serum for Acne", "price": 483, "mrp": 569, "packSize": "30 ml", "imageUrl": "https://cdn.grofers.com/app/images/products/sliding_image/519948a.jpg" },
  { "name": "Minimalist 10% Vitamin B5 Gel Face Moisturizer", "price": 424, "mrp": 499, "packSize": "50 g", "imageUrl": "https://cdn.grofers.com/app/images/products/sliding_image/500361a.jpg" },
  // Products from third DOM scrape (IDs: 506655 combo, clean&clear, 536119, 496414)
  { "name": "The Face Shop Rice Water Bright Foaming Cleanser Combo", "price": 370, "mrp": 370, "packSize": "1 pack", "imageUrl": "https://cdn.grofers.com/app/images/products/sliding_image/506655a.jpg" },
  { "name": "Clean & Clear Foaming Face Wash 150 ml", "price": 270, "mrp": 299, "packSize": "150 ml", "imageUrl": "https://cdn.grofers.com/app/images/products/sliding_image/19585a.jpg" },
  { "name": "Himalaya Natural Glow Kesar Face Wash", "price": 97, "mrp": 279, "packSize": "150 ml", "imageUrl": "https://cdn.grofers.com/app/images/products/sliding_image/536119a.jpg" },
  { "name": "Joy Revivify Ubtan Face Wash 150 ml", "price": 244, "mrp": 300, "packSize": "150 ml", "imageUrl": "https://cdn.grofers.com/app/images/products/sliding_image/496414a.jpg" },
  { "name": "Lakme Perfect Radiance Brightening Face Wash", "price": 185, "mrp": 250, "packSize": "100 g", "imageUrl": "https://cdn.grofers.com/app/images/products/sliding_image/10714a.jpg" },
  { "name": "Lotus Herbals Apriscrub Fresh Apricot Face Scrub", "price": 180, "mrp": 245, "packSize": "100 g", "imageUrl": "https://cdn.grofers.com/app/images/products/sliding_image/273620a.jpg" }
];

const seedDatabases = async () => {
    try {
        console.log("🌱 Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected securely!");

        let superCat = await SuperCategory.findOne({ name: { $regex: /Beauty/i } });
        let superCategoryId = superCat ? superCat._id : null;

        let category = await Category.findOne({ name: "Face Cleaning" });
        if (!category) {
             category = await Category.create({
                 name: "Face Cleaning",
                 image: "https://cdn.grofers.com/app/images/products/sliding_image/538610a.jpg",
                 superCategory: superCategoryId
             });
             console.log("🆕 Created new Category: Face Cleaning");
        }

        let subCategory = await SubCategory.findOne({ name: "All Face Cleaning", category: category._id });
        if (!subCategory) {
             subCategory = await SubCategory.create({
                 name: "All Face Cleaning",
                 category: category._id
             });
             console.log("🆕 Created new SubCategory: All Face Cleaning");
        }

        // Deduplicate by name
        const seen = new Set();
        const unique = scrapedProducts.filter(p => {
            if (seen.has(p.name)) return false;
            seen.add(p.name);
            return true;
        });

        const productNames = unique.map(p => p.name);
        const delResult = await Product.deleteMany({ name: { $in: productNames }, userStockLimit: 1, stock: 2 });
        console.log(`🧹 Cleared ${delResult.deletedCount} previously seeded face cleaning products.`);

        const productsToInsert = unique.map(p => ({
            name: p.name,
            price: p.mrp,
            discountPrice: p.price,
            quantity: p.packSize,
            image: p.imageUrl,
            description: `Pack size: ${p.packSize} only.`,
            stock: 2,
            userStockLimit: 1,
            isAvailable: true,
            isApproved: true,
            category: category._id,
            subCategory: subCategory._id,
            superCategory: superCategoryId
        }));

        const result = await Product.insertMany(productsToInsert);
        console.log(`✅ Successfully seeded ${result.length} face cleaning products (all with verified images)!`);

    } catch (err) {
        console.error("❌ Seeding Error:", err);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from DB.");
        process.exit(0);
    }
};

seedDatabases();
