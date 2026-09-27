import client from './client'

export async function listJobs(profileId, date, includeNotInterested = false) {
  const { data } = await client.get('/jobs', {
    params: {
      ...(profileId ? { profile_id: profileId } : {}),
      ...(date ? { date } : {}),
      ...(includeNotInterested ? { include_not_interested: true } : {}),
    },
  })
  return data
}

export async function getJob(jobId) {
  const { data } = await client.get(`/jobs/${jobId}`)
  return data
}

export async function listJobDates(profileId, includeNotInterested = false) {
  const { data } = await client.get('/jobs/dates', {
    params: {
      ...(profileId ? { profile_id: profileId } : {}),
      ...(includeNotInterested ? { include_not_interested: true } : {}),
    },
  })
  return data
}

export async function searchJobs(profileId, options = {}) {
  const { query, date_posted, auto_tailor, publishers, min_hourly_pay, min_salary, pay_type, work_mode, job_type } = options
  const { data } = await client.post('/jobs/search', null, {
    params: {
      profile_id: profileId,
      ...(query ? { query } : {}),
      ...(date_posted != null ? { date_posted } : {}),
      ...(auto_tailor != null ? { auto_tailor } : {}),
      ...(publishers != null ? { publishers } : {}),
      ...(min_hourly_pay != null ? { min_hourly_pay } : {}),
      ...(min_salary != null ? { min_salary } : {}),
      ...(pay_type ? { pay_type } : {}),
      ...(work_mode ? { work_mode } : {}),
      ...(job_type ? { job_type } : {}),
    },
  })
  return data
}

export async function unifiedSearch(profileId, { q, location, date_posted, publishers, min_hourly_pay, min_salary, pay_type, work_mode, job_type } = {}) {
  const { data } = await client.get('/jobs/search', {
    params: {
      profile_id: profileId,
      q,
      ...(location ? { location } : {}),
      ...(date_posted != null ? { date_posted } : {}),
      ...(publishers ? { publishers } : {}),
      ...(min_hourly_pay != null ? { min_hourly_pay } : {}),
      ...(min_salary != null ? { min_salary } : {}),
      ...(pay_type ? { pay_type } : {}),
      ...(work_mode ? { work_mode } : {}),
      ...(job_type ? { job_type } : {}),
    },
  })
  return data
}

export async function deleteJob(jobId) {
  await client.delete(`/jobs/${jobId}`)
}

export async function setFeedback(jobId, status, details = {}) {
  const { data } = await client.post(`/jobs/${jobId}/feedback`, { status, ...details })
  return data
}

export async function bulkFeedback(jobIds, status = 'not_interested') {
  const { data } = await client.post('/jobs/feedback/bulk', { job_ids: jobIds, status })
  return data
}

export async function tailorResume(jobId, { resume_id, template } = {}) {
  const { data } = await client.post(`/jobs/${jobId}/tailor`, null, {
    params: {
      ...(resume_id != null ? { resume_id } : {}),
      ...(template ? { template } : {}),
    },
  })
  return data
}

export async function regenerateTailored(jobId, { resume_id, template } = {}) {
  const { data } = await client.post(`/jobs/${jobId}/tailored/regenerate`, null, {
    params: {
      ...(resume_id != null ? { resume_id } : {}),
      ...(template ? { template } : {}),
    },
  })
  return data
}

export async function getTailoredResume(jobId) {
  const { data } = await client.get(`/jobs/${jobId}/tailored`)
  return data
}

export async function getTailoredData(jobId) {
  const { data } = await client.get(`/jobs/${jobId}/tailored/data`)
  return data
}

export async function updateTailoredData(jobId, payload) {
  const { data } = await client.put(`/jobs/${jobId}/tailored/data`, payload)
  return data
}

export async function getTailoredPdf(jobId) {
  const res = await client.get(`/jobs/${jobId}/tailored/pdf`, {
    responseType: 'blob',
  })
  const type = res.headers['content-type'] || ''
  if (type.includes('application/pdf')) {
    return { pdf: true, blob: res.data }
  }
  const text = await res.data.text()
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    parsed = { pdf_available: false, reason: 'Unexpected response', text }
  }
  return { pdf: false, data: parsed }
}
