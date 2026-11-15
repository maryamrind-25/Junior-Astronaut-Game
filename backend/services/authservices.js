const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { getDB } = require("../db");

const FALLBACK_STORE_PATH = path.join(__dirname, "../.data/users_store.json");
const memoryFallback = { users: {} };

function readLocalUsers() {
  try {
    if (fs.existsSync(FALLBACK_STORE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(FALLBACK_STORE_PATH, "utf8"));
      if (parsed && typeof parsed.users === "object") {
        return parsed;
      }
    }
  } catch {
    // fallback to memory
  }
  return memoryFallback;
}

function writeLocalUsers(store) {
  memoryFallback.users = store.users;
  try {
    fs.mkdirSync(path.dirname(FALLBACK_STORE_PATH), { recursive: true });
    fs.writeFileSync(FALLBACK_STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch {
    // non-fatal on read-only fs
  }
}

function generateToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET || "astrotrainer-key",
    { expiresIn: "30d" }
  );
}

// Register a new astronaut user
async function registerUser(username, password) {
  const db = getDB();
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  if (db) {
    const usersCollection = db.collection("users");
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      throw new Error("User already exists");
    }
    const result = await usersCollection.insertOne({
      username,
      password: hashedPassword,
      createdAt: new Date(),
    });
    const token = generateToken({ _id: result.insertedId, username });
    return {
      success: true,
      message: "Signup successful",
      userId: result.insertedId,
      username,
      token,
    };
  }

  const store = readLocalUsers();
  if (store.users[username]) {
    throw new Error("User already exists");
  }
  const userId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  store.users[username] = {
    _id: userId,
    username,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
    progress: null,
  };
  writeLocalUsers(store);

  const token = generateToken({ _id: userId, username });
  return {
    success: true,
    message: "Signup successful",
    userId,
    username,
    token,
  };
}

// Authenticate an existing astronaut user
async function loginUser(username, password) {
  const db = getDB();

  if (db) {
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({ username });
    if (!user) {
      throw new Error("Invalid username or password");
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid username or password");
    }
    const token = generateToken(user);
    return {
      success: true,
      message: "Login successful",
      userId: user._id,
      username: user.username,
      token,
    };
  }

  const store = readLocalUsers();
  const user = store.users[username];
  if (!user) {
    throw new Error("Invalid username or password");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid username or password");
  }
  const token = generateToken(user);
  return {
    success: true,
    message: "Login successful",
    userId: user._id,
    username: user.username,
    token,
  };
}

// Save and load cadet mission progress (Levels 1-3 checkpoints)
async function saveUserProgress(username, progress) {
  if (!username || !progress) return { ok: false };
  const db = getDB();

  if (db) {
    const progressCollection = db.collection("progress");
    await progressCollection.updateOne(
      { username },
      { $set: { username, progress, updatedAt: new Date() } },
      { upsert: true }
    );
    return { ok: true, storage: "mongodb" };
  }

  const store = readLocalUsers();
  if (!store.users[username]) {
    store.users[username] = {
      _id: `local_${username}`,
      username,
      password: "",
      createdAt: new Date().toISOString(),
      progress,
    };
  } else {
    store.users[username].progress = progress;
  }
  store.users[username].updatedAt = new Date().toISOString();
  writeLocalUsers(store);
  return { ok: true, storage: "local" };
}

async function getUserProgress(username) {
  if (!username) return null;
  const db = getDB();

  if (db) {
    const progressCollection = db.collection("progress");
    const doc = await progressCollection.findOne({ username });
    return doc?.progress || null;
  }

  const store = readLocalUsers();
  return store.users[username]?.progress || null;
}

module.exports = {
  registerUser,
  loginUser,
  saveUserProgress,
  getUserProgress,
};