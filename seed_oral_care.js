import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./src/models/products.js";
import Category from "./src/models/category.js";
import SubCategory from "./src/models/subCategory.js";
import SuperCategory from "./src/models/superCategory.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://transitionclasse_db_user:devu1234@cluster0.7chsse0.mongodb.net/sabjab";

const scrapedProducts = [
  {
    "name": "Oral-B Pro Clean Sensitive & Gums Toothbrush Extra Soft, Colour may Vary",
    "price": 50,
    "mrp": 50,
    "packSize": "1 pc",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_526484.jpg"
  },
  {
    "name": "Colgate Strong Teeth Anticavity Toothpaste (150 g)",
    "price": 103,
    "mrp": 103,
    "packSize": "150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_19192.jpg"
  },
  {
    "name": "Colgate Visible White Purple Whitening Toothpaste",
    "price": 99,
    "mrp": 110,
    "packSize": "75 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_764789.jpg"
  },
  {
    "name": "Patanjali Dant Kanti Herbal Toothpaste",
    "price": 106,
    "mrp": 106,
    "packSize": "200 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_10656.jpg"
  },
  {
    "name": "Colgate Total Advanced Health Toothpaste",
    "price": 80,
    "mrp": 80,
    "packSize": "80 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_566542.jpg"
  },
  {
    "name": "Sensodyne Sensitive Toothbrush With Soft Bristles",
    "price": 59,
    "mrp": 65,
    "packSize": "1 pc",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_505516.jpg"
  },
  {
    "name": "Sensodyne Deep Clean Sensitive Toothpaste",
    "price": 116,
    "mrp": 145,
    "packSize": "70 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_366189.jpg"
  },
  {
    "name": "Closeup Everfresh+ Gel Toothpaste (Red Hot)",
    "price": 117,
    "mrp": 129,
    "packSize": "150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_19570.jpg"
  },
  {
    "name": "Sensodyne Sensitive Toothbrush With Soft Rounded Bristles - Buy 2 Get 1 Free",
    "price": 104,
    "mrp": 130,
    "packSize": "3 pcs",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_23704.jpg"
  },
  {
    "name": "Dabur Red Herbal Toothpaste 200 g",
    "price": 125,
    "mrp": 135,
    "packSize": "200 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_972.jpg"
  },
  {
    "name": "Oral-B Kids Toothbrush (Colour may Vary)",
    "price": 50,
    "mrp": 50,
    "packSize": "3 pcs",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_443628.jpg"
  },
  {
    "name": "Oral-B Sensitive Care Toothbrush Extra Soft",
    "price": 108,
    "mrp": 120,
    "packSize": "5 pcs",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_443627.jpg"
  },
  {
    "name": "Colgate MaxFresh Peppermint Ice Gel Toothpaste",
    "price": 136,
    "mrp": 160,
    "packSize": "150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_21886.jpg"
  },
  {
    "name": "Colgate MaxFresh Spicy Fresh Gel Toothpaste",
    "price": 122,
    "mrp": 138,
    "packSize": "150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_23816.jpg"
  },
  {
    "name": "Colgate Gentle Sensitive Soft Bristles Toothbrush",
    "price": 59,
    "mrp": 65,
    "packSize": "1 pc",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_276959.jpg"
  },
  {
    "name": "Patanjali Dant Kanti Natural Herbal Toothpaste (500 g)",
    "price": 208,
    "mrp": 239,
    "packSize": "500 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_528042.jpg"
  },
  {
    "name": "Oral-B Cavity Defense Bacterial Fighter Toothbrush Soft - Pack of 6",
    "price": 123,
    "mrp": 130,
    "packSize": "6 pcs",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_401914.jpg"
  },
  {
    "name": "Colgate Strong Teeth Anticavity Toothpaste (500 g)",
    "price": 228,
    "mrp": 325,
    "packSize": "2 x 250 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_19184.jpg"
  },
  {
    "name": "Perfora Purple Magic Whitening Toothpaste",
    "price": 186,
    "mrp": 199,
    "packSize": "75 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_633673.jpg"
  },
  {
    "name": "Perfora Super Soft Toothbrush OG Black",
    "price": 90,
    "mrp": 99,
    "packSize": "1 pc",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_554630.jpg"
  },
  {
    "name": "Closeup Everfresh+ Anti-Germ Red Hot Gel Toothpaste",
    "price": 203,
    "mrp": 260,
    "packSize": "2 x 150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_367009.jpg"
  },
  {
    "name": "Dabur Red Gel Toothpaste for effective Oral Care",
    "price": 122,
    "mrp": 246,
    "packSize": "2 x 150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_400929.jpg"
  },
  {
    "name": "Colgate MaxFresh Peppermint Ice Gel Toothpaste - Saver Pack",
    "price": 193,
    "mrp": 299,
    "packSize": "2 x 150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_490674.jpg"
  },
  {
    "name": "Colgate PerioGard Gum Expert Toothbrush",
    "price": 133,
    "mrp": 156,
    "packSize": "1 pc",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_623667.jpg"
  },
  {
    "name": "Colgate Visible White Purple Whitening Toothpaste",
    "price": 229,
    "mrp": 395,
    "packSize": "2 x 120 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_587171.jpg"
  },
  {
    "name": "Listerine Cool Mint Mouthwash (250 ml)",
    "price": 209,
    "mrp": 220,
    "packSize": "250 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_963.jpg"
  },
  {
    "name": "Oral-B Cavity Defense Toothbrush with Charcoal Extract",
    "price": 105,
    "mrp": 105,
    "packSize": "4 pcs",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_587180.jpg"
  },
  {
    "name": "Perfora Dream White - Whitening Toothpaste",
    "price": 132,
    "mrp": 141,
    "packSize": "75 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_497529.jpg"
  },
  {
    "name": "Closeup White Now Stain Eraser Whitening Toothpaste",
    "price": 145,
    "mrp": 170,
    "packSize": "100 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_618263.jpg"
  },
  {
    "name": "Colgate Gentle UltraFoam Bristles Toothbrush Ultra Soft",
    "price": 197,
    "mrp": 280,
    "packSize": "2 pcs",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_523328.jpg"
  }
];

