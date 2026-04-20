// Load combined data (contains both floors)
const combinedNodesRaw = require("../data/floor1.nodes.json");
const combinedEdgesRaw = require("../data/floor1.edges.json");

// Separate nodes by floor
const floor1NodesRaw = combinedNodesRaw.filter(n => n.floor === 1);
const floor2NodesRaw = combinedNodesRaw.filter(n => n.floor === 2);

// Separate edges by floor (edges belong to a floor if both nodes are on that floor)
const floor1EdgesRaw = combinedEdgesRaw.filter(e => {
  const fromNode = combinedNodesRaw.find(n => n.node_id === e.from);
  const toNode = combinedNodesRaw.find(n => n.node_id === e.to);
  return fromNode && toNode && fromNode.floor === 1 && toNode.floor === 1;
});

const floor2EdgesRaw = combinedEdgesRaw.filter(e => {
  const fromNode = combinedNodesRaw.find(n => n.node_id === e.from);
  const toNode = combinedNodesRaw.find(n => n.node_id === e.to);
  return fromNode && toNode && fromNode.floor === 2 && toNode.floor === 2;
});

// Store ALL nodes and edges for cross-floor routing
const ALL_NODES = combinedNodesRaw;
const ALL_EDGES = combinedEdgesRaw;

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
  2: buildFloor({ floorNumber: 2, nodes: floor2NodesRaw, edges: floor2EdgesRaw }),
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

// Build unified graph for cross-floor routing
function buildUnifiedGraph() {
  const nodeById = new Map();
  const nodesNormalized = ALL_NODES.map((n) => {
    const normalized = {
      ...n,
      type: normalizeType(n.type),
    };
    nodeById.set(normalized.node_id, normalized);
    return normalized;
  });

  const edgesNormalized = ALL_EDGES.map((e) => ({
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
    nodes: nodesNormalized,
    edges: edgesNormalized,
    nodeById,
    adjacency,
  };
}

const UNIFIED_GRAPH = buildUnifiedGraph();

function getUnifiedGraph() {
  return UNIFIED_GRAPH;
}

module.exports = {
  normalizeType,
  listFloors,
  getFloor,
  getNode,
  getUnifiedGraph,
  ALL_NODES,
  ALL_EDGES,
};

