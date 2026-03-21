const express = require("express");
const { getNode, getFloor } = require("../services/graphStore");
const {
  dijkstraAllDistances,
  reconstructPath,
} = require("../services/dijkstra");
const { buildInstructionsForPath } = require("../services/instructions");

const router = express.Router();

const ALLOWED_TYPES = new Set([
  "stairs",
  "elevator",
  "mens_restroom",
  "womens_restroom",
]);

/**
 * GET /nearest?from_node={id}&type={type}
 */
router.get("/", (req, res) => {
  const fromNodeId = req.query.from_node;
  const type = req.query.type;

  if (!fromNodeId) {
    return res
      .status(400)
      .json({ detail: "Missing required parameter: from_node" });
  }
  if (!type) {
    return res.status(400).json({ detail: "Missing required parameter: type" });
  }

  const t = String(type).trim().toLowerCase();
  if (!ALLOWED_TYPES.has(t)) {
    return res.status(400).json({
      detail:
        "Invalid type: must be one of stairs, elevator, mens_restroom, womens_restroom",
    });
  }

  const fromNode = getNode(String(fromNodeId));
  if (!fromNode) {
    return res
      .status(404)
      .json({ detail: `Node ${String(fromNodeId)} does not exist` });
  }

  const floor = getFloor(fromNode.floor);
  if (!floor) {
    return res
      .status(404)
      .json({ detail: `Floor ${fromNode.floor} has no data` });
  }

  const candidates = floor.nodes.filter((n) => n.type === t);
  if (candidates.length === 0) {
    return res
      .status(404)
      .json({ detail: `No facilities of type ${t} found` });
  }

  const { dist, prev } = dijkstraAllDistances({
    adjacency: floor.adjacency,
    start: fromNode.node_id,
  });

  let best = null;
  for (const c of candidates) {
    const d = dist.get(c.node_id);
    if (d === undefined) continue;
    if (!best || d < best.total_distance) {
      best = { node: c, total_distance: d };
    }
  }

  if (!best) {
    return res
      .status(404)
      .json({ detail: `No facilities of type ${t} found` });
  }

  const path = reconstructPath({
    prev,
    start: fromNode.node_id,
    goal: best.node.node_id,
  });
  if (!path) {
    return res
      .status(404)
      .json({ detail: `No facilities of type ${t} found` });
  }

  const instructions = buildInstructionsForPath({
    path,
    nodeById: floor.nodeById,
  });

  res.json({
    target_node: best.node.node_id,
    target_label: best.node.label,
    total_distance: best.total_distance,
    floors: {
      [String(fromNode.floor)]: path,
    },
    instructions,
  });
});

module.exports = router;

