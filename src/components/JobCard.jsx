import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { setFeedback } from '../api/jobs.js'
import { apiErrorMessage } from '../api/client.js'
import { useToast } from './Toast.jsx'
import { formatDate } from '../lib/format.js'
import { STATUS_LABELS } from '../lib/jobStatus.js'
import { payNote, salaryLabel } from '../lib/pay.js'

export default function JobCard({ job, selected = false, onSelect }) {
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
      {onSelect && !dismissed && (
        <label className="checkbox job-card__select">
          <input type="checkbox" checked={selected} onChange={(event) => onSelect(event.target.checked)} />
          <span>Select for bulk dismissal</span>
        </label>
      )}
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
          {job.work_mode && <span className="badge badge--soft">{job.work_mode}</span>}
          {job.job_type && <span className="badge badge--soft">{job.job_type}</span>}
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
        <div>
          <dt>Pay</dt>
          <dd title={payNote(job) ?? undefined}>{salaryLabel(job)}</dd>
        </div>
      </dl>
      {payNote(job) && <p className="muted job-card__pay-note">{payNote(job)}</p>}

      {job.company_research && (
        <p className="muted job-card__research">
          Tracked company{job.company_research.company_size ? ` · ${job.company_research.company_size} employees` : ''}
          {job.company_research.rating != null ? ` · Rating ${job.company_research.rating}/5` : ''}
          {job.company_research.research_note ? ` · ${job.company_research.research_note}` : ''}
        </p>
      )}

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
          >
            Open application
          </a>
        )}
        {!dismissed && (
          <Link className="btn" to={`/jobs/${job.id}`}>Track application</Link>
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
