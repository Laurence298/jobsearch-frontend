import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getAdminStats } from '../api/admin.js'
import { apiErrorMessage } from '../api/client.js'
import { formatDateTime } from '../lib/format.js'

const EMPTY = []

function DataTable({ title, columns, rows, empty = 'No data yet' }) {
  return (
    <section className="section">
      <h2>{title}</h2>
      <div className="card table-wrap">
        {rows.length === 0 ? (
          <p className="muted">{empty}</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id ?? row.keyword ?? row.company ?? row.publisher ?? index}>
                  {columns.map((column) => (
                    <td key={column.key}>{column.render(row)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

export default function Admin() {
  const statsQuery = useQuery({
    queryKey: ['adminStats'],
    queryFn: getAdminStats,
  })

  if (statsQuery.isLoading) {
    return <div className="page-loading">Loading stats…</div>
  }

  if (statsQuery.isError) {
    const forbidden = statsQuery.error?.response?.status === 403
    return (
      <div className="page">
        <div className={`alert ${forbidden ? 'alert--warning' : 'alert--error'}`}>
          {forbidden
            ? 'Your account is not in ADMIN_EMAILS, so the admin dashboard is unavailable.'
            : apiErrorMessage(statsQuery.error)}
        </div>
      </div>
    )
  }

  const stats = statsQuery.data
  const totals = stats.totals ?? {}
  const jobsOverTime = stats.jobs_over_time ?? EMPTY
  const byPublisher = stats.by_publisher ?? EMPTY

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <h1>Admin dashboard</h1>
          <p className="muted">Global activity across all users and profiles.</p>
        </div>
      </header>

      <div className="totals">
        {[
          ['Users', totals.users],
          ['Profiles', totals.profiles],
          ['Resumes', totals.resumes],
          ['Jobs', totals.jobs],
        ].map(([label, value]) => (
          <div className="card total" key={label}>
            <span className="total__value">{value ?? 0}</span>
            <span className="muted">{label}</span>
          </div>
        ))}
      </div>

      <section className="section">
        <h2>Jobs over time</h2>
        <div className="card chart">
          {jobsOverTime.length === 0 ? (
            <p className="muted">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={jobsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#4f7cff" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="section">
        <h2>Jobs by publisher</h2>
        <div className="card chart">
          {byPublisher.length === 0 ? (
            <p className="muted">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byPublisher}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="publisher" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f7cff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <DataTable
        title="Top companies"
        columns={[
          { key: 'company', label: 'Company', render: (row) => row.company },
          { key: 'count', label: 'Jobs', render: (row) => row.count },
        ]}
        rows={stats.top_companies ?? EMPTY}
      />

      <DataTable
        title="Top keywords"
        columns={[
          { key: 'keyword', label: 'Keyword', render: (row) => row.keyword },
          { key: 'count', label: 'Jobs', render: (row) => row.count },
        ]}
        rows={stats.top_keywords ?? EMPTY}
      />

      <DataTable
        title="Top profiles"
        columns={[
          { key: 'name', label: 'Profile', render: (row) => row.name },
          { key: 'user', label: 'User', render: (row) => row.user_email },
          { key: 'jobs', label: 'Jobs', render: (row) => row.jobs },
          {
            key: 'searches',
            label: 'Searches/day',
            render: (row) => row.searches_per_day,
          },
        ]}
        rows={stats.top_profiles ?? EMPTY}
      />

      <DataTable
        title="Recent jobs"
        columns={[
          { key: 'title', label: 'Title', render: (row) => row.title },
          { key: 'company', label: 'Company', render: (row) => row.company },
          { key: 'publisher', label: 'Publisher', render: (row) => row.publisher },
          { key: 'keyword', label: 'Keyword', render: (row) => row.matched_keyword },
          { key: 'profile', label: 'Profile', render: (row) => row.profile_id },
          { key: 'user', label: 'User', render: (row) => row.user_email },
          {
            key: 'created',
            label: 'Added',
            render: (row) => formatDateTime(row.created_at),
          },
        ]}
        rows={stats.recent_jobs ?? EMPTY}
      />

      <DataTable
        title="Users"
        columns={[
          { key: 'email', label: 'Email', render: (row) => row.email },
          { key: 'profiles', label: 'Profiles', render: (row) => row.profiles },
          { key: 'jobs', label: 'Jobs', render: (row) => row.jobs },
          {
            key: 'resume',
            label: 'Has resume',
            render: (row) => (row.has_resume ? 'Yes' : 'No'),
          },
          {
            key: 'created',
            label: 'Joined',
            render: (row) => formatDateTime(row.created_at),
          },
        ]}
        rows={stats.users ?? EMPTY}
      />
    </div>
  )
}
