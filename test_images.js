import fs from 'fs';
import path from 'path';

// Let's read seed_face_cleaning.js and extract the scrapedProducts array
const filePath = './seed_face_cleaning.js';
const content = fs.readFileSync(filePath, 'utf-8');

// Use regex to find the scrapedProducts array
const match = content.match(/const scrapedProducts = (\[[\s\S]*?\]);/);
if (!match) {
  console.error("Could not find scrapedProducts array in seed_face_cleaning.js");
  process.exit(1);
}

const scrapedProducts = JSON.parse(match[1]);

console.log(`Found ${scrapedProducts.length} products to verify.`);

async function checkImage(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.status === 200;
  } catch (err) {
    return false;
  }
}

async function verifyAll() {
  const invalidProducts = [];
  for (const product of scrapedProducts) {
    const isValid = await checkImage(product.imageUrl);
    console.log(`- ${product.name}: ${isValid ? '✅ OK' : '❌ INVALID'} (${product.imageUrl})`);
    if (!isValid) {
      invalidProducts.push(product);
    }
  }
  
  console.log('\n--- VERIFICATION SUMMARY ---');
  console.log(`Total checked: ${scrapedProducts.length}`);
  console.log(`Valid: ${scrapedProducts.length - invalidProducts.length}`);
  console.log(`Invalid: ${invalidProducts.length}`);
  if (invalidProducts.length > 0) {
    console.log('Invalid products list:');
    invalidProducts.forEach(p => console.log(`  * ${p.name} -> ${p.imageUrl}`));
  }
}

verifyAll().catch(console.error);
