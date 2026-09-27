import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteProfile,
  generateKeywords,
  getProfile,
  listResumes,
  updateProfile,
  uploadResume,
} from '../api/profiles.js'
import { apiErrorMessage } from '../api/client.js'
import ProfileForm from '../components/ProfileForm.jsx'
import KeywordChips from '../components/KeywordChips.jsx'
import { useToast } from '../components/Toast.jsx'
import { formatDateTime } from '../lib/format.js'

export default function ProfileDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notify } = useToast()

  const [resumeText, setResumeText] = useState('')
  const [resumeFile, setResumeFile] = useState(null)

  const profileQuery = useQuery({
    queryKey: ['profile', id],
    queryFn: () => getProfile(id),
  })

  const resumesQuery = useQuery({
    queryKey: ['resumes', id],
    queryFn: () => listResumes(id),
  })

  const updateMutation = useMutation({
    mutationFn: (values) => updateProfile(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', id] })
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      notify('Profile updated', 'success')
    },
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      notify('Profile deleted', 'success')
      navigate('/profiles', { replace: true })
    },
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  const keywordsMutation = useMutation({
    mutationFn: () => generateKeywords(id),
    onSuccess: (keywords) => {
      queryClient.invalidateQueries({ queryKey: ['profile', id] })
      notify(`Generated ${keywords.length} keyword(s)`, 'success')
    },
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  const resumeMutation = useMutation({
    mutationFn: () => uploadResume(id, { text: resumeText, file: resumeFile }),
    onSuccess: () => {
      setResumeText('')
      setResumeFile(null)
      queryClient.invalidateQueries({ queryKey: ['resumes', id] })
      notify('Resume saved', 'success')
    },
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  if (profileQuery.isLoading) {
    return <div className="page-loading">Loading profile…</div>
  }

  if (profileQuery.isError) {
    return (
      <div className="page">
        <div className="alert alert--error">{apiErrorMessage(profileQuery.error)}</div>
        <Link className="btn" to="/profiles">
          Back to profiles
        </Link>
      </div>
    )
  }

  const profile = profileQuery.data

  function handleDelete() {
    if (window.confirm(`Delete "${profile.name}" and all of its jobs?`)) {
      deleteMutation.mutate()
    }
  }

  function handleResumeSubmit(event) {
    event.preventDefault()
    if (!resumeFile && !resumeText.trim()) {
      notify('Paste resume text or choose a .txt file first', 'error')
      return
    }
    resumeMutation.mutate()
  }

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <Link className="breadcrumb" to="/profiles">
            ← Profiles
          </Link>
          <h1>{profile.name}</h1>
          <p className="muted">
            Last run {profile.last_run_at ? formatDateTime(profile.last_run_at) : 'never'}
          </p>
        </div>
        <div className="page__head-actions">
          <Link className="btn btn--primary" to={`/profiles/${id}/jobs`}>
            View jobs
          </Link>
          <button
            type="button"
            className="btn btn--danger"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            Delete profile
          </button>
        </div>
      </header>

      <section className="section">
        <h2>Search settings</h2>
        <ProfileForm
          initialValues={{
            name: profile.name ?? '',
            full_name: profile.full_name ?? '',
            phone: profile.phone ?? '',
            location: profile.location ?? '',
            desired_titles: profile.desired_titles ?? '',
            job_type: profile.job_type ?? 'full-time',
            experience_level: profile.experience_level ?? 'mid',
            searches_per_day: profile.searches_per_day ?? 3,
            jobs_per_search: profile.jobs_per_search ?? 20,
          }}
          onSubmit={(values) => updateMutation.mutate(values)}
          submitLabel="Save changes"
          submitting={updateMutation.isPending}
        />
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Resume</h2>
          <span className="muted">
            {resumesQuery.data?.length
              ? `${resumesQuery.data.length} saved`
              : 'None saved yet'}
          </span>
        </div>

        <form className="card form" onSubmit={handleResumeSubmit}>
          <label className="field">
            <span>Paste resume text</span>
            <textarea
              rows={6}
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              placeholder="Paste your resume as plain text…"
            />
          </label>

          <label className="field">
            <span>…or upload a .txt file (PDF/DOCX not supported yet)</span>
            <input
              type="file"
              accept=".txt,text/plain"
              onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <button
            type="submit"
            className="btn btn--primary"
            disabled={resumeMutation.isPending}
          >
            {resumeMutation.isPending ? 'Saving…' : 'Save resume'}
          </button>
        </form>

        {resumesQuery.isSuccess && resumesQuery.data.length > 0 && (
          <ul className="list">
            {resumesQuery.data.map((resume) => (
              <li key={resume.id} className="list__item">
                <div>
                  <strong>Resume #{resume.id}</strong>
                  <p className="muted">Added {formatDateTime(resume.created_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Keywords</h2>
          <button
            type="button"
            className="btn"
            onClick={() => keywordsMutation.mutate()}
            disabled={keywordsMutation.isPending}
          >
            {keywordsMutation.isPending ? 'Generating…' : 'Generate keywords'}
          </button>
        </div>
        <p className="muted">
          Generated from your profile and most recent resume. Used by job search when no
          query is given.
        </p>
        <KeywordChips keywords={profile.keywords} />
      </section>
    </div>
  )
}
