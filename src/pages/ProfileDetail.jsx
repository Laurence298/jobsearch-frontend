import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addKeyword,
  addSkill,
  deleteProfile,
  deleteResume,
  generateEducation,
  generateSkills,
  getProfile,
  listResumes,
  removeKeyword,
  removeSkill,
  setEducation,
  setKeywords,
  suggestKeywords,
  updateProfile,
  uploadResume,
} from '../api/profiles.js'
import { apiErrorMessage } from '../api/client.js'
import ProfileForm from '../components/ProfileForm.jsx'
import EditableChips from '../components/EditableChips.jsx'
import TrackedCompanies from '../components/TrackedCompanies.jsx'
import { useToast } from '../components/Toast.jsx'
import { formatDateTime } from '../lib/format.js'

export default function ProfileDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notify } = useToast()

  const [resumeText, setResumeText] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeLabel, setResumeLabel] = useState('')
  const [suggestions, setSuggestions] = useState(null)

  const profileQuery = useQuery({
    queryKey: ['profile', id],
    queryFn: () => getProfile(id),
  })

  const resumesQuery = useQuery({
    queryKey: ['resumes', id],
    queryFn: () => listResumes(id),
  })

  function invalidateProfile() {
    queryClient.invalidateQueries({ queryKey: ['profile', id] })
    queryClient.invalidateQueries({ queryKey: ['profiles'] })
  }

  const updateMutation = useMutation({
    mutationFn: (values) => updateProfile(id, values),
    onSuccess: () => {
      invalidateProfile()
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
    mutationFn: () => suggestKeywords(id),
    onSuccess: (keywords) => {
      setSuggestions({ profileId: id, items: keywords })
      notify(`${keywords.length} search suggestion(s) ready to review`, 'success')
    },
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  const saveKeywordsMutation = useMutation({
    mutationFn: (items) => setKeywords(id, items),
    onSuccess: () => {
      setSuggestions(null)
      invalidateProfile()
      notify('Search queries saved', 'success')
    },
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  const skillsMutation = useMutation({
    mutationFn: () => generateSkills(id),
    onSuccess: (skills) => {
      invalidateProfile()
      notify(`Extracted ${skills.length} skill(s)`, 'success')
    },
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  const addKeywordMutation = useMutation({
    mutationFn: (keyword) => addKeyword(id, keyword),
    onSuccess: () => invalidateProfile(),
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  const removeKeywordMutation = useMutation({
    mutationFn: (keyword) => removeKeyword(id, keyword),
    onSuccess: () => invalidateProfile(),
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  const addSkillMutation = useMutation({
    mutationFn: (skill) => addSkill(id, skill),
    onSuccess: () => invalidateProfile(),
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  const removeSkillMutation = useMutation({
    mutationFn: (skill) => removeSkill(id, skill),
    onSuccess: () => invalidateProfile(),
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  const educationMutation = useMutation({
    mutationFn: () => generateEducation(id),
    onSuccess: (education) => {
      invalidateProfile()
      notify(`Extracted ${education.length} education field(s)`, 'success')
    },
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  const updateEducationMutation = useMutation({
    mutationFn: (items) => setEducation(id, items),
    onSuccess: () => invalidateProfile(),
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  const resumeMutation = useMutation({
    mutationFn: () =>
      uploadResume(id, { text: resumeText, file: resumeFile, label: resumeLabel }),
    onSuccess: () => {
      setResumeText('')
      setResumeFile(null)
      setResumeLabel('')
      queryClient.invalidateQueries({ queryKey: ['resumes', id] })
      notify('Resume saved', 'success')
    },
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  const deleteResumeMutation = useMutation({
    mutationFn: (resumeId) => deleteResume(id, resumeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes', id] })
      notify('Resume deleted', 'success')
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
  const suggestedItems = suggestions?.profileId === id ? suggestions.items : null

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
            job_type: ['full-time', 'part-time', 'contract'].includes(profile.job_type) ? profile.job_type : '',
            work_mode: profile.work_mode ?? '',
            pay_type: profile.pay_type ?? (profile.min_hourly_pay != null ? 'hourly' : profile.min_salary != null ? 'annual' : ''),
            min_hourly_pay: profile.min_hourly_pay ?? '',
            min_salary: profile.min_salary ?? '',
            alert_min_hourly_pay: profile.alert_min_hourly_pay ?? '',
            alert_min_salary: profile.alert_min_salary ?? '',
            experience_level: profile.experience_level ?? 'mid',
            years_experience: profile.years_experience ?? '',
            experience_range: profile.experience_range ?? 2,
            searches_per_day: profile.searches_per_day ?? 3,
            jobs_per_search: profile.jobs_per_search ?? 20,
            date_posted: profile.date_posted ?? 'today',
            auto_tailor: profile.auto_tailor ?? true,
            notify_new_jobs: profile.notify_new_jobs ?? true,
            notify_weekly_digest: profile.notify_weekly_digest ?? false,
            search_hours: profile.search_hours ?? [],
            timezone: profile.timezone ?? '',
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
          <div className="form-grid">
            <label className="field field--wide">
              <span>Paste resume text</span>
              <textarea
                rows={6}
                value={resumeText}
                onChange={(event) => setResumeText(event.target.value)}
                placeholder="Paste your resume as plain text…"
              />
            </label>

            <label className="field">
              <span>Label (e.g. Backend, Data)</span>
              <input
                value={resumeLabel}
                onChange={(event) => setResumeLabel(event.target.value)}
                placeholder="Backend"
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
          </div>
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
              <li key={resume.id} className="list__item resume-item">
                <div>
                  <strong>{resume.label || `Resume #${resume.id}`}</strong>
                  {resume.filename ? <span className="muted"> · {resume.filename}</span> : null}
                  <p className="muted">Added {formatDateTime(resume.created_at)}</p>
                </div>
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={() => deleteResumeMutation.mutate(resume.id)}
                  disabled={deleteResumeMutation.isPending}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Skills</h2>
          <button
            type="button"
            className="btn"
            onClick={() => skillsMutation.mutate()}
            disabled={skillsMutation.isPending}
          >
            {skillsMutation.isPending ? 'Extracting…' : 'Extract from resume'}
          </button>
        </div>
        <p className="muted">
          Hard skills used to score job matches. Fix auto-extraction by adding or removing.
        </p>
        <EditableChips
          items={profile.skills ?? []}
          onAdd={(skill) => addSkillMutation.mutate(skill)}
          onRemove={(skill) => removeSkillMutation.mutate(skill)}
          addPlaceholder="Add a skill…"
          emptyLabel="No skills yet — extract them from a resume first."
        />
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Education</h2>
          <button
            type="button"
            className="btn"
            onClick={() => educationMutation.mutate()}
            disabled={educationMutation.isPending}
          >
            {educationMutation.isPending ? 'Extracting…' : 'Extract from resume'}
          </button>
        </div>
        <p className="muted">
          Degrees and fields used to guide the search. Add or remove as needed.
        </p>
        <EditableChips
          items={profile.education ?? []}
          onAdd={(item) =>
            updateEducationMutation.mutate([...(profile.education ?? []), item])
          }
          onRemove={(item) =>
            updateEducationMutation.mutate(
              (profile.education ?? []).filter((entry) => entry !== item),
            )
          }
          addPlaceholder="Add a degree or field…"
          emptyLabel="No education fields yet — extract them from a resume first."
        />
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
            {keywordsMutation.isPending ? 'Generating…' : 'Suggest search queries'}
          </button>
        </div>
        <p className="muted">
          Broad role titles work best. Each saved query runs separately and uses search quota;
          review suggestions before replacing your current queries.
        </p>
        {suggestedItems && (
          <div className="card form" aria-label="Suggested search queries">
            <h3>Review suggested queries</h3>
            {suggestedItems.map((item, index) => (
              <div className="editable-chips__add" key={index}>
                <input
                  className="inline-input"
                  aria-label={`Search query ${index + 1}`}
                  value={item}
                  onChange={(event) =>
                    setSuggestions((current) => ({
                      ...current,
                      items: current.items.map((query, position) =>
                        position === index ? event.target.value : query,
                      ),
                    }))
                  }
                />
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    setSuggestions((current) => ({
                      ...current,
                      items: current.items.filter((_, position) => position !== index),
                    }))
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="job-search__actions">
              <button
                type="button"
                className="btn btn--primary"
                disabled={saveKeywordsMutation.isPending || !suggestedItems.some((item) => item.trim())}
                onClick={() =>
                  saveKeywordsMutation.mutate(suggestedItems.map((item) => item.trim()).filter(Boolean))
                }
              >
                {saveKeywordsMutation.isPending ? 'Saving…' : 'Use these queries'}
              </button>
              <button type="button" className="btn" onClick={() => setSuggestions(null)} disabled={saveKeywordsMutation.isPending}>
                Cancel
              </button>
            </div>
          </div>
        )}
        <EditableChips
          items={profile.keywords ?? []}
          onAdd={(keyword) => addKeywordMutation.mutate(keyword)}
          onRemove={(keyword) => removeKeywordMutation.mutate(keyword)}
          addPlaceholder="Add a keyword…"
          emptyLabel="No search queries yet — get suggestions or add your own."
        />
      </section>

      <section className="section">
        <h2>Tracked companies</h2>
        <p className="muted">
          Pull open roles directly from company career boards (Greenhouse, Lever, Workable,
          Recruitee).
        </p>
        <TrackedCompanies profileId={id} />
      </section>
    </div>
  )
}
