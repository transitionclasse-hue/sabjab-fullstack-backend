/**
 * 🔐 One-Time Migration Script: Hash All Existing Plaintext Passwords
 * 
 * USAGE: node migrate_passwords.js
 * 
 * This script reads all Customer, DeliveryPartner, Admin, and Seller records
 * and hashes any passwords that are still stored in plaintext.
 * 
 * It detects already-hashed passwords (bcrypt hashes start with "$2b$") and skips them.
 * 
 * RUN THIS ONCE after deploying the bcrypt changes.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;
const MONGO_URI = process.env.MONGO_URI;

async function migrateCollection(collectionName) {
  const collection = mongoose.connection.db.collection(collectionName);
  const docs = await collection.find({ password: { $exists: true, $ne: null } }).toArray();

  let updated = 0;
  let skipped = 0;

  for (const doc of docs) {
    // Skip if already hashed (bcrypt hashes start with "$2b$" or "$2a$")
    if (doc.password && (doc.password.startsWith('$2b$') || doc.password.startsWith('$2a$'))) {
      skipped++;
      continue;
    }

    const hashed = await bcrypt.hash(doc.password, SALT_ROUNDS);
    await collection.updateOne({ _id: doc._id }, { $set: { password: hashed } });
    updated++;
  }

  console.log(`  ✅ ${collectionName}: ${updated} hashed, ${skipped} already hashed, ${docs.length} total`);
}

async function main() {
  console.log('🔐 Password Migration Script');
  console.log('============================');

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  const collections = ['customers', 'deliverypartners', 'admins', 'sellers'];

  for (const name of collections) {
    await migrateCollection(name);
  }

  console.log('\n🎉 Migration complete! All passwords are now bcrypt-hashed.');
  console.log('   You can safely delete this script.');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
