import client from './client'

export async function listJobs(profileId) {
  const { data } = await client.get('/jobs', {
    params: profileId ? { profile_id: profileId } : undefined,
  })
  return data
}

export async function searchJobs(profileId, query) {
  const { data } = await client.post('/jobs/search', null, {
    params: { profile_id: profileId, ...(query ? { query } : {}) },
  })
  return data
}

export async function tailorResume(jobId) {
  const { data } = await client.post(`/jobs/${jobId}/tailor`)
  return data
}
