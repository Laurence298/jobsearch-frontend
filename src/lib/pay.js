export function salaryLabel(job) {
  if (job.salary) return job.salary
  const amounts = [job.min_salary, job.max_salary]
    .filter((value) => value != null)
    .map((value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 }))
  if (amounts.length === 0) return 'Pay not listed'
  return `${job.salary_currency ? `${job.salary_currency} ` : ''}${[...new Set(amounts)].join('–')}${job.salary_period ? ` / ${job.salary_period.toLowerCase()}` : ''}`
}

export function payNote(job) {
  if (job.salary_data_missing || (!job.salary && job.min_salary == null && job.max_salary == null)) {
    return 'Pay not reported by this listing; not $0.'
  }
  if (job.min_salary == null && job.max_salary == null) {
    return 'Pay provided as text; it could not be compared with your target.'
  }
  return null
}
