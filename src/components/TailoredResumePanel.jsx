import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getTailoredData,
  getTailoredPdf,
  getTailoredResume,
  regenerateTailored,
  tailorResume,
  updateTailoredData,
} from '../api/jobs.js'
import { listResumes } from '../api/profiles.js'
import { apiErrorMessage } from '../api/client.js'
import { useToast } from './Toast.jsx'
import { downloadText } from '../lib/format.js'
import ResumeEditor from './ResumeEditor.jsx'

const TEMPLATES = ['basic', 'professional']

const TAILOR_POLL_INTERVAL = 3000
const TAILOR_POLL_MAX = 15

function ResumePreview({ jobId }) {
  const { notify } = useToast()
  const [state, setState] = useState('loading')
  const [pdfUrl, setPdfUrl] = useState(null)
  const [fallback, setFallback] = useState(null)
  const urlRef = useRef(null)

  useEffect(() => {
    let active = true
    setState('loading')
    getTailoredPdf(jobId)
      .then((result) => {
        if (!active) return
        if (result.pdf) {
          const url = URL.createObjectURL(result.blob)
          urlRef.current = url
          setPdfUrl(url)
          setState('pdf')
        } else {
          setFallback(result.data)
          setState('text')
        }
      })
      .catch((error) => {
        if (!active) return
        notify(apiErrorMessage(error), 'error')
        setState('error')
      })

    return () => {
      active = false
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
    }
  }, [jobId, notify])

  if (state === 'loading') {
    return <div className="page-loading">Rendering resume…</div>
  }

  if (state === 'error') {
    return <p className="alert alert--error">Could not load the resume preview.</p>
  }

  if (state === 'pdf') {
    return (
      <div className="resume-preview">
        <div className="resume-preview__actions">
          <a className="btn" href={pdfUrl} download="resume.pdf">
            Download PDF
          </a>
        </div>
        <iframe
          className="resume-frame"
          src={pdfUrl}
          title="Tailored resume preview"
        />
      </div>
    )
  }

  return (
    <div className="resume-preview">
      <p className="alert alert--warning">
        Couldn't generate PDF{fallback?.reason ? ` — ${fallback.reason}` : ''}. Showing plain
        text instead.
      </p>
      <div className="resume-preview__actions">
        <button
          type="button"
          className="btn"
          onClick={() => downloadText('resume.txt', fallback?.text ?? '')}
        >
          Download .txt
        </button>
      </div>
      <pre className="resume-output">{fallback?.text ?? 'No text available'}</pre>
    </div>
  )
}

