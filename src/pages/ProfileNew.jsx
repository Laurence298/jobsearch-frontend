import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { createProfileWithResume, previewResume } from '../api/profiles.js'
import { apiErrorMessage } from '../api/client.js'
import EditableChips from '../components/EditableChips.jsx'
import ProfileForm from '../components/ProfileForm.jsx'
import { useToast } from '../components/Toast.jsx'

export default function ProfileNew() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notify } = useToast()
  const fileInput = useRef(null)
  const [resumeText, setResumeText] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [resume, setResume] = useState(null)
  const [draft, setDraft] = useState(null)
  const [skills, setSkills] = useState([])
  const [education, setEducation] = useState([])

  function review(fields) {
    setDraft(fields)
    setSkills(fields.skills ?? [])
    setEducation(fields.education ?? [])
  }

  const previewMutation = useMutation({
    mutationFn: previewResume,
    onSuccess: review,
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  const createMutation = useMutation({
    mutationFn: (values) => createProfileWithResume({ ...values, skills, education }, resume),
    onSuccess: (profile) => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['resumes', String(profile.id)] })
      notify('Profile and resume saved. Review search queries next.', 'success')
      navigate(`/profiles/${profile.id}/search`, { replace: true })
    },
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  function handleResumeSubmit(event) {
    event.preventDefault()
    if (!resumeFile && !resumeText.trim()) {
      notify('Paste resume text or choose a resume file first', 'error')
      return
    }
    if (resumeFile && resumeFile.size > 5 * 1024 * 1024) {
      notify('Resume file must be 5 MB or smaller', 'error')
      return
    }
    if (!resumeFile && resumeText.length > 100_000) {
      notify('Resume is too long (maximum 100,000 characters)', 'error')
      return
    }
    const selectedResume = { text: resumeFile ? null : resumeText, file: resumeFile, filename: resumeFile?.name ?? null }
    setResume(selectedResume)
    previewMutation.mutate(selectedResume)
  }

  function addUnique(setter, value) {
    setter((items) => items.some((item) => item.toLowerCase() === value.toLowerCase())
      ? items : [...items, value])
  }

  const firstTitle = draft?.desired_titles?.[0]
  const initialValues = draft ? {
    name: firstTitle ? `${firstTitle.slice(0, 200)} roles` : 'My job search',
    full_name: draft.full_name ?? '',
    phone: draft.phone ?? '',
    location: draft.location ?? '',
    desired_titles: (draft.desired_titles ?? []).join(', '),
    experience_level: draft.experience_level ?? 'mid',
    years_experience: draft.years_experience ?? '',
  } : null

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <h1>New profile</h1>
          <p className="muted">
            {draft ? 'Step 2 of 2 — review and edit your search profile.'
              : 'Step 1 of 2 — add your resume to prefill your profile.'}
          </p>
        </div>
      </header>

      {!draft ? (
        <section className="card form" aria-label="Add resume">
          <h2>Start with your resume</h2>
          <p className="muted">
            We’ll suggest your name, contact information, background and roles from the resume.
            You can change every suggestion before creating your profile.
          </p>
          <form className="form" onSubmit={handleResumeSubmit}>
            <label className="field">
              <span>Upload a .txt, .pdf or .docx resume</span>
              <input
                ref={fileInput}
                type="file"
                accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
              />
            </label>
            {resumeFile && (
              <button type="button" className="btn" onClick={() => {
                setResumeFile(null)
                if (fileInput.current) fileInput.current.value = ''
              }}>
                Use pasted text instead
              </button>
            )}
            <label className="field">
              <span>Or paste resume text</span>
              <textarea
                rows={8}
                value={resumeText}
                onChange={(event) => setResumeText(event.target.value)}
                placeholder="Paste your resume here…"
              />
            </label>
            <button className="btn btn--primary" type="submit" disabled={previewMutation.isPending}>
              {previewMutation.isPending ? 'Reading resume…' : 'Review suggested profile'}
            </button>
          </form>
          {previewMutation.isError && resume && (
            <button type="button" className="btn" onClick={() => review({})}>
              Continue without suggestions
            </button>
          )}
        </section>
      ) : (
        <>
          <div className="card">
            <strong>Resume ready: {resume.filename || 'Pasted text'}</strong>
            <p className="muted">Check your preferred search location and job titles — the resume may not state them.</p>
            {!draft.full_name && !draft.phone && !draft.location && !draft.desired_titles?.length
              && !draft.skills?.length && !draft.education?.length
              && draft.years_experience == null && (
              <p className="muted">No details could be extracted. Fill in the profile below using your resume.</p>
            )}
            <button type="button" className="btn" onClick={() => setDraft(null)}>
              Change resume
            </button>
          </div>

          <section className="section">
            <h2>Review skills</h2>
            <EditableChips
              items={skills}
              onAdd={(item) => addUnique(setSkills, item)}
              onRemove={(item) => setSkills((items) => items.filter((entry) => entry !== item))}
              addPlaceholder="Add a skill…"
              emptyLabel="No skills found — add any you want to use for matching."
            />
          </section>

          <section className="section">
            <h2>Review education</h2>
            <EditableChips
              items={education}
              onAdd={(item) => addUnique(setEducation, item)}
              onRemove={(item) => setEducation((items) => items.filter((entry) => entry !== item))}
              addPlaceholder="Add a degree or field…"
              emptyLabel="No education fields found — add one if relevant."
            />
          </section>

          <section className="section">
            <h2>Review profile and search settings</h2>
            <ProfileForm
              initialValues={initialValues}
              onSubmit={(values) => createMutation.mutate(values)}
              submitLabel="Create profile with resume"
              submitting={createMutation.isPending}
              requireLocation
            />
          </section>
        </>
      )}
    </div>
  )
}
