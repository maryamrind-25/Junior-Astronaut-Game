const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI || '';
let client = null;
let db = null;
let mongoReady = false;

async function connectDB() {
  if (!uri || uri.includes('MY_MONGO')) {
    console.warn('[Backend] MONGO_URI not set — running with local JSON persistence fallback.');
    return;
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('lunar_game');
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri, { dbName: 'lunar_game' });
    }
    mongoReady = true;
    console.log('Connected to MongoDB Atlas successfully!');
  } catch (err) {
    console.warn('MongoDB connection skipped, using local JSON fallback:', err.message);
    db = null;
    mongoReady = false;
  }
}

connectDB();

function getDB() {
  return db;
}

function isDBConnected() {
  return Boolean(db && mongoReady);
}

module.exports = { getDB, isDBConnected };