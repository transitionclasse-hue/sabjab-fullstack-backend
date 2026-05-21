import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const iconsDir = path.join(__dirname, '../sabjab-Manager/assets/premium-icons');
const outputJson = path.join(__dirname, '../premium_icons_cloudinary.json');

async function uploadIcons() {
  try {
    if (!fs.existsSync(iconsDir)) {
      console.error(`Icons directory does not exist: ${iconsDir}`);
      process.exit(1);
    }
    const files = fs.readdirSync(iconsDir).filter(f => f.endsWith('.png'));
    console.log(`Found ${files.length} premium icons to upload.`);
    const mapping = {};

    for (const file of files) {
      const filePath = path.join(iconsDir, file);
      const publicId = path.parse(file).name;
      console.log(`Uploading ${file} to Cloudinary...`);
      
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'premium-icons',
        public_id: publicId,
        overwrite: true,
        resource_type: 'image'
      });
      
      mapping[publicId] = result.secure_url;
      console.log(`Uploaded ${file} -> ${result.secure_url}`);
    }

    fs.writeFileSync(outputJson, JSON.stringify(mapping, null, 2));
    console.log(`All icons uploaded successfully! Mapping saved to ${outputJson}`);
  } catch (error) {
    console.error('Error uploading icons:', error);
  }
}

uploadIcons();
