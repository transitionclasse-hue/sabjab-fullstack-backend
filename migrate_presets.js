import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import Category from './src/models/category.js';
import SubCategory from './src/models/subCategory.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mappingPath = path.join(__dirname, '../premium_icons_cloudinary.json');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not defined in the environment variables.");
  process.exit(1);
}

if (!fs.existsSync(mappingPath)) {
  console.error(`❌ Mappings file not found at: ${mappingPath}`);
  process.exit(1);
}

const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

function getCloudinaryUrl(presetStr) {
  if (!presetStr || typeof presetStr !== 'string' || !presetStr.startsWith('preset_')) {
    return presetStr;
  }
  const key = presetStr.replace('preset_', '');
  const lightKey = `${key}_light`;
  const darkKey = `${key}_dark`;

  if (mapping[lightKey]) return mapping[lightKey];
  if (mapping[key]) return mapping[key];
  if (mapping[darkKey]) return mapping[darkKey];

  // Try case-insensitive matching as fallback
  const lowerKey = key.toLowerCase();
  for (const mapKey of Object.keys(mapping)) {
    const mapKeyLower = mapKey.toLowerCase();
    if (mapKeyLower === `${lowerKey}_light` || mapKeyLower === lowerKey || mapKeyLower === `${lowerKey}_dark`) {
      return mapping[mapKey];
    }
  }

  return presetStr;
}

async function runMigration() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 1. Migrate Categories
    console.log("\nScanning Category collection...");
    const categories = await Category.find({});
    let categoryUpdates = 0;

    for (const doc of categories) {
      if (doc.image && doc.image.startsWith('preset_')) {
        const directUrl = getCloudinaryUrl(doc.image);
        if (directUrl !== doc.image) {
          console.log(`Updating Category "${doc.name}": ${doc.image} -> ${directUrl}`);
          doc.image = directUrl;
          await doc.save();
          categoryUpdates++;
        } else {
          console.warn(`⚠️ Warning: Preset mapping not found for category "${doc.name}" with value: ${doc.image}`);
        }
      }
    }
    console.log(`✅ Category migration complete. ${categoryUpdates} documents updated.`);

    // 2. Migrate SubCategories
    console.log("\nScanning SubCategory collection...");
    const subCategories = await SubCategory.find({});
    let subCategoryUpdates = 0;

    for (const doc of subCategories) {
      if (doc.image && doc.image.startsWith('preset_')) {
        const directUrl = getCloudinaryUrl(doc.image);
        if (directUrl !== doc.image) {
          console.log(`Updating SubCategory "${doc.name}": ${doc.image} -> ${directUrl}`);
          doc.image = directUrl;
          await doc.save();
          subCategoryUpdates++;
        } else {
          console.warn(`⚠️ Warning: Preset mapping not found for subcategory "${doc.name}" with value: ${doc.image}`);
        }
      }
    }
    console.log(`✅ SubCategory migration complete. ${subCategoryUpdates} documents updated.`);

  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 MongoDB Connection closed.");
  }
}

runMigration();
