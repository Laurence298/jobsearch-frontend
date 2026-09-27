import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bulkFeedback, listJobDates, listJobs, searchJobs, unifiedSearch } from '../api/jobs.js'
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
  const [date, setDate] = useState('')
  const [publisher, setPublisher] = useState('all')
  const [source, setSource] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [workMode, setWorkMode] = useState('all')
  const [jobType, setJobType] = useState('all')
  const [searchPayType, setSearchPayType] = useState('')
  const [searchPay, setSearchPay] = useState('')
  const [searchWorkMode, setSearchWorkMode] = useState('')
  const [searchJobType, setSearchJobType] = useState('')
  const [searchPublishers, setSearchPublishers] = useState('')
  const [searchRecency, setSearchRecency] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [showDismissed, setShowDismissed] = useState(false)
  const [searchResult, setSearchResult] = useState(null)

  const profileQuery = useQuery({
    queryKey: ['profile', id],
    queryFn: () => getProfile(id),
  })

  const datesQuery = useQuery({
    queryKey: ['jobDates', id, showDismissed],
    queryFn: () => listJobDates(id, showDismissed),
  })

  const jobsQuery = useQuery({
    queryKey: ['jobs', id, date, showDismissed],
    queryFn: () => listJobs(id, date === '' ? undefined : date, showDismissed),
  })

  function handleSearchSuccess(result, label) {
    setSearchResult({
      profileId: id,
      ids: result.jobs.map((job) => job.id),
      newJobs: result.new_jobs,
      budgetExhausted: result.jsearch_budget_exhausted,
      label,
    })
    // SearchResponse.jobs may include matches saved on earlier days.
    setDate('')
    setSelectedIds([])
    queryClient.invalidateQueries({ queryKey: ['jobs', id] })
    queryClient.invalidateQueries({ queryKey: ['jobDates', id] })
    queryClient.invalidateQueries({ queryKey: ['profile', id] })
    queryClient.invalidateQueries({ queryKey: ['profiles'] })
    const count = result?.new_jobs ?? 0
    notify(
      count > 0
        ? `${count} new job(s) saved from ${result.jobs.length} match(es)`
        : `${result.jobs.length} match(es) found — no new jobs saved`,
      count > 0 ? 'success' : 'info',
    )
  }

  const searchMutation = useMutation({
    mutationFn: (options) => searchJobs(id, options),
    onSuccess: (result) => handleSearchSuccess(result, 'Saved-keyword results'),
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  const unifiedMutation = useMutation({
    mutationFn: (search) => unifiedSearch(id, search),
    onSuccess: (result, search) => handleSearchSuccess(result, `Results for “${search.q}”`),
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  const bulkMutation = useMutation({
    mutationFn: (ids) => bulkFeedback(ids),
    onSuccess: (updated) => {
      setSelectedIds([])
      queryClient.invalidateQueries({ queryKey: ['jobs', id] })
      queryClient.invalidateQueries({ queryKey: ['jobDates', id] })
      notify(`${updated.length} job(s) dismissed`, 'success')
    },
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  const jobs = jobsQuery.data ?? NO_JOBS

  const dateCounts = useMemo(
    () => new Map((datesQuery.data ?? []).map((entry) => [entry.date, entry.count])),
    [datesQuery.data],
  )

  const dateOptions = useMemo(() => {
    const additions = new Set(dateCounts.keys())
    additions.add(today)
    return Array.from(additions).sort().reverse()
  }, [dateCounts, today])

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
      if (workMode !== 'all') {
        const text = `${job.location ?? ''} ${job.title ?? ''}`.toLowerCase()
        const legacyMode = text.includes('hybrid') ? 'hybrid' : text.includes('remote') ? 'remote' : null
        if ((job.work_mode ?? legacyMode) !== workMode) return false
      }
      if (jobType !== 'all' && job.job_type !== jobType) return false
      return true
    })
  }, [jobs, publisher, source, keyword, workMode, jobType])

  const activeSearch = searchResult?.profileId === id ? searchResult : null
  const visibleJobs = useMemo(() => {
    if (!activeSearch) return filtered
    const byId = new Map(filtered.map((job) => [job.id, job]))
    return activeSearch.ids.map((jobId) => byId.get(jobId)).filter(Boolean)
  }, [activeSearch, filtered])

  const selectableIds = visibleJobs.filter((job) => job.status !== 'not_interested').map((job) => job.id)
  const selectedVisibleIds = selectableIds.filter((jobId) => selectedIds.includes(jobId))

  function searchOverrides() {
    return {
      ...(searchPayType && searchPay !== '' ? {
        pay_type: searchPayType,
        [searchPayType === 'hourly' ? 'min_hourly_pay' : 'min_salary']: Number(searchPay),
      } : {}),
      ...(searchWorkMode ? { work_mode: searchWorkMode } : {}),
      ...(searchJobType ? { job_type: searchJobType } : {}),
      ...(searchPublishers.trim() ? { publishers: searchPublishers.trim() } : {}),
      ...(searchRecency ? { date_posted: searchRecency } : {}),
    }
  }

  function handleUnifiedSearch(event) {
    event.preventDefault()
    const q = query.trim()
    if (!q) {
      notify('Enter a search query first', 'error')
      return
    }
    unifiedMutation.mutate({ q, location: locationQ.trim() || undefined, ...searchOverrides() })
  }

  const hasJobsOnOtherDates =
    date !== '' && datesQuery.isSuccess && datesQuery.data.some((entry) => entry.date !== date)
  const searching = searchMutation.isPending || unifiedMutation.isPending

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
      </header>

      <section className="card job-search" aria-label="Find jobs">
        <form className="job-search__form" onSubmit={handleUnifiedSearch}>
          <label className="field">
            <span>Search roles</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Developer, data analyst or tester"
              required
            />
          </label>
          <label className="field">
            <span>Location (optional)</span>
            <input
              value={locationQ}
              onChange={(event) => setLocationQ(event.target.value)}
              placeholder="Calgary, Alberta"
            />
          </label>
          <button type="submit" className="btn btn--primary" disabled={searching}>
            {unifiedMutation.isPending ? 'Searching…' : 'Search roles'}
          </button>
        </form>
        <p className="muted">
          Separate roles with commas or “or”. Each term searches separately and uses search quota;
          tracked-company results are included.
        </p>
        <div className="form-grid search-overrides">
          <label className="field">
            <span>Pay target for this search</span>
            <select value={searchPayType} onChange={(event) => { setSearchPayType(event.target.value); setSearchPay('') }}>
              <option value="">Use profile target</option>
              <option value="hourly">Minimum hourly pay</option>
              <option value="annual">Minimum annual salary</option>
            </select>
          </label>
          {searchPayType && (
            <label className="field">
              <span>{searchPayType === 'hourly' ? 'Hourly amount' : 'Annual amount'}</span>
              <input type="number" min="0" step="0.01" value={searchPay}
                onChange={(event) => setSearchPay(event.target.value)} placeholder="Enter an amount" />
            </label>
          )}
          <label className="field">
            <span>Work arrangement</span>
            <select value={searchWorkMode} onChange={(event) => setSearchWorkMode(event.target.value)}>
              <option value="">Use profile preference</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">Onsite</option>
            </select>
          </label>
          <label className="field">
            <span>Job type</span>
            <select value={searchJobType} onChange={(event) => setSearchJobType(event.target.value)}>
              <option value="">Use profile preference</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
            </select>
          </label>
          <label className="field">
            <span>Publishers (comma-separated)</span>
            <input value={searchPublishers} onChange={(event) => setSearchPublishers(event.target.value)}
              placeholder="All publishers" />
          </label>
          <label className="field">
            <span>Posted</span>
            <select value={searchRecency} onChange={(event) => setSearchRecency(event.target.value)}>
              <option value="">Use profile recency</option>
              <option value="today">Today</option>
              <option value="3days">Last 3 days</option>
              <option value="week">Last week</option>
              <option value="month">Last month</option>
              <option value="all">All time</option>
            </select>
          </label>
        </div>
        <p className="muted">Jobs without reported pay are included even when a pay target is set.</p>
        <div className="job-search__actions">
          <button
            type="button"
            className="btn"
            onClick={() => searchMutation.mutate(searchOverrides())}
            disabled={searching || !profileQuery.data?.keywords?.length}
          >
            {searchMutation.isPending ? 'Searching…' : 'Run saved keywords'}
          </button>
          {profileQuery.isSuccess && !profileQuery.data.keywords?.length && (
            <Link to={`/profiles/${id}`} className="muted">
              Add keywords to run a profile search
            </Link>
          )}
        </div>
      </section>

      {activeSearch && (
        <div className="card search-summary" role="status">
          <div>
            <strong>{activeSearch.label} · {activeSearch.ids.length} match(es)</strong>
            <p className="muted">{activeSearch.newJobs} new job(s) saved</p>
            {activeSearch.budgetExhausted && (
              <p className="alert alert--warning">
                JSearch daily budget reached. Further searches may only use tracked companies
                and cached jobs.
              </p>
            )}
          </div>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setSearchResult(null)
              setDate('')
            }}
          >
            Show saved jobs
          </button>
        </div>
      )}

      <div className="filters card">
        <label className="field">
          <span>Saved on</span>
          <select
            value={date}
            onChange={(event) => {
              setDate(event.target.value)
              setSearchResult(null)
            }}
          >
            <option value="">All dates</option>
            {dateOptions.map((option) => (
              <option key={option} value={option}>
                {option === today ? 'Today' : formatDate(option)}
                {dateCounts.has(option) ? ` (${dateCounts.get(option)})` : ''}
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

        <label className="field">
          <span>Work arrangement</span>
          <select value={workMode} onChange={(event) => setWorkMode(event.target.value)}>
            <option value="all">All</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">Onsite</option>
          </select>
        </label>
        <label className="field">
          <span>Job type</span>
          <select value={jobType} onChange={(event) => setJobType(event.target.value)}>
            <option value="all">All</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
          </select>
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={showDismissed}
            onChange={(event) => setShowDismissed(event.target.checked)}
          />
          <span>Show dismissed</span>
        </label>
      </div>

      {jobsQuery.isLoading && <div className="page-loading">Loading jobs…</div>}

      {jobsQuery.isError && (
        <div className="alert alert--error">{apiErrorMessage(jobsQuery.error)}</div>
      )}

      {jobsQuery.isSuccess && visibleJobs.length === 0 && (
        <div className="card empty-state">
          <h3>
            {activeSearch
              ? activeSearch.ids.length === 0
                ? 'No matches found'
                : 'No jobs match your filters'
              : jobs.length === 0
                ? 'No jobs yet'
                : 'No jobs match your filters'}
          </h3>
          <p className="muted">
            {activeSearch && activeSearch.ids.length === 0
              ? activeSearch.budgetExhausted
                ? 'Try again when the daily JSearch budget resets, or browse your saved jobs.'
                : 'Try broader roles or a different location.'
              : jobs.length === 0
                ? hasJobsOnOtherDates
                  ? 'Nothing saved on this day. Pick another date above to see earlier jobs.'
                  : showDismissed
                    ? 'No saved jobs for this profile. Search for roles above, or add keywords and run a profile search.'
                    : 'No active jobs. Search above or select “Show dismissed” to restore a job.'
                : 'Try clearing the filters above.'}
          </p>
        </div>
      )}

      {selectableIds.length > 0 && (
        <div className="bulk-actions card">
          <label className="checkbox">
            <input type="checkbox" checked={selectedVisibleIds.length === selectableIds.length}
              onChange={(event) => setSelectedIds(event.target.checked ? selectableIds : [])} />
            <span>Select all visible ({selectableIds.length})</span>
          </label>
          <button type="button" className="btn btn--danger" disabled={!selectedVisibleIds.length || bulkMutation.isPending}
            onClick={() => bulkMutation.mutate(selectedVisibleIds)}>
            {bulkMutation.isPending ? 'Dismissing…' : `Dismiss selected (${selectedVisibleIds.length})`}
          </button>
        </div>
      )}

      <div className="grid">
        {visibleJobs.map((job) => (
          <JobCard key={job.id} job={job} selected={selectedIds.includes(job.id)}
            onSelect={(checked) => setSelectedIds((current) => checked
              ? [...new Set([...current, job.id])] : current.filter((entry) => entry !== job.id))} />
        ))}
      </div>
    </div>
  )
}
