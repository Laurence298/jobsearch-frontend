import { Link } from 'react-router-dom'
import { formatDateTime } from '../lib/format.js'

export default function ProfileCard({ profile, onDelete, deleting }) {
  return (
    <article className="card profile-card">
      <div className="profile-card__head">
        <div>
          <h3>
            <Link to={`/profiles/${profile.id}`}>{profile.name}</Link>
          </h3>
          <p className="muted">
            {profile.desired_titles || 'No desired titles'}
            {profile.location ? ` · ${profile.location}` : ''}
            {profile.work_mode ? ` · ${profile.work_mode}` : ''}
          </p>
          {(profile.min_hourly_pay != null || profile.min_salary != null) && (
            <p className="muted">
              Target: {profile.pay_type === 'hourly' && profile.min_hourly_pay != null
                ? `${profile.min_hourly_pay}/hour`
                : profile.pay_type === 'annual' && profile.min_salary != null
                  ? `${Number(profile.min_salary).toLocaleString()}/year`
                  : profile.min_hourly_pay != null
                    ? `${profile.min_hourly_pay}/hour`
                    : `${Number(profile.min_salary).toLocaleString()}/year`}
            </p>
          )}
        </div>
        <span className="badge badge--soft">
          {profile.searches_per_day}× / day
        </span>
      </div>

      <dl className="stat-row">
        <div>
          <dt>Jobs / search</dt>
          <dd>{profile.jobs_per_search}</dd>
        </div>
        <div>
          <dt>Keywords</dt>
          <dd>{profile.keywords?.length ?? 0}</dd>
        </div>
        <div>
          <dt>Last run</dt>
          <dd>{profile.last_run_at ? formatDateTime(profile.last_run_at) : 'Never'}</dd>
        </div>
      </dl>

      <div className="profile-card__actions">
        <Link className="btn btn--primary" to={`/profiles/${profile.id}/jobs`}>
          View jobs
        </Link>
        <Link className="btn" to={`/profiles/${profile.id}`}>
          Manage
        </Link>
        <button
          type="button"
          className="btn btn--danger"
          onClick={() => onDelete(profile)}
          disabled={deleting}
        >
          Delete
        </button>
      </div>
    </article>
  )
}
