import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const productSchema = new mongoose.Schema({
  name: String,
  image: String,
  images: [String],
  variations: [{
    name: String,
    image: String
  }]
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const products = await Product.find().sort({ createdAt: -1 }).limit(3);
    
    products.forEach(p => {
      console.log('---');
      console.log('ID:', p._id);
      console.log('Name:', p.name);
      console.log('Primary Image:', p.image);
      console.log('Gallery Images:', JSON.stringify(p.images));
      console.log('Variations:', p.variations.map(v => ({ name: v.name, image: v.image })));
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
