const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const router = express.Router();

// JWT secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

// Initialize SQLite database
const dbPath = path.join(__dirname, "..", "data", "users.db");
const db = new sqlite3.Database(dbPath);

// Create users table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create history table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS navigation_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    distance REAL NOT NULL,
    preference TEXT,
    estimated_seconds INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

/**
 * POST /auth/register
 * Body: { username, password }
 */
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ detail: "Username and password are required" });
  }

  if (username.length < 3) {
    return res.status(400).json({ detail: "Username must be at least 3 characters" });
  }

  if (password.length < 6) {
    return res.status(400).json({ detail: "Password must be at least 6 characters" });
  }

  try {
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    db.run(
      "INSERT INTO users (username, password_hash) VALUES (?, ?)",
      [username, password_hash],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE")) {
            return res.status(400).json({ detail: "Username already exists" });
          }
          console.error("Registration error:", err);
          return res.status(500).json({ detail: "Registration failed" });
        }

        // Generate JWT token
        const token = jwt.sign(
          { user_id: this.lastID, username },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({
          access_token: token,
          username,
        });
      }
    );
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ detail: "Registration failed" });
  }
});

/**
 * POST /auth/login
 * Body: { username, password }
 */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ detail: "Username and password are required" });
  }

  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (err) {
      console.error("Login error:", err);
      return res.status(500).json({ detail: "Login failed" });
    }

    if (!user) {
      return res.status(401).json({ detail: "Invalid username or password" });
    }

    try {
      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        return res.status(401).json({ detail: "Invalid username or password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { user_id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        access_token: token,
        username: user.username,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ detail: "Login failed" });
    }
  });
});

module.exports = router;
module.exports.JWT_SECRET = JWT_SECRET;
module.exports.db = db;
