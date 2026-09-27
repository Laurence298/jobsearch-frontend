import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { getJob } from '../api/jobs.js'
import { listProfiles } from '../api/profiles.js'
import { unreadCount } from '../api/notifications.js'
import { useAuth } from '../auth/AuthContext.jsx'
import NotificationsBell from './NotificationsBell.jsx'

export default function Layout() {
  const { user, logout } = useAuth()
  const [menuPath, setMenuPath] = useState(null)
  const location = useLocation()
  const menuOpen = menuPath === location.pathname
  const toggleMenu = () => setMenuPath((current) => current === location.pathname ? null : location.pathname)
  const jobId = location.pathname.match(/^\/jobs\/(\d+)$/)?.[1]
  const jobQuery = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId),
    enabled: Boolean(jobId),
  })
  const profileId = location.pathname.match(/^\/profiles\/(\d+)(?:\/|$)/)?.[1]
    ?? (jobId ? jobQuery.data?.profile_id : null)

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
      <aside className={`sidebar${menuOpen ? ' sidebar--open' : ''}${profileId ? ' sidebar--profile' : ''}`}>
        <NavLink to="/profiles" className="brand" onClick={() => setMenuPath(null)}>
          <span className="brand__mark">JT</span>
          <span>JobTracker</span>
        </NavLink>

        <button type="button" className="btn mobile-menu-toggle" aria-expanded={menuOpen}
          aria-controls="main-navigation" onClick={toggleMenu}>
          {menuOpen ? 'Close menu' : 'Menu'}
          {(unreadQuery.data?.unread ?? 0) > 0 && (
            <span className="notif__count" aria-label={`${unreadQuery.data.unread} unread notifications`}>
              {unreadQuery.data.unread}
            </span>
          )}
        </button>

        <div className="sidebar__drawer" id="main-navigation">
          <nav className="sidebar__nav" aria-label="Profiles">
            <NavLink
              to="/profiles"
              end
              onClick={() => setMenuPath(null)}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              Profiles
            </NavLink>
            {profilesQuery.data?.length > 0 && (
              <ul className="sidebar__profiles" aria-label="Your profiles">
                {profilesQuery.data.map((profile) => (
                  <li key={profile.id}>
                    <NavLink
                      to={`/profiles/${profile.id}/jobs`}
                      className={({ isActive }) =>
                        isActive ? 'nav-link sidebar__profile active' : 'nav-link sidebar__profile'
                      }
                      title={profile.name}
                      onClick={() => setMenuPath(null)}
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
              <button type="button" className="nav-link" onClick={() => { setMenuPath(null); logout() }}>
                Log out
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
      {profileId && (
        <div className="mobile-profile-controls">
          <button type="button" className="mobile-taskbar-toggle" aria-expanded={menuOpen}
            aria-controls="main-navigation" onClick={toggleMenu}>
            {menuOpen ? 'Close taskbar' : 'Expand taskbar'}
            {(unreadQuery.data?.unread ?? 0) > 0 && <span className="notif__count">{unreadQuery.data.unread}</span>}
          </button>
          <nav className="mobile-profile-tabs" aria-label="Profile tabs">
            {[
              ['Jobs', 'jobs', '▣'], ['Resumes', 'resumes', '▤'],
              ['Search', 'search', '⌕'], ['Settings', 'settings', '⚙'],
            ].map(([label, tab, icon]) => (
              <NavLink key={tab} to={`/profiles/${profileId}/${tab}`}
                className={({ isActive }) => `mobile-profile-tab${isActive || (jobId && tab === 'jobs') ? ' active' : ''}`}>
                <span aria-hidden="true">{icon}</span><span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}