const seedDatabases = async () => {
    try {
        console.log("🌱 Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected securely!");

        // Find SuperCategory "Beauty & Personal Care"
        let superCat = await SuperCategory.findOne({ name: { $regex: /Beauty/i } });
        let superCategoryId = superCat ? superCat._id : null;

        // 1. Create a dedicated Category named "Oral Care"
        let category = await Category.findOne({ name: "Oral Care" });
        if (!category) {
             category = await Category.create({
                 name: "Oral Care",
                 image: "https://cdn.grofers.com/app/images/products/full_screen/pro_19192.jpg",
                 superCategory: superCategoryId
             });
             console.log("🆕 Created new Category: Oral Care");
        }

        // 2. Create a SubCategory
        let subCategory = await SubCategory.findOne({ name: "All Oral Care", category: category._id });
        if (!subCategory) {
             subCategory = await SubCategory.create({
                 name: "All Oral Care",
                 category: category._id
             });
             console.log("🆕 Created new SubCategory: All Oral Care");
        }

        // 3. Delete previously seeded products to avoid duplicates
        const productNames = scrapedProducts.map(p => p.name);
        const delResult = await Product.deleteMany({ name: { $in: productNames }, userStockLimit: 1, stock: 2 });
        console.log(`🧹 Cleared ${delResult.deletedCount} previously seeded oral care products.`);

        const productsToInsert = scrapedProducts.map(p => ({
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
        console.log(`✅ Successfully seeded ${result.length} oral care products!`);

    } catch (err) {
        console.error("❌ Seeding Error:", err);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from DB.");
        process.exit(0);
    }
};

seedDatabases();
