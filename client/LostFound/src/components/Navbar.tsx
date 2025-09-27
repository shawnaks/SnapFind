import { Link, NavLink } from 'react-router-dom'
import '../scss/Navbar.scss'

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__logo-wrap">
        <img className="navbar__logo-img" src="/vite.svg" alt="Logo" />
        <Link to="/home" className="navbar__logo-text">Lost&Found</Link>
      </div>
      <nav className="navbar__nav navbar__nav--right">
        <NavLink to="/post-lost" className="navbar__nav-link">Post lost</NavLink>
        <NavLink to="/post-found" className="navbar__nav-link">Post found</NavLink>
        <NavLink to="/profile" className="navbar__nav-link">Profile</NavLink>
        <button className="navbar__nav-logout" type="button">Log out</button>
      </nav>
    </header>
  )
}
