import client from './client'

export async function listTrackedCompanies(profileId) {
  const { data } = await client.get('/tracked-companies', {
    params: profileId ? { profile_id: profileId } : undefined,
  })
  return data
}

export async function addTrackedCompany(payload) {
  const { data } = await client.post('/tracked-companies', payload)
  return data
}

export async function trackedCompanyJobs(id) {
  const { data } = await client.get(`/tracked-companies/${id}/jobs`)
  return data
}

export async function deleteTrackedCompany(id) {
  await client.delete(`/tracked-companies/${id}`)
}