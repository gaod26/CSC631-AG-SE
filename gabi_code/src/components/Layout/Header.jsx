import './Header.css'

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-branding">
          <h1 className="header-title">Kirby-Manchester Navigation</h1>
          <p className="header-subtitle">Indoor Navigation System</p>
        </div>
        <div className="header-info">
          <span className="header-badge">Wake Forest University</span>
        </div>
      </div>
    </header>
  )
}

export default Header
