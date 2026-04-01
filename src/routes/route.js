const express = require("express");
const { getNode, getFloor } = require("../services/graphStore");
const { dijkstraShortestPath } = require("../services/dijkstra");
const { buildInstructionsForPath } = require("../services/instructions");

const router = express.Router();

/**
 * POST /route
 * Body: { start, destination, preference? }
 */
router.post("/", (req, res) => {
  const body = req.body || {};
  const start = body.start;
  const destination = body.destination;
  const preference = body.preference ?? "none";

  if (!start) {
    return res.status(400).json({ detail: "Missing required field: start" });
  }
  if (!destination) {
    return res
      .status(400)
      .json({ detail: "Missing required field: destination" });
  }

  const allowedPrefs = new Set(["none", "stairs", "elevator"]);
  if (!allowedPrefs.has(preference)) {
    return res.status(400).json({
      detail: "Invalid preference: must be one of none, stairs, elevator",
    });
  }

  const startNode = getNode(start);
  if (!startNode) {
    return res.status(404).json({ detail: `Node ${start} does not exist` });
  }
  const destNode = getNode(destination);
  if (!destNode) {
    return res
      .status(404)
      .json({ detail: `Node ${destination} does not exist` });
  }

  // Current scope: only same-floor routes (floor 1 data)
  if (startNode.floor !== destNode.floor) {
    return res.status(404).json({
      detail: "Cross-floor routing is not available yet (only floor 1 data loaded)",
    });
  }

  const floor = getFloor(startNode.floor);
  if (!floor) {
    return res.status(404).json({ detail: `Floor ${startNode.floor} has no data` });
  }

  const result = dijkstraShortestPath({
    adjacency: floor.adjacency,
    start,
    goal: destination,
  });
  if (!result) {
    return res.status(404).json({
      detail: `No path found from ${start} to ${destination}`,
    });
  }

  const instructions = buildInstructionsForPath({
    path: result.path,
    nodeById: floor.nodeById,
  });

  res.json({
    floors: {
      [String(startNode.floor)]: result.path,
    },
    instructions,
    total_distance: result.distance,
  });
});

module.exports = router;
