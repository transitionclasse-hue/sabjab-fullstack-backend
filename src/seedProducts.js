
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env vars from Backend/.env
dotenv.config({ path: '/Users/rajeevsharma/Desktop/Sabjab-full-stack/Backend/.env' });

const MONGO_URI = process.env.MONGO_URI;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Import Models
import SuperCategory from '/Users/rajeevsharma/Desktop/Sabjab-full-stack/Backend/src/models/superCategory.js';
import Category from '/Users/rajeevsharma/Desktop/Sabjab-full-stack/Backend/src/models/category.js';
import SubCategory from '/Users/rajeevsharma/Desktop/Sabjab-full-stack/Backend/src/models/subCategory.js';
import Product from '/Users/rajeevsharma/Desktop/Sabjab-full-stack/Backend/src/models/products.js';

const productsData = [
  {
    name: "Bikaji Tana Bana Khatta Meetha",
    quantity: "1 kg",
    mrp: 380,
    price: 418, // 10% increase
    imagePath: "/Users/rajeevsharma/.gemini/antigravity/brain/4455749b-61a3-4d7d-a79e-76b58d6c01b7/bikaji_tana_bana_1kg_1777742243334.png",
    description: "Traditional Indian sweet and sour snack mixture made with gram flour, lentils, and peanuts."
  },
  {
    name: "Bingo Chilli Lemon Flavour Nachos",
    quantity: "80 g",
    mrp: 50,
    price: 55, // 10% increase
    imagePath: "/Users/rajeevsharma/.gemini/antigravity/brain/4455749b-61a3-4d7d-a79e-76b58d6c01b7/bingo_nachos_80g_1777742258088.png",
    description: "Crunchy corn nachos with a tangy chilli lemon flavour. Perfect for snacking."
  },
  {
    name: "Snactac Roasted Chana",
    quantity: "500 g",
    mrp: 135,
    price: 149, // ~10% increase
    imagePath: "/Users/rajeevsharma/.gemini/antigravity/brain/4455749b-61a3-4d7d-a79e-76b58d6c01b7/snactac_roasted_chana_500g_1777742272352.png",
    description: "Healthy and crunchy roasted chickpeas. High in protein and zero cholesterol."
  },
  {
    name: "Taali Tomato Basil Protein Puffs",
    quantity: "60 g",
    mrp: 59,
    price: 65, // ~10% increase
    imagePath: "/Users/rajeevsharma/.gemini/antigravity/brain/4455749b-61a3-4d7d-a79e-76b58d6c01b7/taali_protein_puffs_60g_1777742287202.png",
    description: "Roasted protein puffs with tomato basil flavor. Gluten-free and non-fried."
  },
  {
    name: "Chheda's Yellow Banana Chips",
    quantity: "170 g",
    mrp: 100,
    price: 110, // 10% increase
    imagePath: "/Users/rajeevsharma/.gemini/antigravity/brain/4455749b-61a3-4d7d-a79e-76b58d6c01b7/chheda_banana_chips_170g_1777742307692.png",
    description: "Crispy yellow banana chips seasoned with rock salt. Traditional Indian snacks."
  }
];

async function seed() {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected.");

    // 1. Handle SuperCategory
    let superCat = await SuperCategory.findOne({ name: "Grocery & Kitchen" });
    if (!superCat) {
      console.log("Creating SuperCategory: Grocery & Kitchen");
      superCat = await SuperCategory.create({ name: "Grocery & Kitchen", order: 1 });
    }

    // 2. Handle Category
    let cat = await Category.findOne({ name: "Bakery & Biscuits", superCategory: superCat._id });
    if (!cat) {
      console.log("Creating Category: Bakery & Biscuits");
      cat = await Category.create({ 
        name: "Bakery & Biscuits", 
        superCategory: superCat._id,
        image: "https://res.cloudinary.com/dkihsmzv8/image/upload/v1714400000/bakery_default.png" // Placeholder
      });
    }

    // 3. Handle SubCategory
    let subCat = await SubCategory.findOne({ name: "Salty & Marie Biscuits", category: cat._id });
    if (!subCat) {
      console.log("Creating SubCategory: Salty & Marie Biscuits");
      subCat = await SubCategory.create({ name: "Salty & Marie Biscuits", category: cat._id });
    }

    // 4. Inject Products
    for (const p of productsData) {
      console.log(`Processing product: ${p.name}`);
      
      // Check if product already exists
      let existingProduct = await Product.findOne({ name: p.name, quantity: p.quantity });
      if (existingProduct) {
        console.log(`Product ${p.name} already exists. Updating price and image.`);
        // Update instead of skip to ensure price increase is applied
        const uploadResult = await cloudinary.uploader.upload(p.imagePath, {
          folder: "sabjab_admin",
          public_id: `product_${Date.now()}_${p.name.replace(/\s+/g, '_').toLowerCase()}`
        });
        
        existingProduct.price = p.price;
        existingProduct.costPrice = p.mrp;
        existingProduct.image = uploadResult.secure_url;
        await existingProduct.save();
        continue;
      }

      // Upload image to Cloudinary
      console.log(`Uploading image for ${p.name}...`);
      const uploadResult = await cloudinary.uploader.upload(p.imagePath, {
        folder: "sabjab_admin",
        public_id: `product_${Date.now()}_${p.name.replace(/\s+/g, '_').toLowerCase()}`
      });

      console.log(`Creating product ${p.name}...`);
      await Product.create({
        name: p.name,
        description: p.description,
        price: p.price,
        costPrice: p.mrp,
        quantity: p.quantity,
        category: cat._id,
        subCategory: subCat._id,
        superCategory: superCat._id,
        image: uploadResult.secure_url,
        stock: 50,
        isAvailable: true,
        isApproved: true
      });
      console.log(`Product ${p.name} injected successfully.`);
    }

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
