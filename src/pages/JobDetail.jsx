import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { listJobs, tailorResume } from '../api/jobs.js'
import { apiErrorMessage } from '../api/client.js'
import { useToast } from '../components/Toast.jsx'
import { downloadText, formatDateTime } from '../lib/format.js'

function extractResumeText(data) {
  if (!data) return ''
  if (typeof data === 'string') return data
  return data.resume ?? data.tailored_resume ?? data.text ?? JSON.stringify(data, null, 2)
}

export default function JobDetail() {
  const { id } = useParams()
  const { notify } = useToast()
  const [tailored, setTailored] = useState('')

  const jobsQuery = useQuery({
    queryKey: ['jobs'],
    queryFn: () => listJobs(),
  })

  const tailorMutation = useMutation({
    mutationFn: () => tailorResume(id),
    onSuccess: (data) => {
      setTailored(extractResumeText(data))
      notify('Tailored resume ready', 'success')
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
            <a className="btn" href={job.url} target="_blank" rel="noreferrer">
              Open listing
            </a>
          )}
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => tailorMutation.mutate()}
            disabled={tailorMutation.isPending}
          >
            {tailorMutation.isPending ? 'Tailoring…' : 'Tailor my resume'}
          </button>
        </div>
      </header>

      <dl className="stat-row card">
        {job.matched_keyword && (
          <div>
            <dt>Matched keyword</dt>
            <dd>{job.matched_keyword}</dd>
          </div>
        )}
        <div>
          <dt>Added</dt>
          <dd>{formatDateTime(job.created_at)}</dd>
        </div>
        {job.profile_id != null && (
          <div>
            <dt>Profile</dt>
            <dd>
              <Link to={`/profiles/${job.profile_id}`}>#{job.profile_id}</Link>
            </dd>
          </div>
        )}
      </dl>

      {job.description && (
        <section className="section">
          <h2>Description</h2>
          <div className="card prose">{job.description}</div>
        </section>
      )}

      {tailored && (
        <section className="section">
          <div className="section__head">
            <h2>Tailored resume</h2>
            <button
              type="button"
              className="btn"
              onClick={() => downloadText(`tailored-resume-job-${job.id}.txt`, tailored)}
            >
              Download .txt
            </button>
          </div>
          <pre className="resume-output">{tailored}</pre>
        </section>
      )}
    </div>
  )
}
