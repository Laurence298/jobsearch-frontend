import { Link } from 'react-router-dom'
import { formatDate } from '../lib/format.js'

export default function JobCard({ job }) {
  return (
    <article className="card job-card">
      <div className="job-card__head">
        <div>
          <h3>
            <Link to={`/jobs/${job.id}`}>{job.title}</Link>
          </h3>
          <p className="muted">
            {job.company || 'Unknown company'}
            {job.location ? ` · ${job.location}` : ''}
          </p>
        </div>
        {job.publisher && <span className="badge">{job.publisher}</span>}
      </div>

      <dl className="job-card__meta">
        {job.matched_keyword && (
          <div>
            <dt>Matched</dt>
            <dd>{job.matched_keyword}</dd>
          </div>
        )}
        <div>
          <dt>Added</dt>
          <dd>{formatDate(job.created_at)}</dd>
        </div>
      </dl>
    </article>
  )
}
