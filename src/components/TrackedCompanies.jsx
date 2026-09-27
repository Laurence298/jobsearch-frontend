import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addTrackedCompany,
  deleteTrackedCompany,
  listTrackedCompanies,
  trackedCompanyJobs,
  updateCompanyResearch,
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

function CompanyResearch({ company, onSaved }) {
  const { notify } = useToast()
  const [size, setSize] = useState(company.company_size ?? '')
  const [rating, setRating] = useState(company.rating ?? '')
  const [note, setNote] = useState(company.research_note ?? '')
  const mutation = useMutation({
    mutationFn: () => updateCompanyResearch(company.id, {
      company_size: size.trim() || null,
      rating: rating === '' ? null : Number(rating),
      research_note: note.trim() || null,
    }),
    onSuccess: () => { onSaved(); notify('Company research saved', 'success') },
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  return (
    <form className="form company-research" onSubmit={(event) => { event.preventDefault(); mutation.mutate() }}>
      <div className="form-grid">
        <label className="field">
          <span>Company size (employees, if known)</span>
          <input value={size} maxLength={100} onChange={(event) => setSize(event.target.value)} placeholder="50–100" />
        </label>
        <label className="field">
          <span>Rating (0–5, if known)</span>
          <input type="number" min="0" max="5" step="0.1" value={rating}
            onChange={(event) => setRating(event.target.value)} />
        </label>
        <label className="field field--wide">
          <span>Research note</span>
          <textarea rows={2} maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)}
            placeholder="What you learned about the company…" />
        </label>
      </div>
      <p className="muted">These details are your notes; no rating or size is inferred by the app.</p>
      <button type="submit" className="btn" disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving…' : 'Save research'}
      </button>
    </form>
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
            {openId === company.id && (
              <CompanyResearch key={company.id} company={company}
                onSaved={() => {
                  queryClient.invalidateQueries({ queryKey: ['trackedCompanies', profileId] })
                  queryClient.invalidateQueries({ queryKey: ['jobs'] })
                }} />
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
