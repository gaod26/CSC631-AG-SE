const floor1NodesRaw = require("../data/floor1.nodes.json");
const floor1EdgesRaw = require("../data/floor1.edges.json");

function normalizeType(type) {
  if (!type) return type;
  const t = String(type).trim().toLowerCase();
  if (t === "men's restroom" || t === "mens restroom" || t === "men restroom") {
    return "mens_restroom";
  }
  if (
    t === "women's restroom" ||
    t === "womens restroom" ||
    t === "women restroom"
  ) {
    return "womens_restroom";
  }
  return t.replace(/\s+/g, "_");
}

function buildFloor({ floorNumber, nodes, edges }) {
  const nodeById = new Map();
  const nodesNormalized = nodes.map((n) => {
    const normalized = {
      ...n,
      type: normalizeType(n.type),
    };
    nodeById.set(normalized.node_id, normalized);
    return normalized;
  });

  const edgesNormalized = edges.map((e) => ({
    from_node: e.from,
    to_node: e.to,
    distance: e.distance,
  }));

  const adjacency = new Map();
  const ensure = (id) => {
    if (!adjacency.has(id)) adjacency.set(id, []);
    return adjacency.get(id);
  };

  for (const e of edgesNormalized) {
    ensure(e.from_node).push({ to: e.to_node, weight: e.distance });
    ensure(e.to_node).push({ to: e.from_node, weight: e.distance });
  }

  return {
    floor: floorNumber,
    nodes: nodesNormalized,
    edges: edgesNormalized,
    nodeById,
    adjacency,
  };
}

const FLOOR_DATA = {
  1: buildFloor({ floorNumber: 1, nodes: floor1NodesRaw, edges: floor1EdgesRaw }),
};

function listFloors() {
  return Object.keys(FLOOR_DATA)
    .map((k) => Number(k))
    .sort((a, b) => a - b);
}

function getFloor(floorNumber) {
  const f = FLOOR_DATA[Number(floorNumber)];
  return f || null;
}

function getNode(nodeId) {
  for (const floorNum of listFloors()) {
    const floor = FLOOR_DATA[floorNum];
    const node = floor.nodeById.get(nodeId);
    if (node) return node;
  }
  return null;
}

module.exports = {
  normalizeType,
  listFloors,
  getFloor,
  getNode,
};

