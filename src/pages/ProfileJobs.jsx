import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listJobs, searchJobs } from '../api/jobs.js'
import { getProfile } from '../api/profiles.js'
import { apiErrorMessage } from '../api/client.js'
import JobCard from '../components/JobCard.jsx'
import { useToast } from '../components/Toast.jsx'
import { formatDateTime } from '../lib/format.js'

const NO_JOBS = []

export default function ProfileJobs() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { notify } = useToast()

  const [query, setQuery] = useState('')
  const [publisher, setPublisher] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)

  const profileQuery = useQuery({
    queryKey: ['profile', id],
    queryFn: () => getProfile(id),
  })

  const jobsQuery = useQuery({
    queryKey: ['jobs', id],
    queryFn: () => listJobs(id),
  })

  const searchMutation = useMutation({
    mutationFn: (searchQuery) => searchJobs(id, searchQuery),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['jobs', id] })
      queryClient.invalidateQueries({ queryKey: ['profile', id] })
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      const count = result?.new_jobs?.length ?? result?.new ?? 0
      notify(count > 0 ? `${count} new job(s) found` : 'Search complete — no new jobs', 'success')
    },
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  const jobs = jobsQuery.data ?? NO_JOBS

  const publishers = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.publisher).filter(Boolean))).sort(),
    [jobs],
  )

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      if (publisher !== 'all' && job.publisher !== publisher) return false
      if (
        keyword &&
        !`${job.matched_keyword ?? ''}`.toLowerCase().includes(keyword.toLowerCase())
      ) {
        return false
      }
      if (remoteOnly) {
        const remote =
          job.is_remote === true ||
          `${job.location ?? ''} ${job.title ?? ''}`.toLowerCase().includes('remote')
        if (!remote) return false
      }
      return true
    })
  }, [jobs, publisher, keyword, remoteOnly])

  function handleSearchNow() {
    searchMutation.mutate(query.trim() || undefined)
  }

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <Link className="breadcrumb" to={`/profiles/${id}`}>
            ← {profileQuery.data?.name ?? 'Profile'}
          </Link>
          <h1>Jobs</h1>
          <p className="muted">
            {profileQuery.data?.last_run_at
              ? `Last run ${formatDateTime(profileQuery.data.last_run_at)}`
              : 'Not run yet'}
            {profileQuery.data?.keywords?.length
              ? ` · ${profileQuery.data.keywords.length} keywords`
              : ''}
          </p>
        </div>
        <div className="page__head-actions">
          <input
            className="inline-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Optional one-off query"
          />
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleSearchNow}
            disabled={searchMutation.isPending}
          >
            {searchMutation.isPending ? 'Searching…' : 'Search now'}
          </button>
        </div>
      </header>

      <div className="filters card">
        <label className="field">
          <span>Publisher</span>
          <select value={publisher} onChange={(event) => setPublisher(event.target.value)}>
            <option value="all">All</option>
            {publishers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Matched keyword</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Filter by keyword"
          />
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={remoteOnly}
            onChange={(event) => setRemoteOnly(event.target.checked)}
          />
          <span>Remote only</span>
        </label>
      </div>

      {jobsQuery.isLoading && <div className="page-loading">Loading jobs…</div>}

      {jobsQuery.isError && (
        <div className="alert alert--error">{apiErrorMessage(jobsQuery.error)}</div>
      )}

      {jobsQuery.isSuccess && filtered.length === 0 && (
        <div className="card empty-state">
          <h3>{jobs.length === 0 ? 'No jobs yet' : 'No jobs match your filters'}</h3>
          <p className="muted">
            {jobs.length === 0
              ? 'Run a search to pull listings for this profile.'
              : 'Try clearing the filters above.'}
          </p>
        </div>
      )}

      <div className="grid">
        {filtered.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  )
}
