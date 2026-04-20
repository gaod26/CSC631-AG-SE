const express = require("express");
const { getNode, getUnifiedGraph } = require("../services/graphStore");
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

  // Use unified graph for cross-floor routing
  const unifiedGraph = getUnifiedGraph();

  const result = dijkstraShortestPath({
    adjacency: unifiedGraph.adjacency,
    start,
    goal: destination,
  });
  
  if (!result) {
    return res.status(404).json({
      detail: `No path found from ${start} to ${destination}`,
    });
  }

  // Separate path by floor
  const pathsByFloor = {};
  for (const nodeId of result.path) {
    const node = unifiedGraph.nodeById.get(nodeId);
    if (node) {
      const floorKey = String(node.floor);
      if (!pathsByFloor[floorKey]) {
        pathsByFloor[floorKey] = [];
      }
      pathsByFloor[floorKey].push(nodeId);
    }
  }

  const instructions = buildInstructionsForPath({
    path: result.path,
    nodeById: unifiedGraph.nodeById,
  });

  res.json({
    floors: pathsByFloor,
    instructions,
    total_distance: result.distance,
  });
});

module.exports = router;
