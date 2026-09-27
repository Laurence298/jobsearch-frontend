import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/profiles" className="brand">
          <span className="brand__mark">JT</span>
          <span>JobTracker</span>
        </NavLink>
        <nav className="topbar__nav">
          <NavLink
            to="/profiles"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Profiles
          </NavLink>
          <NavLink
            to="/admin"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Admin
          </NavLink>
        </nav>
        <div className="topbar__user">
          <span className="topbar__email">{user?.email}</span>
          <button type="button" className="btn btn--ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
