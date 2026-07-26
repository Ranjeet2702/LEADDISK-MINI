// Run once: node scripts/seedAdmin.js
// Creates (or updates the password of) the single admin account from
// SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD in .env. This is how you avoid ever
// hardcoding a username/password in the app code itself.
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function run() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env first');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const passwordHash = await Admin.hashPassword(password);
  const admin = await Admin.findOneAndUpdate(
    { email: email.toLowerCase() },
    { email: email.toLowerCase(), passwordHash },
    { upsert: true, new: true }
  );

  console.log(`Admin ready: ${admin.email}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
