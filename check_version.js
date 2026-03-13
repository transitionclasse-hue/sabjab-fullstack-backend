import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const GlobalConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  description: String,
}, { timestamps: true });

const GlobalConfig = mongoose.models.GlobalConfig || mongoose.model('GlobalConfig', GlobalConfigSchema);

async function checkVersion() {
  try {
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    const config = await GlobalConfig.findOne({ key: 'app_version_config' }).lean();
    console.log('--- BACKEND APP VERSION CONFIG ---');
    console.log(JSON.stringify(config?.value, null, 2));
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ CHECK ERROR:', error.message);
  }
}

checkVersion();
