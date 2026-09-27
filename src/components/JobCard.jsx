import { Link } from 'react-router-dom'
import { formatDate } from '../lib/format.js'

export default function JobCard({ job }) {
  return (
    <article className="card job-card">
      <div className="job-card__head">
        <div>
          <h3>
            <Link to={`/jobs/${job.id}`}>{job.title || 'Untitled'}</Link>
          </h3>
          <p className="muted">
            {job.company || 'Unknown company'}
            {job.location ? ` · ${job.location}` : ''}
          </p>
        </div>
        <div className="job-card__badges">
          {job.source && job.source !== 'jsearch' && (
            <span className="badge badge--soft">{job.source}</span>
          )}
          {job.publisher && <span className="badge">{job.publisher}</span>}
        </div>
      </div>

      <dl className="job-card__meta">
        {job.matched_keyword && (
          <div>
            <dt>Matched</dt>
            <dd>{job.matched_keyword}</dd>
          </div>
        )}
        <div>
          <dt>Posted</dt>
          <dd>{formatDate(job.posted_at)}</dd>
        </div>
        {job.salary && (
          <div>
            <dt>Salary</dt>
            <dd>{job.salary}</dd>
          </div>
        )}
      </dl>

      {job.matched_skills && job.matched_skills.length > 0 && (
        <ul className="chips">
          {job.matched_skills.map((skill) => (
            <li key={skill} className="chip chip--skill">
              {skill}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}