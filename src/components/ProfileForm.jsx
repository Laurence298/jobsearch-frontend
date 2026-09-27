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
  job_type: '',
  work_mode: '',
  pay_type: '',
  min_hourly_pay: '',
  min_salary: '',
  alert_min_hourly_pay: '',
  alert_min_salary: '',
  experience_level: 'mid',
  years_experience: '',
  experience_range: 2,
  searches_per_day: 3,
  jobs_per_search: 20,
  date_posted: 'today',
  auto_tailor: true,
  notify_new_jobs: true,
  notify_weekly_digest: false,
  search_hours: [],
  timezone: '',
}

export default function ProfileForm({ initialValues, onSubmit, submitLabel, submitting, requireLocation = false }) {
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
      years_experience: values.years_experience === '' || values.years_experience == null
        ? null : Number(values.years_experience),
      experience_range: Number(values.experience_range),
      auto_tailor: Boolean(values.auto_tailor),
      notify_new_jobs: Boolean(values.notify_new_jobs),
      notify_weekly_digest: Boolean(values.notify_weekly_digest),
      job_type: values.job_type || null,
      work_mode: values.work_mode || null,
      pay_type: values.pay_type || null,
      min_hourly_pay: values.pay_type === 'hourly' && values.min_hourly_pay !== '' && values.min_hourly_pay != null
        ? Number(values.min_hourly_pay) : null,
      min_salary: values.pay_type === 'annual' && values.min_salary !== '' && values.min_salary != null
        ? Number(values.min_salary) : null,
      alert_min_hourly_pay: values.alert_min_hourly_pay !== '' && values.alert_min_hourly_pay != null
        ? Number(values.alert_min_hourly_pay) : null,
      alert_min_salary: values.alert_min_salary !== '' && values.alert_min_salary != null
        ? Number(values.alert_min_salary) : null,
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
          <span>Preferred search location</span>
          <input
            value={values.location}
            onChange={(event) => setField('location', event.target.value)}
            required={requireLocation}
            placeholder="Calgary, Alberta or Remote"
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
            <option value="">Any job type</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
          </select>
        </label>

        <label className="field">
          <span>Work arrangement</span>
          <select value={values.work_mode ?? ''} onChange={(event) => setField('work_mode', event.target.value)}>
            <option value="">Any arrangement</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">Onsite</option>
          </select>
        </label>

        <label className="field">
          <span>Target pay period</span>
          <select value={values.pay_type ?? ''} onChange={(event) => setField('pay_type', event.target.value)}>
            <option value="">No pay target</option>
            <option value="hourly">Hourly</option>
            <option value="annual">Annual</option>
          </select>
        </label>

        {values.pay_type && (
          <label className="field">
            <span>{values.pay_type === 'hourly' ? 'Minimum hourly pay' : 'Minimum annual salary'}</span>
            <input type="number" min="0" step="0.01"
              value={values.pay_type === 'hourly' ? values.min_hourly_pay ?? '' : values.min_salary ?? ''}
              onChange={(event) => setField(values.pay_type === 'hourly' ? 'min_hourly_pay' : 'min_salary', event.target.value)}
              placeholder={values.pay_type === 'hourly' ? 'e.g. 40' : 'e.g. 80000'} />
          </label>
        )}
        <p className="muted field--wide">Jobs without comparable pay remain visible. Pay comparisons use 2,080 hours per year in the listing’s currency.</p>

        <label className="field">
          <span>Pay alert: minimum hourly pay (optional)</span>
          <input type="number" min="0" step="0.01" value={values.alert_min_hourly_pay ?? ''}
            onChange={(event) => setValues((current) => ({ ...current,
              alert_min_hourly_pay: event.target.value,
              ...(event.target.value !== '' ? { alert_min_salary: '' } : {}),
            }))} placeholder="e.g. 50" />
        </label>
        <label className="field">
          <span>Pay alert: minimum annual salary (optional)</span>
          <input type="number" min="0" step="0.01" value={values.alert_min_salary ?? ''}
            onChange={(event) => setValues((current) => ({ ...current,
              alert_min_salary: event.target.value,
              ...(event.target.value !== '' ? { alert_min_hourly_pay: '' } : {}),
            }))} placeholder="e.g. 100000" />
        </label>
        <p className="muted field--wide">Set one pay alert threshold to receive a separate notification for new scheduled matches with reported pay above it.</p>

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
          <span>Years of relevant experience (optional)</span>
          <input
            type="number"
            min="0"
            max="50"
            step="1"
            value={values.years_experience ?? ''}
            onChange={(event) => setField('years_experience', event.target.value)}
            placeholder="e.g. 3"
          />
        </label>

        {values.years_experience !== '' && values.years_experience != null && (
          <label className="field">
            <span>How broad should the match be?</span>
            <select
              value={values.experience_range}
              onChange={(event) => setField('experience_range', Number(event.target.value))}
            >
              <option value={1}>Focused (±1 year)</option>
              <option value={2}>Balanced (±2 years)</option>
              <option value={4}>Broad (±4 years)</option>
            </select>
          </label>
        )}

        {values.years_experience !== '' && values.years_experience != null && (
          <p className="muted field--wide">
            Prioritizes jobs asking for roughly {Math.max(0, Number(values.years_experience) - Number(values.experience_range))}–{Number(values.years_experience) + Number(values.experience_range)} years. Other jobs still appear.
          </p>
        )}

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
        <label className="checkbox">
          <input type="checkbox" checked={values.notify_weekly_digest}
            onChange={(event) => setField('notify_weekly_digest', event.target.checked)} />
          <span>Send a weekly digest of matches</span>
        </label>
      </div>

      <button type="submit" className="btn btn--primary" disabled={submitting}>
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}
