const express = require("express");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, db } = require("./auth");

const router = express.Router();

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ detail: "Authentication required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ detail: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}

/**
 * GET /history
 * Query params: limit, offset
 * Returns user's navigation history
 */
router.get("/", authenticateToken, (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  const userId = req.user.user_id;

  db.all(
    `SELECT origin, destination, distance, preference, estimated_seconds, timestamp
     FROM navigation_history
     WHERE user_id = ?
     ORDER BY timestamp DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset],
    (err, rows) => {
      if (err) {
        console.error("History fetch error:", err);
        return res.status(500).json({ detail: "Failed to fetch history" });
      }

      // Format response with estimated_time object
      const history = rows.map((row) => ({
        origin: row.origin,
        destination: row.destination,
        distance: row.distance,
        preference: row.preference,
        timestamp: row.timestamp,
        estimated_time: row.estimated_seconds
          ? {
              total_seconds: row.estimated_seconds,
              display: formatTime(row.estimated_seconds),
            }
          : null,
      }));

      res.json(history);
    }
  );
});

/**
 * Format seconds into human-readable time
 */
function formatTime(seconds) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return "Less than a minute";
  if (minutes === 1) return "About 1 minute";
  return `About ${minutes} minutes`;
}

// Function to save navigation history (exported for use in route.js)
function saveNavigationHistory(userId, origin, destination, distance, preference, estimatedSeconds) {
  db.run(
    `INSERT INTO navigation_history (user_id, origin, destination, distance, preference, estimated_seconds)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, origin, destination, distance, preference || "none", estimatedSeconds],
    (err) => {
      if (err) {
        console.error("Failed to save navigation history:", err);
      }
    }
  );
}

module.exports = router;
module.exports.saveNavigationHistory = saveNavigationHistory;
module.exports.authenticateToken = authenticateToken;
