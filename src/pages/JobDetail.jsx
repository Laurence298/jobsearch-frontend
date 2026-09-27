import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteJob, listJobs, setFeedback } from '../api/jobs.js'
import { apiErrorMessage } from '../api/client.js'
import { useToast } from '../components/Toast.jsx'
import TailoredResumePanel from '../components/TailoredResumePanel.jsx'
import { formatDate } from '../lib/format.js'
import { FEEDBACK_OPTIONS, STATUS_LABELS } from '../lib/jobStatus.js'

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notify } = useToast()

  const jobsQuery = useQuery({
    queryKey: ['jobs', 'includeNotInterested'],
    queryFn: () => listJobs(undefined, undefined, true),
  })

  const feedbackMutation = useMutation({
    mutationFn: (status) => setFeedback(id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
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

  const job = jobsQuery.data.find((item) => String(item.id) === String(id))

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
          {job.url && (
            <a
              className="btn btn--primary"
              href={job.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => feedbackMutation.mutate('applied')}
            >
              Apply
            </a>
          )}
          {job.url && (
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
        {job.salary && (
          <div>
            <dt>Salary</dt>
            <dd>{job.salary}</dd>
          </div>
        )}
        {job.source && (
          <div>
            <dt>Source</dt>
            <dd>{job.source}</dd>
          </div>
        )}
      </dl>

      {job.matched_skills && job.matched_skills.length > 0 && (
        <section className="section">
          <h2>Matched skills</h2>
          <ul className="chips">
            {job.matched_skills.map((skill) => (
              <li key={skill} className="chip chip--skill">
                {skill}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="section">
        <h2>Feedback</h2>
        <div className="page__head-actions">
          {FEEDBACK_OPTIONS.filter((option) => option.value !== job.status).map((option) => (
            <button
              key={option.value}
              type="button"
              className="btn"
              onClick={() => {
                feedbackMutation.mutate(option.value)
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
              onClick={() => feedbackMutation.mutate('new')}
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
