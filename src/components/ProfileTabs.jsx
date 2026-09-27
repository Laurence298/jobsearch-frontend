import { NavLink } from 'react-router-dom'

export default function ProfileTabs({ profileId }) {
  return (
    <nav className="profile-tabs" aria-label="Profile sections">
      {['jobs', 'resumes', 'search', 'settings'].map((tab) => (
        <NavLink key={tab} to={`/profiles/${profileId}/${tab}`}
          className={({ isActive }) => `profile-tabs__link${isActive ? ' active' : ''}`}>
          {tab[0].toUpperCase() + tab.slice(1)}
        </NavLink>
      ))}
    </nav>
  )
}
