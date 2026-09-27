import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import NotificationsBell from './NotificationsBell.jsx'

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/profiles" className="brand">
          <span className="brand__mark">JT</span>
          <span>JobTracker</span>
        </NavLink>

        <nav className="sidebar__nav">
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

        <div className="sidebar__foot">
          <NotificationsBell />
          <div className="sidebar__user">
            <span className="sidebar__email">{user?.email}</span>
            <button type="button" className="nav-link" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}