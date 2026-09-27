import { useState } from 'react'

const SEARCH_WINDOW_START = 8
const SEARCH_WINDOW_END = 21
const MAX_SELECTABLE_HOURS = 3

const HOURS = Array.from(
  { length: SEARCH_WINDOW_END - SEARCH_WINDOW_START + 1 },
  (_, index) => SEARCH_WINDOW_START + index,
)

function formatHour(hour) {
  if (hour === 0) return '12am'
  if (hour === 12) return '12pm'
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`
}

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
  date_posted: 'today',
  auto_tailor: true,
  notify_new_jobs: true,
  search_hours: [],
  timezone: '',
}

export default function ProfileForm({ initialValues, onSubmit, submitLabel, submitting }) {
  const [values, setValues] = useState(() => ({
    ...EMPTY,
    ...initialValues,
    search_hours: Array.isArray(initialValues?.search_hours)
      ? [...initialValues.search_hours]
      : [],
  }))

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function toggleHour(hour, checked) {
    setValues((current) => {
      if (checked && current.search_hours.length >= MAX_SELECTABLE_HOURS) {
        return current
      }
      return {
        ...current,
        search_hours: checked
          ? [...current.search_hours, hour].sort((a, b) => a - b)
          : current.search_hours.filter((entry) => entry !== hour),
      }
    })
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({
      ...values,
      searches_per_day: Number(values.searches_per_day),
      jobs_per_search: Number(values.jobs_per_search),
      auto_tailor: Boolean(values.auto_tailor),
      notify_new_jobs: Boolean(values.notify_new_jobs),
      search_hours: values.search_hours,
      timezone: values.timezone?.trim() ? values.timezone.trim() : null,
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
          <span>Listing recency</span>
          <select
            value={values.date_posted}
            onChange={(event) => setField('date_posted', event.target.value)}
          >
            <option value="today">Last 24 hours</option>
            <option value="3days">Last 3 days</option>
            <option value="week">Last week</option>
            <option value="month">Last month</option>
            <option value="all">All time</option>
          </select>
        </label>

        <label className="field">
          <span>Searches per day (1–{MAX_SELECTABLE_HOURS})</span>
          <input
            type="number"
            min="1"
            max={MAX_SELECTABLE_HOURS}
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

        <fieldset className="field field--wide">
          <legend>Search hours (8am–9pm, local time — up to {MAX_SELECTABLE_HOURS})</legend>
          <div className="hour-picker">
            {HOURS.map((hour) => {
              const selected = values.search_hours.includes(hour)
              const full = values.search_hours.length >= MAX_SELECTABLE_HOURS
              return (
                <label key={hour} className="hour">
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={!selected && full}
                    onChange={(event) => toggleHour(hour, event.target.checked)}
                  />
                  <span>{formatHour(hour)}</span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <label className="field">
          <span>Timezone (IANA)</span>
          <input
            value={values.timezone}
            onChange={(event) => setField('timezone', event.target.value)}
            placeholder="America/Edmonton"
          />
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={values.auto_tailor}
            onChange={(event) => setField('auto_tailor', event.target.checked)}
          />
          <span>Auto-tailor resumes for new jobs</span>
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={values.notify_new_jobs}
            onChange={(event) => setField('notify_new_jobs', event.target.checked)}
          />
          <span>Notify me on new jobs</span>
        </label>
      </div>

      <button type="submit" className="btn btn--primary" disabled={submitting}>
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}