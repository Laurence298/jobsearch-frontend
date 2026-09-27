import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listJobDates, listJobs, searchJobs, unifiedSearch } from '../api/jobs.js'
import { getProfile } from '../api/profiles.js'
import { apiErrorMessage } from '../api/client.js'
import JobCard from '../components/JobCard.jsx'
import { useToast } from '../components/Toast.jsx'
import { formatDate, formatDateTime, localDateString } from '../lib/format.js'

const NO_JOBS = []

export default function ProfileJobs() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { notify } = useToast()

  const today = localDateString()
  const [query, setQuery] = useState('')
  const [locationQ, setLocationQ] = useState('')
  const [date, setDate] = useState(today)
  const [publisher, setPublisher] = useState('all')
  const [source, setSource] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)

  const profileQuery = useQuery({
    queryKey: ['profile', id],
    queryFn: () => getProfile(id),
  })

  const datesQuery = useQuery({
    queryKey: ['jobDates', id],
    queryFn: () => listJobDates(id),
  })

  const jobsQuery = useQuery({
    queryKey: ['jobs', id, date],
    queryFn: () => listJobs(id, date === '' ? undefined : date),
  })

  function handleSearchSuccess(result) {
    queryClient.invalidateQueries({ queryKey: ['jobs', id] })
    queryClient.invalidateQueries({ queryKey: ['jobDates', id] })
    queryClient.invalidateQueries({ queryKey: ['profile', id] })
    queryClient.invalidateQueries({ queryKey: ['profiles'] })
    const count = result?.new_jobs ?? 0
    notify(
      count > 0 ? `${count} new job(s) found` : 'Search complete — no new jobs',
      count > 0 ? 'success' : 'info',
    )
    if (result?.jsearch_budget_exhausted) {
      notify('JSearch budget exhausted — showing tracked companies + cached results only', 'info')
    }
  }

  const searchMutation = useMutation({
    mutationFn: (search) => searchJobs(id, search),
    onSuccess: handleSearchSuccess,
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  const unifiedMutation = useMutation({
    mutationFn: (search) => unifiedSearch(id, search),
    onSuccess: handleSearchSuccess,
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  const jobs = jobsQuery.data ?? NO_JOBS

  const dateOptions = useMemo(() => {
    const additions = new Set((datesQuery.data ?? []).map((entry) => entry.date))
    if (date !== '') additions.add(today)
    return Array.from(additions).sort().reverse()
  }, [datesQuery.data, date, today])

  const publishers = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.publisher).filter(Boolean))).sort(),
    [jobs],
  )

  const sources = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.source).filter(Boolean))).sort(),
    [jobs],
  )

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      if (publisher !== 'all' && job.publisher !== publisher) return false
      if (source !== 'all' && job.source !== source) return false
      if (
        keyword &&
        !`${job.matched_keyword ?? ''}`.toLowerCase().includes(keyword.toLowerCase())
      ) {
        return false
      }
      if (remoteOnly) {
        const remote = `${job.location ?? ''} ${job.title ?? ''}`
          .toLowerCase()
          .includes('remote')
        if (!remote) return false
      }
      return true
    })
  }, [jobs, publisher, source, keyword, remoteOnly])

  function handleSearchNow() {
    searchMutation.mutate({ query: query.trim() || undefined })
  }

  function handleUnifiedSearch() {
    const q = query.trim()
    if (!q) {
      notify('Enter a search query first', 'error')
      return
    }
    unifiedMutation.mutate({ q, location: locationQ.trim() || undefined })
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
            placeholder="Search query"
          />
          <input
            className="inline-input"
            value={locationQ}
            onChange={(event) => setLocationQ(event.target.value)}
            placeholder="Location (optional)"
          />
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleUnifiedSearch}
            disabled={unifiedMutation.isPending}
          >
            {unifiedMutation.isPending ? 'Searching…' : 'Search'}
          </button>
          <button
            type="button"
            className="btn"
            onClick={handleSearchNow}
            disabled={searchMutation.isPending}
          >
            {searchMutation.isPending ? 'Running…' : 'Run full search'}
          </button>
        </div>
      </header>

      <div className="filters card">
        <label className="field">
          <span>Saved on</span>
          <select value={date} onChange={(event) => setDate(event.target.value)}>
            <option value="">All dates</option>
            {dateOptions.map((option) => (
              <option key={option} value={option}>
                {option === today ? 'Today' : formatDate(option)}
              </option>
            ))}
          </select>
        </label>

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
          <span>Source</span>
          <select value={source} onChange={(event) => setSource(event.target.value)}>
            <option value="all">All</option>
            {sources.map((name) => (
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