function TailorForm({ jobId, profileId }) {
  const [template, setTemplate] = useState('')
  const [resumeId, setResumeId] = useState('')
  const queryClient = useQueryClient()
  const { notify } = useToast()

  const resumesQuery = useQuery({
    queryKey: ['resumes', profileId],
    queryFn: () => listResumes(profileId),
  })

  const tailorMutation = useMutation({
    mutationFn: () =>
      tailorResume(jobId, {
        resume_id: resumeId || undefined,
        template: template || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tailored', jobId] })
      notify('Resume tailored', 'success')
    },
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  const hasResumes = (resumesQuery.data?.length ?? 0) > 0

  return (
    <div>
      <p className="muted">No tailored resume for this job yet.</p>
      {!resumesQuery.isLoading && !hasResumes && (
        <p className="alert alert--warning">
          Upload a resume on the profile page first.
        </p>
      )}
      <div className="resume-toolbar">
        {hasResumes && resumesQuery.data.length > 1 && (
          <label className="field">
            <span>Resume</span>
            <select value={resumeId} onChange={(event) => setResumeId(event.target.value)}>
              <option value="">Most recent</option>
              {resumesQuery.data.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  #{resume.id}
                  {resume.label ? ` — ${resume.label}` : ''}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="field">
          <span>Template</span>
          <select value={template} onChange={(event) => setTemplate(event.target.value)}>
            <option value="">Auto</option>
            {TEMPLATES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => tailorMutation.mutate()}
          disabled={tailorMutation.isPending}
        >
          {tailorMutation.isPending ? 'Tailoring…' : 'Tailor my resume'}
        </button>
      </div>
    </div>
  )
}

function EditView({ jobId, onSaved, onCancel }) {
  const queryClient = useQueryClient()
  const { notify } = useToast()

  const dataQuery = useQuery({
    queryKey: ['tailored-data', jobId],
    queryFn: () => getTailoredData(jobId),
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => updateTailoredData(jobId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tailored', jobId] })
      notify('Resume saved — PDF will recompile on preview', 'success')
      onSaved()
    },
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  if (dataQuery.isLoading) {
    return <div className="page-loading">Loading resume data…</div>
  }

  return (
    <ResumeEditor
      initial={dataQuery.data ?? {}}
      saving={saveMutation.isPending}
      onSave={(payload) => saveMutation.mutate(payload)}
      onCancel={onCancel}
    />
  )
}

export default function TailoredResumePanel({ jobId, profileId }) {
  const queryClient = useQueryClient()
  const { notify } = useToast()
  const [view, setView] = useState('preview')
  const [pollCount, setPollCount] = useState(0)

  const tailoredQuery = useQuery({
    queryKey: ['tailored', jobId],
    queryFn: () => getTailoredResume(jobId),
    retry: false,
  })

  useEffect(() => {
    if (!tailoredQuery.isError || pollCount >= TAILOR_POLL_MAX) return undefined
    const timer = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['tailored', jobId] })
      setPollCount((count) => count + 1)
    }, TAILOR_POLL_INTERVAL)
    return () => clearTimeout(timer)
  }, [tailoredQuery.isError, pollCount, queryClient, jobId])

  const regenerateMutation = useMutation({
    mutationFn: () => regenerateTailored(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tailored', jobId] })
      queryClient.invalidateQueries({ queryKey: ['tailored-data', jobId] })
      notify('Regenerated — manual edits discarded', 'success')
      setView('preview')
    },
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  function handleRegenerate() {
    if (
      window.confirm(
        'Regenerate with AI? This discards any manual edits you made to this resume.',
      )
    ) {
      regenerateMutation.mutate()
    }
  }

  const stillTailoring = tailoredQuery.isError && pollCount < TAILOR_POLL_MAX

  return (
    <section className="section">
      {tailoredQuery.isLoading && (
        <div className="page-loading">Checking tailored resume…</div>
      )}

      {tailoredQuery.isError && stillTailoring && (
        <>
          <h2>Tailored resume</h2>
          <div className="page-loading">Generating tailored resume…</div>
          <p className="muted">
            Auto-tailoring runs in the background after a search. This can take a few moments.
          </p>
        </>
      )}

      {tailoredQuery.isError && !stillTailoring && (
        <>
          <h2>Tailored resume</h2>
          <TailorForm jobId={jobId} profileId={profileId} />
        </>
      )}

      {tailoredQuery.isSuccess && (
        <>
          <div className="section__head">
            <h2>Tailored resume</h2>
            <div className="page__head-actions">
              <span className="badge badge--soft">
                {tailoredQuery.data.is_user_edited ? 'edited by you' : 'AI-tailored'}
              </span>
              <span className="badge badge--soft">{tailoredQuery.data.template_id}</span>
              <button
                type="button"
                className={`btn ${view === 'preview' ? 'btn--primary' : ''}`}
                onClick={() => setView('preview')}
              >
                Preview
              </button>
              <button
                type="button"
                className={`btn ${view === 'edit' ? 'btn--primary' : ''}`}
                onClick={() => setView('edit')}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={handleRegenerate}
                disabled={regenerateMutation.isPending}
              >
                Regenerate
              </button>
            </div>
          </div>

          {view === 'preview' ? (
            <ResumePreview jobId={jobId} />
          ) : (
            <EditView
              jobId={jobId}
              onSaved={() => setView('preview')}
              onCancel={() => setView('preview')}
            />
          )}
        </>
      )}
    </section>
  )
}