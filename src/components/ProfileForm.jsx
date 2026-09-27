import { useState } from 'react'

const EMPTY = {
  name: '',
  full_name: '',
  phone: '',
  location: 'Calgary, Alberta',
  desired_titles: '',
  job_type: 'full-time',
  experience_level: 'mid',
  searches_per_day: 3,
  jobs_per_search: 20,
}

export default function ProfileForm({ initialValues, onSubmit, submitLabel, submitting }) {
  const [values, setValues] = useState(() => ({ ...EMPTY, ...initialValues }))

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({
      ...values,
      searches_per_day: Number(values.searches_per_day),
      jobs_per_search: Number(values.jobs_per_search),
    })
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field">
          <span>Profile name</span>
          <input
            value={values.name}
            onChange={(event) => setField('name', event.target.value)}
            placeholder="Backend roles"
            required
          />
        </label>

        <label className="field">
          <span>Full name</span>
          <input
            value={values.full_name}
            onChange={(event) => setField('full_name', event.target.value)}
            placeholder="Jane Doe"
          />
        </label>

        <label className="field">
          <span>Phone</span>
          <input
            value={values.phone}
            onChange={(event) => setField('phone', event.target.value)}
            placeholder="+1 555 000 0000"
          />
        </label>

        <label className="field">
          <span>Location</span>
          <input
            value={values.location}
            onChange={(event) => setField('location', event.target.value)}
          />
        </label>

        <label className="field field--wide">
          <span>Desired titles</span>
          <input
            value={values.desired_titles}
            onChange={(event) => setField('desired_titles', event.target.value)}
            placeholder="backend developer"
          />
        </label>

        <label className="field">
          <span>Job type</span>
          <select
            value={values.job_type}
            onChange={(event) => setField('job_type', event.target.value)}
          >
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </label>

        <label className="field">
          <span>Experience level</span>
          <select
            value={values.experience_level}
            onChange={(event) => setField('experience_level', event.target.value)}
          >
            <option value="entry">Entry</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
            <option value="lead">Lead</option>
          </select>
        </label>

        <label className="field">
          <span>Searches per day (1–3)</span>
          <input
            type="number"
            min="1"
            max="3"
            value={values.searches_per_day}
            onChange={(event) => setField('searches_per_day', event.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Jobs per search (1–50)</span>
          <input
            type="number"
            min="1"
            max="50"
            value={values.jobs_per_search}
            onChange={(event) => setField('jobs_per_search', event.target.value)}
            required
          />
        </label>
      </div>

      <button type="submit" className="btn btn--primary" disabled={submitting}>
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}
