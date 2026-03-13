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

async function updateVersion() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sabjab';
    await mongoose.connect(mongoUri);
    console.log('CONNECTED TO MONGODB');

    const result = await GlobalConfig.findOneAndUpdate(
      { key: 'app_version_config' },
      {
        $set: {
          value: {
            currentVersion: "1.0.1",
            updateAvailable: false,
            updateMessage: "",
            isMandatory: false
          }
        }
      },
      { upsert: true, new: true }
    );

    console.log('✅ Updated app_version_config:', result.value);
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ UPDATE ERROR:', error);
    process.exit(1);
  }
}

updateVersion();
