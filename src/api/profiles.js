import client from './client'

export async function listProfiles() {
  const { data } = await client.get('/profiles')
  return data
}

export async function getProfile(id) {
  const { data } = await client.get(`/profiles/${id}`)
  return data
}

export async function createProfile(payload) {
  const { data } = await client.post('/profiles', payload)
  return data
}

export async function updateProfile(id, payload) {
  const { data } = await client.put(`/profiles/${id}`, payload)
  return data
}

export async function deleteProfile(id) {
  await client.delete(`/profiles/${id}`)
}

export async function listResumes(id) {
  const { data } = await client.get(`/profiles/${id}/resumes`)
  return data
}

export async function uploadResume(id, { text, file }) {
  const form = new FormData()
  if (file) {
    form.append('file', file)
  } else {
    form.append('text', text)
  }
  const { data } = await client.post(`/profiles/${id}/resume`, form)
  return data
}

export async function generateKeywords(id) {
  const { data } = await client.post(`/profiles/${id}/keywords`)
  return data
}
