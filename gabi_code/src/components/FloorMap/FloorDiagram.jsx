// Floor diagram using the actual image as background
function FloorDiagram({ floor = 1 }) {
  // Use the same floor plan image for both floors since they have the same layout
  return (
    <g className="floor-diagram">
      {/* Use the actual floor plan image as background */}
      <image
        href="/images/floor-plan.png"
        x="0"
        y="0"
        width="1700"
        height="900"
        preserveAspectRatio="none"
      />
    </g>
  )
}

export default FloorDiagram
