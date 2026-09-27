import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="page">
      <div className="card empty-state">
        <h1>Page not found</h1>
        <p className="muted">The page you are looking for does not exist.</p>
        <Link className="btn btn--primary" to="/profiles">
          Back to profiles
        </Link>
      </div>
    </div>
  )
}
