import { useState, useEffect, useRef } from 'react'
import { getNodeType, isEdgeInRoute } from '../../utils/graphUtils'
import FloorSwitcher from '../Controls/FloorSwitcher'
import FloorDiagram from './FloorDiagram'
import floor1Data from '../../data/floor1.json'
import nodePositions from '../../data/nodePositions.json'
import './FloorMap.css'

function FloorMap({ floor, onFloorChange, routeData, startLocation, destination, onNodeClick }) {
  const [positions] = useState(nodePositions)
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1700, height: 900 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const svgRef = useRef(null)

  const mapWidth = 1700
  const mapHeight = 900

  const handleMouseDown = (e) => {
    if (e.button === 0) { // Left click
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = (e) => {
    if (!isPanning) return

    const dx = (e.clientX - panStart.x) / zoom
    const dy = (e.clientY - panStart.y) / zoom

    setViewBox(vb => ({
      ...vb,
      x: vb.x - dx,
      y: vb.y - dy
    }))

    setPanStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.5, Math.min(3, zoom * delta))
    setZoom(newZoom)

    // Adjust viewBox to zoom towards mouse position
    const rect = svgRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const svgX = viewBox.x + (mouseX / rect.width) * viewBox.width
    const svgY = viewBox.y + (mouseY / rect.height) * viewBox.height

    const newWidth = mapWidth / newZoom
    const newHeight = mapHeight / newZoom

    setViewBox({
      x: svgX - (mouseX / rect.width) * newWidth,
      y: svgY - (mouseY / rect.height) * newHeight,
      width: newWidth,
      height: newHeight
    })
  }

  const handleNodeClick = (nodeId) => {
    if (onNodeClick) {
      onNodeClick(nodeId)
    }
  }

  const getNodeColor = (nodeId) => {
    if (nodeId === startLocation) return '#10b981' // Green for start
    if (nodeId === destination) return '#ef4444' // Red for destination
    
    const type = getNodeType(nodeId)
    const colorMap = {
      room: '#3b82f6',
      hallway: '#94a3b8',
      junction: '#8b5cf6',
      stairs: '#f59e0b',
      elevator: '#f59e0b',
      office: '#06b6d4',
      restroom: '#ec4899'
    }
    return colorMap[type] || '#6b7280'
  }

  const getNodeRadius = (nodeId) => {
    if (nodeId === startLocation || nodeId === destination) return 12
    
    const type = getNodeType(nodeId)
    if (type === 'stairs' || type === 'elevator') return 10
    if (type === 'junction') return 8
    if (type === 'hallway') return 6
    return 8
  }

  const routePath = routeData?.path || []

  return (
    <div className="floor-map-container">
      <FloorSwitcher
        currentFloor={floor}
        onFloorChange={onFloorChange}
        availableFloors={[1]}
        routeFloors={routeData?.floors || []}
      />

      <div className="map-controls">
        <button
          className="map-control-button"
          onClick={() => setZoom(z => Math.min(3, z * 1.2))}
          aria-label="Zoom in"
        >
          +
        </button>
        <span className="zoom-level">{Math.round(zoom * 100)}%</span>
        <button
          className="map-control-button"
          onClick={() => setZoom(z => Math.max(0.5, z / 1.2))}
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          className="map-control-button"
          onClick={() => {
            setZoom(1)
            setViewBox({ x: 0, y: 0, width: mapWidth, height: mapHeight })
          }}
          aria-label="Reset view"
        >
          ⟲
        </button>
      </div>

      <svg
        ref={svgRef}
        className={`floor-map ${isPanning ? 'panning' : ''}`}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#15803d" />
          </marker>
        </defs>

        {/* Floor Diagram Background */}
        <FloorDiagram />

        {/* Draw edges */}
        <g className="edges">
          {floor1Data.map((edge, index) => {
            const fromPos = positions[edge.from]
            const toPos = positions[edge.to]
            if (!fromPos || !toPos) return null

            const isInRoute = isEdgeInRoute(edge.from, edge.to, routePath)

            return (
              <line
                key={index}
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                stroke={isInRoute ? '#15803d' : '#cbd5e1'}
                strokeWidth={isInRoute ? 4 : 2}
                strokeOpacity={isInRoute ? 1 : 0.5}
                className={isInRoute ? 'route-edge' : ''}
              />
            )
          })}
        </g>

        {/* Draw nodes */}
        <g className="nodes">
          {Object.entries(positions).map(([nodeId, pos]) => (
            <g key={nodeId} className="node-group" transform={`translate(${pos.x}, ${pos.y})`}>
              <circle
                r={getNodeRadius(nodeId)}
                fill={getNodeColor(nodeId)}
                stroke="white"
                strokeWidth="2"
                className="node"
                onClick={() => handleNodeClick(nodeId)}
                style={{ cursor: 'pointer' }}
              />
              <text
                y="-15"
                textAnchor="middle"
                fontSize="11"
                fill="#1f2937"
                fontWeight="500"
                className="node-label"
                pointerEvents="none"
              >
                {nodeId}
              </text>
            </g>
          ))}
        </g>
      </svg>

      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#10b981' }}></div>
          <span>Start</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#ef4444' }}></div>
          <span>Destination</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#3b82f6' }}></div>
          <span>Room</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#f59e0b' }}></div>
          <span>Stairs/Elevator</span>
        </div>
      </div>
    </div>
  )
}

export default FloorMap
