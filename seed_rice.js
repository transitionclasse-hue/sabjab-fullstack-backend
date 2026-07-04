import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import Product from "./src/models/products.js";
import Category from "./src/models/category.js";
import SubCategory from "./src/models/subCategory.js";
import SuperCategory from "./src/models/superCategory.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://transitionclasse_db_user:devu1234@cluster0.7chsse0.mongodb.net/sabjab";
const SCRATCHPAD_PATH = "/Users/rajeevsharma/.gemini/antigravity-ide/brain/9ebb4352-e53d-4753-8623-ea275b7199fb/browser/scratchpad_ieu2vg9w.md";

const parseScrapedProducts = () => {
  const content = fs.readFileSync(SCRATCHPAD_PATH, "utf-8");
  const lines = content.split("\n");
  const products = [];

  for (const line of lines) {
    if (!line.match(/^\d+\./)) continue;

    const parts = line.replace(/^\d+\.\s+/, "").split("|").map(p => p.trim());
    if (parts.length < 2) continue;

    const name = parts[0];
    let price = 0;
    let mrp = 0;
    let id = "";

    const idPart = parts.find(p => p.startsWith("ID:"));
    if (idPart) {
      id = idPart.replace("ID:", "").trim();
    }

    const priceParts = parts.filter(p => p.startsWith("₹"));
    if (priceParts.length === 1) {
      price = parseFloat(priceParts[0].replace("₹", "").trim());
      mrp = price;
    } else if (priceParts.length >= 2) {
      price = parseFloat(priceParts[0].replace("₹", "").trim());
      // Remove any % OFF text from MRP string
      mrp = parseFloat(priceParts[1].replace("₹", "").replace(/\(.*\)/, "").replace(/% off/i, "").trim());
    }

    // Determine packSize
    let packSize = "1 kg";
    const sizeMatch = name.match(/(\d+(?:\.\d+)?\s*(?:kg|g|ltr|ml|pack|Kg|G|Ltr|Ml))/i);
    if (sizeMatch) {
      packSize = sizeMatch[1].toLowerCase();
    } else {
      const nameLower = name.toLowerCase();
      if (nameLower.includes("muri") || nameLower.includes("murmura") || nameLower.includes("puffed")) {
        packSize = "250 g";
      } else if (nameLower.includes("kit")) {
        packSize = "330 g";
      } else if (mrp >= 250) {
        packSize = "5 kg";
      } else {
        packSize = "1 kg";
      }
    }

    // Clean pack size string formatting (e.g. 5 kg instead of 5 Kg)
    packSize = packSize.replace(/\s+/g, " ").trim();

    products.push({
      name,
      price, // discounted selling price
      mrp,   // original MRP
      packSize,
      imageUrl: id === "543479"
        ? "https://cdn.grofers.com/app/images/products/sliding_image/301737a.jpg"
        : `https://cdn.grofers.com/app/images/products/sliding_image/${id}a.jpg`
    });
  }

  return products;
};

const seedDatabases = async () => {
  try {
    console.log("🌱 Parsing products from scratchpad...");
    const parsedProducts = parseScrapedProducts();
    console.log(`✅ Parsed ${parsedProducts.length} products.`);

    console.log("🌱 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected securely!");

    // SuperCategory: Grocery & Kitchen
    const superCat = await SuperCategory.findOne({ name: "Grocery & Kitchen" });
    if (!superCat) {
      throw new Error("SuperCategory 'Grocery & Kitchen' not found in database.");
    }
    const superCategoryId = superCat._id;

    // Category: Atta, Rice & Dal
    const category = await Category.findOne({ name: "Atta, Rice & Dal" });
    if (!category) {
      throw new Error("Category 'Atta, Rice & Dal' not found in database.");
    }

    // SubCategory: Rice (create new if not exists, as requested by user)
    let subCategory = await SubCategory.findOne({ name: "Rice", category: category._id });
    if (!subCategory) {
      subCategory = await SubCategory.create({
        name: "Rice",
        category: category._id
      });
      console.log("🆕 Created new SubCategory: Rice");
    }

    // Clear existing products in Rice subcategory to avoid duplicates on re-runs
    const delResult = await Product.deleteMany({ subCategory: subCategory._id });
    console.log(`🧹 Cleared ${delResult.deletedCount} existing products from Rice subcategory.`);

    const productsToInsert = parsedProducts.map(p => ({
      name: p.name,
      price: p.mrp,           // selling price is the MRP
      discountPrice: p.price, // discounted price
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
    console.log(`✅ Successfully seeded ${result.length} Rice products into Sabjab!`);

  } catch (err) {
    console.error("❌ Seeding Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from DB.");
    process.exit(0);
  }
};

seedDatabases();
