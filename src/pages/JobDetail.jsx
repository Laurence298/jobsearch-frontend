import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteJob, getJob, setFeedback } from '../api/jobs.js'
import { apiErrorMessage } from '../api/client.js'
import { useToast } from '../components/Toast.jsx'
import TailoredResumePanel from '../components/TailoredResumePanel.jsx'
import { formatDate, formatDateTime } from '../lib/format.js'
import { FEEDBACK_OPTIONS, STATUS_LABELS } from '../lib/jobStatus.js'
import { payNote, salaryLabel } from '../lib/pay.js'

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notify } = useToast()
  const [applicationUrl, setApplicationUrl] = useState(null)
  const [applicationNote, setApplicationNote] = useState(null)

  const jobsQuery = useQuery({
    queryKey: ['job', id],
    queryFn: () => getJob(id),
    retry: false,
  })

  const feedbackMutation = useMutation({
    mutationFn: ({ status, details }) => setFeedback(id, status, details),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['job', id] })
      queryClient.invalidateQueries({ queryKey: ['jobDates'] })
      notify(updated.status === 'not_interested' ? 'Job dismissed' : 'Feedback updated', 'success')
    },
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['jobDates'] })
      notify('Job deleted', 'success')
      navigate(-1)
    },
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  if (jobsQuery.isLoading) {
    return <div className="page-loading">Loading job…</div>
  }

  if (jobsQuery.isError) {
    return (
      <div className="page">
        <div className="alert alert--error">{apiErrorMessage(jobsQuery.error)}</div>
      </div>
    )
  }

  const job = jobsQuery.data

  if (!job) {
    return (
      <div className="page">
        <div className="card empty-state">
          <h3>Job not found</h3>
          <p className="muted">It may have been removed or belongs to another account.</p>
          <Link className="btn" to="/profiles">
            Back to profiles
          </Link>
        </div>
      </div>
    )
  }

  function handleDelete() {
    if (window.confirm('Delete this job and its tailored resume?')) {
      deleteMutation.mutate()
    }
  }

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <Link className="breadcrumb" to={`/profiles/${job.profile_id}/jobs`}>
            ← Back to jobs
          </Link>
          <h1>{job.title}</h1>
          <p className="muted">
            {job.company || 'Unknown company'}
            {job.location ? ` · ${job.location}` : ''}
            {job.publisher ? ` · via ${job.publisher}` : ''}
          </p>
        </div>
        <div className="page__head-actions">
          {(job.application_url || job.url) && (
            <a
              className="btn btn--primary"
              href={job.application_url || job.url}
              target="_blank"
              rel="noreferrer"
            >
              Open application
            </a>
          )}
          {job.url && job.application_url && job.application_url !== job.url && (
            <a className="btn" href={job.url} target="_blank" rel="noreferrer">
              Open listing
            </a>
          )}
          <button
            type="button"
            className="btn btn--danger"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            Delete
          </button>
        </div>
      </header>

      <dl className="stat-row card">
        <div>
          <dt>Status</dt>
          <dd>
            <span className="badge badge--soft">{STATUS_LABELS[job.status] ?? job.status}</span>
          </dd>
        </div>
        {job.matched_keyword && (
          <div>
            <dt>Matched keyword</dt>
            <dd>{job.matched_keyword}</dd>
          </div>
        )}
        <div>
          <dt>Posted</dt>
          <dd>{formatDate(job.posted_at)}</dd>
        </div>
        <div>
          <dt>Pay</dt>
          <dd>{salaryLabel(job)}</dd>
        </div>
        {job.work_mode && <div><dt>Work arrangement</dt><dd>{job.work_mode}</dd></div>}
        {job.job_type && <div><dt>Job type</dt><dd>{job.job_type}</dd></div>}
        {job.source && (
          <div>
            <dt>Source</dt>
            <dd>{job.source}</dd>
          </div>
        )}
      </dl>

      {payNote(job) && <p className="muted">{payNote(job)}</p>}

      {job.company_research && (
        <section className="section card">
          <h2>Tracked company research</h2>
          <p>{job.company_research.company_name}
            {job.company_research.company_size ? ` · ${job.company_research.company_size} employees` : ''}
            {job.company_research.rating != null ? ` · Rating ${job.company_research.rating}/5` : ''}
          </p>
          {job.company_research.research_note && <p className="muted">{job.company_research.research_note}</p>}
          {job.company_research.source_url && (
            <a href={job.company_research.source_url} target="_blank" rel="noreferrer">Company careers page ↗</a>
          )}
        </section>
      )}

      <section className="section card">
        <h2>{job.applied_at ? 'Application and follow-up' : 'Track your application'}</h2>
        {job.applied_at && <p className="muted">Applied {formatDateTime(job.applied_at)}</p>}
        <form className="form" onSubmit={(event) => {
          event.preventDefault()
          feedbackMutation.mutate({ status: 'applied', details: {
            application_url: applicationUrl ?? job.application_url ?? job.url ?? '',
            application_note: applicationNote ?? job.application_note ?? '',
          } })
        }}>
          <div className="form-grid">
            <label className="field">
              <span>Application URL</span>
              <input type="url" maxLength={2000} value={applicationUrl ?? job.application_url ?? job.url ?? ''}
                onChange={(event) => setApplicationUrl(event.target.value)} placeholder="https://…" />
            </label>
            <label className="field field--wide">
              <span>Follow-up note</span>
              <textarea rows={3} maxLength={5000} value={applicationNote ?? job.application_note ?? ''}
                onChange={(event) => setApplicationNote(event.target.value)} placeholder="When to follow up, who you contacted…" />
            </label>
          </div>
          <button className="btn btn--primary" type="submit" disabled={feedbackMutation.isPending}>
            {job.applied_at ? 'Save application details' : 'Mark as applied'}
          </button>
        </form>
      </section>

      {job.matched_skills && job.matched_skills.length > 0 && (
        <section className="section">
          <h2>Matches your skills</h2>
          <ul className="chips">
            {job.matched_skills.map((skill) => (
              <li key={skill} className="chip chip--skill">
                {skill}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="section card">
        <h2>Job description</h2>
        {job.description ? (
          <div className="job-description">{job.description}</div>
        ) : (
          <p className="muted">This listing did not provide a description. Open the original listing for more details.</p>
        )}
      </section>

      <section className="section card">
        <h2>Skills listed by the employer</h2>
        {job.job_skills?.length > 0 ? (
          <ul className="chips">
            {job.job_skills.map((skill) => <li className="chip" key={skill}>{skill}</li>)}
          </ul>
        ) : (
          <p className="muted">No structured skills were provided for this listing. Check the description for requirements.</p>
        )}
      </section>

      <section className="section">
        <h2>Feedback</h2>
        <div className="page__head-actions">
          {FEEDBACK_OPTIONS.filter((option) => option.value !== job.status && option.value !== 'applied').map((option) => (
            <button
              key={option.value}
              type="button"
              className="btn"
              onClick={() => {
                feedbackMutation.mutate({ status: option.value })
              }}
              disabled={feedbackMutation.isPending}
            >
              {option.label}
            </button>
          ))}
          {job.status === 'not_interested' && (
            <button
              type="button"
              className="btn"
              onClick={() => feedbackMutation.mutate({ status: 'new' })}
              disabled={feedbackMutation.isPending}
            >
              Restore
            </button>
          )}
        </div>
        <p className="muted">
          Not interested hides this job from the default list and future searches. You can restore it here or from the jobs list with “Show dismissed”.
        </p>
      </section>

      <TailoredResumePanel key={job.id} jobId={job.id} profileId={job.profile_id} />
    </div>
  )
}
