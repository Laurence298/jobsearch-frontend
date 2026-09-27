import { useState } from 'react'

function splitLines(value) {
  return String(value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function splitItems(value) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function toForm(data = {}) {
  return {
    name: data.name ?? '',
    location: data.location ?? '',
    phone: data.phone ?? '',
    email: data.email ?? '',
    linkedin: data.linkedin ?? '',
    skill_groups: (data.skill_groups ?? []).map((group) => ({
      label: group.label ?? '',
      itemsText: (group.items ?? []).join(', '),
    })),
    experience: (data.experience ?? []).map((entry) => ({
      title: entry.title ?? '',
      organization: entry.organization ?? '',
      location: entry.location ?? '',
      dates: entry.dates ?? '',
      bulletsText: (entry.bullets ?? []).join('\n'),
    })),
    projects: (data.projects ?? []).map((entry) => ({
      title: entry.title ?? '',
      organization: entry.organization ?? '',
      location: entry.location ?? '',
      dates: entry.dates ?? '',
      bulletsText: (entry.bullets ?? []).join('\n'),
    })),
    education: (data.education ?? []).map((entry) => ({
      degree: entry.degree ?? '',
      institution: entry.institution ?? '',
      location: entry.location ?? '',
      dates: entry.dates ?? '',
      notesText: (entry.notes ?? []).join('\n'),
    })),
  }
}

function toPayload(form) {
  return {
    name: form.name,
    location: form.location,
    phone: form.phone,
    email: form.email,
    linkedin: form.linkedin,
    skill_groups: form.skill_groups.map((group) => ({
      label: group.label,
      items: splitItems(group.itemsText),
    })),
    experience: form.experience.map((entry) => ({
      title: entry.title,
      organization: entry.organization,
      location: entry.location,
      dates: entry.dates,
      bullets: splitLines(entry.bulletsText),
    })),
    projects: form.projects.map((entry) => ({
      title: entry.title,
      organization: entry.organization,
      location: entry.location,
      dates: entry.dates,
      bullets: splitLines(entry.bulletsText),
    })),
    education: form.education.map((entry) => ({
      degree: entry.degree,
      institution: entry.institution,
      location: entry.location,
      dates: entry.dates,
      notes: splitLines(entry.notesText),
    })),
  }
}

const emptyGroup = () => ({ label: '', itemsText: '' })
const emptyEntry = () => ({
  title: '',
  organization: '',
  location: '',
  dates: '',
  bulletsText: '',
})
const emptyEducation = () => ({
  degree: '',
  institution: '',
  location: '',
  dates: '',
  notesText: '',
})

export default function ResumeEditor({ initial, onSave, saving, onCancel }) {
  const [form, setForm] = useState(() => toForm(initial))

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function setGroup(index, field, value) {
    setForm((current) => ({
      ...current,
      skill_groups: current.skill_groups.map((group, i) =>
        i === index ? { ...group, [field]: value } : group,
      ),
    }))
  }

  function setEntry(section, index, field, value) {
    setForm((current) => ({
      ...current,
      [section]: current[section].map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry,
      ),
    }))
  }

  function addGroup() {
    setForm((current) => ({
      ...current,
      skill_groups: [...current.skill_groups, emptyGroup()],
    }))
  }

  function removeGroup(index) {
    setForm((current) => ({
      ...current,
      skill_groups: current.skill_groups.filter((_, i) => i !== index),
    }))
  }

  function addEntry(section, factory) {
    setForm((current) => ({
      ...current,
      [section]: [...current[section], factory()],
    }))
  }

  function removeEntry(section, index) {
    setForm((current) => ({
      ...current,
      [section]: current[section].filter((_, i) => i !== index),
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSave(toPayload(form))
  }

  function renderEntries(section, label, fieldLabel, factory) {
    return (
      <div className="re-entries">
        <div className="re-entries__head">
          <h4>{label}</h4>
          <button type="button" className="btn" onClick={() => addEntry(section, factory)}>
            + Add
          </button>
        </div>
        {form[section].map((entry, index) => (
          <div key={index} className="re-entry card">
            <div className="re-entry__head">
              <strong>
                {entry.title || entry.degree || entry.organization || `${label} ${index + 1}`}
              </strong>
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => removeEntry(section, index)}
              >
                Remove
              </button>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>{fieldLabel}</span>
                <input
                  value={entry.title ?? entry.degree ?? ''}
                  onChange={(event) =>
                    setEntry(
                      section,
                      index,
                      section === 'education' ? 'degree' : 'title',
                      event.target.value,
                    )
                  }
                />
              </label>
              <label className="field">
                <span>{section === 'education' ? 'Institution' : 'Organization'}</span>
                <input
                  value={entry.institution ?? entry.organization ?? ''}
                  onChange={(event) =>
                    setEntry(
                      section,
                      index,
                      section === 'education' ? 'institution' : 'organization',
                      event.target.value,
                    )
                  }
                />
              </label>
              <label className="field">
                <span>Location</span>
                <input
                  value={entry.location ?? ''}
                  onChange={(event) => setEntry(section, index, 'location', event.target.value)}
                />
              </label>
              <label className="field">
                <span>Dates</span>
                <input
                  value={entry.dates ?? ''}
                  onChange={(event) => setEntry(section, index, 'dates', event.target.value)}
                  placeholder="2021-2024"
                />
              </label>
              <label className="field field--wide">
                <span>{section === 'education' ? 'Notes (one per line)' : 'Bullets (one per line)'}</span>
                <textarea
                  rows={4}
                  value={
                    section === 'education' ? entry.notesText ?? '' : entry.bulletsText ?? ''
                  }
                  onChange={(event) =>
                    setEntry(
                      section,
                      index,
                      section === 'education' ? 'notesText' : 'bulletsText',
                      event.target.value,
                    )
                  }
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field">
          <span>Name</span>
          <input value={form.name} onChange={(event) => setField('name', event.target.value)} />
        </label>
        <label className="field">
          <span>Email</span>
          <input value={form.email} onChange={(event) => setField('email', event.target.value)} />
        </label>
        <label className="field">
          <span>Phone</span>
          <input value={form.phone} onChange={(event) => setField('phone', event.target.value)} />
        </label>
        <label className="field">
          <span>Location</span>
          <input
            value={form.location ?? ''}
            onChange={(event) => setField('location', event.target.value)}
          />
        </label>
        <label className="field field--wide">
          <span>LinkedIn</span>
          <input
            value={form.linkedin ?? ''}
            onChange={(event) => setField('linkedin', event.target.value)}
          />
        </label>
      </div>

      <div className="re-entries">
        <div className="re-entries__head">
          <h4>Skills</h4>
          <button type="button" className="btn" onClick={addGroup}>
            + Add group
          </button>
        </div>
        {form.skill_groups.map((group, index) => (
          <div key={index} className="re-entry card">
            <div className="re-entry__head">
              <strong>{group.label || `Group ${index + 1}`}</strong>
              <button type="button" className="btn btn--danger" onClick={() => removeGroup(index)}>
                Remove
              </button>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Group label</span>
                <input
                  value={group.label}
                  onChange={(event) => setGroup(index, 'label', event.target.value)}
                  placeholder="Programming"
                />
              </label>
              <label className="field field--wide">
                <span>Skills (comma-separated)</span>
                <input
                  value={group.itemsText}
                  onChange={(event) => setGroup(index, 'itemsText', event.target.value)}
                  placeholder="Python, Docker, PostgreSQL"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      {renderEntries('experience', 'Experience', 'Title', emptyEntry)}
      {renderEntries('projects', 'Projects', 'Title', emptyEntry)}
      {renderEntries('education', 'Education', 'Degree', emptyEducation)}

      <div className="form-actions">
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}