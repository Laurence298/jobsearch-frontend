import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { NavLink, Outlet } from 'react-router-dom'
import { listProfiles } from '../api/profiles.js'
import { unreadCount } from '../api/notifications.js'
import { useAuth } from '../auth/AuthContext.jsx'
import NotificationsBell from './NotificationsBell.jsx'

export default function Layout() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const profilesQuery = useQuery({
    queryKey: ['profiles'],
    queryFn: listProfiles,
    enabled: Boolean(user),
  })
  const unreadQuery = useQuery({
    queryKey: ['notificationsUnread'],
    queryFn: () => unreadCount(),
    enabled: Boolean(user),
    refetchInterval: 30_000,
  })

  return (
    <div className="app-shell">
      <aside className={`sidebar${menuOpen ? ' sidebar--open' : ''}`}>
        <NavLink to="/profiles" className="brand" onClick={() => setMenuOpen(false)}>
          <span className="brand__mark">JT</span>
          <span>JobTracker</span>
        </NavLink>

        <button type="button" className="btn mobile-menu-toggle" aria-expanded={menuOpen}
          aria-controls="main-navigation" onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? 'Close menu' : 'Menu'}
          {(unreadQuery.data?.unread ?? 0) > 0 && (
            <span className="notif__count" aria-label={`${unreadQuery.data.unread} unread notifications`}>
              {unreadQuery.data.unread}
            </span>
          )}
        </button>

        <nav className="sidebar__nav" id="main-navigation">
          <NavLink
            to="/profiles"
            end
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Profiles
          </NavLink>
          {profilesQuery.data?.length > 0 && (
            <ul className="sidebar__profiles" aria-label="Your profiles">
              {profilesQuery.data.map((profile) => (
                <li key={profile.id}>
                  <NavLink
                    to={`/profiles/${profile.id}`}
                    className={({ isActive }) =>
                      isActive ? 'nav-link sidebar__profile active' : 'nav-link sidebar__profile'
                    }
                    title={profile.name}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="sidebar__profile-name">{profile.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </nav>

        <div className="sidebar__foot">
          <NotificationsBell />
          <div className="sidebar__user">
            <span className="sidebar__email">{user?.email}</span>
            <button type="button" className="nav-link" onClick={() => { setMenuOpen(false); logout() }}>
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
