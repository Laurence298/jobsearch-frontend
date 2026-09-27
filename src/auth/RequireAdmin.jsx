import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getAdminStats } from '../api/admin.js'

export default function RequireAdmin({ children }) {
  const { isLoading, isError } = useQuery({
    queryKey: ['adminStats'],
    queryFn: getAdminStats,
    retry: false,
  })

  if (isLoading) {
    return <div className="page-loading">Checking access…</div>
  }

  if (isError) {
    return (
      <div className="page">
        <div className="card empty-state">
          <h3>Admins only</h3>
          <p className="muted">
            Your account is not in ADMIN_EMAILS, so the admin dashboard is unavailable.
          </p>
          <Link className="btn" to="/profiles">
            Back to profiles
          </Link>
        </div>
      </div>
    )
  }

  return children
}