import { useQuery } from '@tanstack/react-query'
import { NavLink, Outlet } from 'react-router-dom'
import { listProfiles } from '../api/profiles.js'
import { useAuth } from '../auth/AuthContext.jsx'
import NotificationsBell from './NotificationsBell.jsx'

export default function Layout() {
  const { user, logout } = useAuth()
  const profilesQuery = useQuery({
    queryKey: ['profiles'],
    queryFn: listProfiles,
    enabled: Boolean(user),
  })

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
            end
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
