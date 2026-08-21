import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import Product from "./src/models/products.js";
import Category from "./src/models/category.js";
import SubCategory from "./src/models/subCategory.js";
import SuperCategory from "./src/models/superCategory.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://transitionclasse_db_user:devu1234@cluster0.7chsse0.mongodb.net/sabjab";
const SCRATCHPAD_PATH = "/Users/rajeevsharma/.gemini/antigravity-ide/brain/9ebb4352-e53d-4753-8623-ea275b7199fb/browser/scratchpad_dal.md";

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
      price = parseFloat(priceParts[0].replace("₹", "").replace(/,/g, "").trim());
      mrp = price;
    } else if (priceParts.length >= 2) {
      price = parseFloat(priceParts[0].replace("₹", "").replace(/,/g, "").trim());
      mrp = parseFloat(priceParts[1].replace("₹", "").replace(/\(.*\)/, "").replace(/,/g, "").trim());
    }

    // Determine packSize from product name
    let packSize = "1 kg";
    const sizeMatch = name.match(/(\d+(?:\.\d+)?\s*(?:kg|g|ltr|ml|pack))/i);
    if (sizeMatch) {
      packSize = sizeMatch[1].toLowerCase();
    } else {
      // Default: Most dal products are 1 kg
      packSize = "1 kg";
    }

    packSize = packSize.replace(/\s+/g, " ").trim();

    products.push({
      name,
      price,   // discounted selling price
      mrp,     // original MRP
      packSize,
      imageUrl: `https://cdn.grofers.com/app/images/products/sliding_image/${id}a.jpg`
    });
  }

  return products;
};

const seedDatabases = async () => {
  try {
    console.log("🌱 Parsing Dal products from scratchpad...");
    const parsedProducts = parseScrapedProducts();
    console.log(`✅ Parsed ${parsedProducts.length} products.`);

    if (parsedProducts.length === 0) {
      console.log("❌ No products parsed! Check the scratchpad file.");
      return;
    }

    // Print first 3 products for verification
    console.log("\n📋 Sample products:");
    parsedProducts.slice(0, 3).forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} | ₹${p.price} (MRP: ₹${p.mrp}) | ${p.packSize}`);
      console.log(`     Image: ${p.imageUrl}`);
    });

    console.log("\n🌱 Connecting to MongoDB...");
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

    // SubCategory: Dal (create new if not exists)
    let subCategory = await SubCategory.findOne({ name: "Dal", category: category._id });
    if (!subCategory) {
      subCategory = await SubCategory.create({
        name: "Dal",
        category: category._id
      });
      console.log("🆕 Created new SubCategory: Dal");
    }

    // Clear existing products in Dal subcategory to avoid duplicates on re-runs
    const delResult = await Product.deleteMany({ subCategory: subCategory._id });
    console.log(`🧹 Cleared ${delResult.deletedCount} existing products from Dal subcategory.`);

    const productsToInsert = parsedProducts.map(p => ({
      name: p.name,
      price: p.mrp,           // selling price is the MRP
      discountPrice: p.price,  // discounted price
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
    console.log(`\n✅ Successfully seeded ${result.length} Dal products into Sabjab!`);

  } catch (err) {
    console.error("❌ Seeding Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from DB.");
    process.exit(0);
  }
};

seedDatabases();
