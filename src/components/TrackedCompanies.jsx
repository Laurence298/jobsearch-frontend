import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addTrackedCompany,
  deleteTrackedCompany,
  listTrackedCompanies,
  trackedCompanyJobs,
} from '../api/trackedCompanies.js'
import { apiErrorMessage } from '../api/client.js'
import { useToast } from './Toast.jsx'
import { formatDate } from '../lib/format.js'

const ATS_LABELS = {
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  workable: 'Workable',
  recruitee: 'Recruitee',
}

function CompanyJobs({ companyId }) {
  const jobsQuery = useQuery({
    queryKey: ['trackedCompanyJobs', companyId],
    queryFn: () => trackedCompanyJobs(companyId),
    enabled: Boolean(companyId),
  })

  if (jobsQuery.isLoading) return <p className="muted">Loading open roles…</p>
  if (jobsQuery.isError) {
    return <p className="alert alert--error">{apiErrorMessage(jobsQuery.error)}</p>
  }

  const { jobs } = jobsQuery.data
  if (!jobs || jobs.length === 0) {
    return <p className="muted">No open roles right now.</p>
  }

  return (
    <ul className="list">
      {jobs.map((job) => (
        <li key={job.external_id} className="list__item">
          <div>
            <strong>{job.title}</strong>
            <p className="muted">
              {job.location ? `${job.location} · ` : ''}
              Posted {formatDate(job.posted_at)}
            </p>
          </div>
          {job.url && (
            <a href={job.url} target="_blank" rel="noreferrer">
              View
            </a>
          )}
        </li>
      ))}
    </ul>
  )
}

export default function TrackedCompanies({ profileId }) {
  const queryClient = useQueryClient()
  const { notify } = useToast()
  const [url, setUrl] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [openId, setOpenId] = useState(null)

  const companiesQuery = useQuery({
    queryKey: ['trackedCompanies', profileId],
    queryFn: () => listTrackedCompanies(profileId),
  })

  const addMutation = useMutation({
    mutationFn: (payload) => addTrackedCompany(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackedCompanies', profileId] })
      setUrl('')
      setCompanyName('')
      notify('Company tracked', 'success')
    },
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteTrackedCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trackedCompanies', profileId] })
      notify('Company removed', 'success')
    },
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  function handleAdd(event) {
    event.preventDefault()
    if (!url.trim()) return
    addMutation.mutate({
      url: url.trim(),
      company_name: companyName.trim() || url.trim(),
      profile_id: Number(profileId),
    })
  }

  const companies = companiesQuery.data ?? []

  return (
    <div className="tracked-companies">
      <form className="card form" onSubmit={handleAdd}>
        <div className="form-grid">
          <label className="field">
            <span>Company name</span>
            <input
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Stripe"
            />
          </label>
          <label className="field field--wide">
            <span>Careers URL (Greenhouse / Lever / Workable / Recruitee)</span>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://boards.greenhouse.io/stripe"
            />
          </label>
        </div>
        <button type="submit" className="btn" disabled={addMutation.isPending}>
          {addMutation.isPending ? 'Adding…' : '+ Add company'}
        </button>
      </form>

      {companiesQuery.isLoading && <p className="muted">Loading tracked companies…</p>}

      {companies.length === 0 && companiesQuery.isSuccess && (
        <p className="muted">
          Track specific companies to pull their open roles directly (no API key needed).
        </p>
      )}

      <ul className="list">
        {companies.map((company) => (
          <li key={company.id} className="list__item">
            <div className="tracked-company">
              <div>
                <strong>{company.company_name}</strong>
                <p className="muted">
                  {ATS_LABELS[company.ats_provider] ?? company.ats_provider}
                </p>
              </div>
              <div className="page__head-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setOpenId((current) => (current === company.id ? null : company.id))}
                >
                  {openId === company.id ? 'Close' : 'Open roles'}
                </button>
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={() => deleteMutation.mutate(company.id)}
                  disabled={deleteMutation.isPending}
                >
                  Remove
                </button>
              </div>
            </div>
            {openId === company.id && <CompanyJobs companyId={company.id} />}
          </li>
        ))}
      </ul>
    </div>
  )
}