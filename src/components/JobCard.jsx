import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { setFeedback } from '../api/jobs.js'
import { apiErrorMessage } from '../api/client.js'
import { useToast } from './Toast.jsx'
import { formatDate } from '../lib/format.js'
import { STATUS_LABELS } from '../lib/jobStatus.js'

export default function JobCard({ job }) {
  const queryClient = useQueryClient()
  const { notify } = useToast()

  const feedbackMutation = useMutation({
    mutationFn: (status) => setFeedback(job.id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['jobDates'] })
      if (updated.status === 'not_interested') notify('Job dismissed', 'success')
      if (job.status === 'not_interested' && updated.status === 'new') notify('Job restored', 'success')
    },
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  function mark(status) {
    if (!feedbackMutation.isPending) feedbackMutation.mutate(status)
  }

  const dismissed = job.status === 'not_interested'

  return (
    <article className={`card job-card${dismissed ? ' job-card--dismissed' : ''}`}>
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
          <span className="badge badge--soft">{STATUS_LABELS[job.status] ?? job.status}</span>
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

      <div className="job-card__actions">
        {!dismissed && job.url && (
          <a
            className="btn btn--primary"
            href={job.url}
            target="_blank"
            rel="noreferrer"
            onClick={() => mark('applied')}
          >
            Apply
          </a>
        )}
        {!dismissed && job.status !== 'saved' && job.status !== 'applied' && (
          <button
            type="button"
            className="btn"
            onClick={() => mark('saved')}
            disabled={feedbackMutation.isPending}
          >
            Save
          </button>
        )}
        {!dismissed && (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => mark('not_interested')}
            disabled={feedbackMutation.isPending}
          >
            Not interested
          </button>
        )}
        {dismissed && (
          <button
            type="button"
            className="btn"
            onClick={() => mark('new')}
            disabled={feedbackMutation.isPending}
          >
            Restore
          </button>
        )}
      </div>
    </article>
  )
}
