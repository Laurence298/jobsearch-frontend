import client from './client'

export async function listJobs(profileId) {
  const { data } = await client.get('/jobs', {
    params: profileId ? { profile_id: profileId } : undefined,
  })
  return data
}

export async function searchJobs(profileId, options = {}) {
  const { query, date_posted, auto_tailor, publishers } = options
  const { data } = await client.post('/jobs/search', null, {
    params: {
      profile_id: profileId,
      ...(query ? { query } : {}),
      ...(date_posted != null ? { date_posted } : {}),
      ...(auto_tailor != null ? { auto_tailor } : {}),
      ...(publishers != null ? { publishers } : {}),
    },
  })
  return data
}

export async function deleteJob(jobId) {
  await client.delete(`/jobs/${jobId}`)
}

export async function setFeedback(jobId, status) {
  const { data } = await client.post(`/jobs/${jobId}/feedback`, { status })
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