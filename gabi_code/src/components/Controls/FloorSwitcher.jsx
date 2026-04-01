import './FloorSwitcher.css'

function FloorSwitcher({ currentFloor, onFloorChange, availableFloors = [1], routeFloors = [] }) {
  return (
    <div className="floor-switcher">
      <span className="floor-label">Floor:</span>
      <div className="floor-tabs">
        {availableFloors.map(floorNum => {
          const isActive = currentFloor === floorNum
          const isInRoute = routeFloors.includes(floorNum)
          
          return (
            <button
              key={floorNum}
              className={`floor-tab ${isActive ? 'active' : ''} ${isInRoute ? 'in-route' : ''}`}
              onClick={() => onFloorChange(floorNum)}
              disabled={isActive}
            >
              {floorNum}
              {isInRoute && <span className="route-indicator">●</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default FloorSwitcher
