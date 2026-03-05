
import mongoose from 'mongoose';
import HomeComponent from './src/models/homeComponent.js';
import Product from './src/models/products.js';
import Category from './src/models/category.js';
import SubCategory from './src/models/subCategory.js';

async function run() {
    await mongoose.connect('mongodb+srv://transitionclasse_db_user:devu1234@cluster0.7chsse0.mongodb.net/sabjab12?retryWrites=true&w=majority&appName=Cluster00');

    const comps = await HomeComponent.find({ type: 'CATEGORY_GRID_FOUR_IMAGES' }).lean();
    console.log('--- CATEGORY_GRID_FOUR_IMAGES Components ---');
    for (const comp of comps) {
        console.log(`Title: ${comp.title}`);
        console.log(`Categories (IDs): ${JSON.stringify(comp.categories)}`);

        for (const catId of comp.categories) {
            const sub = await SubCategory.findById(catId).lean();
            const cat = await Category.findById(catId).lean();

            console.log(`  ID: ${catId}`);
            console.log(`    Is SubCategory? ${!!sub} (${sub?.name})`);
            console.log(`    Is Category? ${!!cat} (${cat?.name})`);

            const prodCount = await Product.countDocuments({
                $or: [{ category: catId }, { subCategory: catId }],
                isAvailable: true
            });
            console.log(`    Product Count (Available): ${prodCount}`);

            if (prodCount > 0) {
                const sample = await Product.findOne({
                    $or: [{ category: catId }, { subCategory: catId }],
                    isAvailable: true
                }).select('image').lean();
                console.log(`    Sample Image: ${sample?.image}`);
            }
        }
    }

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
