import mongoose from "mongoose";
import dotenv from "dotenv";
import SuperCategory from "./src/models/superCategory.js";
import Category from "./src/models/category.js";
import SubCategory from "./src/models/subCategory.js";
import Product from "./src/models/products.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/sabjab";

async function seedStudyTable() {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected to database.");

        // 1. Create SuperCategory: Study Table
        let studyTableSuper = await SuperCategory.findOne({ name: "Study Table" });
        if (!studyTableSuper) {
            studyTableSuper = await SuperCategory.create({ name: "Study Table", order: 7 });
            console.log("Created SuperCategory: Study Table");
        }

        const studyTableId = studyTableSuper._id;

        // 2. Define Category Structure with user's specific naming
        const categoriesData = [
            {
                name: "Study Books",
                subCategories: ["NCERT Textbooks", "Reference Guides", "Competitive Books"],
                products: [
                    { name: "Mathematics - Class 10", price: 160, quantity: "1 Book", desc: "Original NCERT textbook." },
                    { name: "RD Sharma - Class 10 Math", price: 540, quantity: "1 Book", desc: "Advanced practice for class 10." },
                    { name: "Errorless Physics - JEE", price: 850, quantity: "Set of 2", desc: "Best-selling physics book for JEE aspirants." }
                ]
            },
            {
                name: "Rough Registers",
                subCategories: ["Spiralbound", "Hardbound", "Premium Practice"],
                products: [
                    { name: "300 Pages Spiral Register", price: 110, quantity: "1 Unit", desc: "Smooth white 70 GSM sheets." },
                    { name: "Soft Rough Register Pack of 3", price: 150, quantity: "3 Units", desc: "Daily use budget notebooks." },
                    { name: "SabJab Premium Notebook", price: 85, quantity: "1 Unit", desc: "High quality premium paper for students." }
                ]
            },
            {
                name: "Solved PYQs and Papers",
                subCategories: ["Board Exam Solved", "Entrance Exam PYQs", "Model Test Papers"],
                products: [
                    { name: "10 Year Solved Paper - 10th", price: 250, quantity: "1 Book", desc: "Last 10 year board exam papers with answers." },
                    { name: "JEE Mains 5 Yr PYQ Collection", price: 399, quantity: "1 Book", desc: "Topic-wise solved questions from previous JEE exams." },
                    { name: "NEET Biology 15 Yr PYQ", price: 420, quantity: "1 Book", desc: "Comprehensive collection for medical aspirants." }
                ]
            },
            {
                name: "Class Notes",
                subCategories: ["Handwritten Physics", "Organic Chemistry", "Math Shortcuts"],
                products: [
                    { name: "Topper Notes: Physics 12th", price: 199, quantity: "PDF + Print", desc: "Clean, handwritten notes for class 12 physics." },
                    { name: "Organic Chemistry Master Notes", price: 249, quantity: "1 Book", desc: "Simplified diagrams and reactions for JEE/NEET." }
                ]
            }
        ];

        // 3. Populate
        for (const catData of categoriesData) {
            let cat = await Category.findOne({ name: catData.name, superCategory: studyTableId });
            if (!cat) {
                cat = await Category.create({
                    name: catData.name,
                    superCategory: studyTableId,
                    image: "https://res.cloudinary.com/dponzgerb/image/upload/v1740845000/brain/study_cat.png"
                });
                console.log(`Created Category: ${catData.name}`);
            }

            const catId = cat._id;

            // SubCategories
            for (const subName of catData.subCategories) {
                let sub = await SubCategory.findOne({ name: subName, category: catId });
                if (!sub) {
                    await SubCategory.create({
                        name: subName,
                        category: catId,
                        image: "https://res.cloudinary.com/dponzgerb/image/upload/v1740845000/brain/study_subcat.png"
                    });
                    console.log(`  - Created SubCategory: ${subName}`);
                }
            }

            // Products
            for (const prodData of catData.products) {
                let prod = await Product.findOne({ name: prodData.name, category: catId });
                if (!prod) {
                    await Product.create({
                        name: prodData.name,
                        description: prodData.desc,
                        price: prodData.price,
                        discountPrice: Math.floor(prodData.price * 0.9),
                        quantity: prodData.quantity,
                        category: catId,
                        superCategory: studyTableId,
                        image: "https://res.cloudinary.com/dponzgerb/image/upload/v1740845000/brain/study_product.png",
                        stock: 50,
                        isAvailable: true
                    });
                    console.log(`    * Created Product: ${prodData.name}`);
                }
            }
        }

        console.log("Seeding success! Your Study Table backend is ready.");
        process.exit(0);

    } catch (err) {
        console.error("Seeding error:", err);
        process.exit(1);
    }
}

seedStudyTable();
