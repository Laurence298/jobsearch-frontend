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

export async function previewResume(resumeText) {
  const { data } = await client.post('/profiles/resume-preview', { resume_text: resumeText })
  return data
}

export async function createProfileWithResume(profile, resume) {
  const { data } = await client.post('/profiles/with-resume', {
    profile,
    resume_text: resume.text,
    filename: resume.filename,
  })
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

export async function uploadResume(id, { text, file, label }) {
  const form = new FormData()
  if (file) {
    form.append('file', file)
  } else {
    form.append('text', text)
  }
  if (label) {
    form.append('label', label)
  }
  const { data } = await client.post(`/profiles/${id}/resume`, form)
  return data
}

export async function deleteResume(profileId, resumeId) {
  await client.delete(`/profiles/${profileId}/resumes/${resumeId}`)
}

export async function generateKeywords(id) {
  const { data } = await client.post(`/profiles/${id}/keywords`)
  return data
}

export async function suggestKeywords(id) {
  const { data } = await client.post(`/profiles/${id}/keywords/suggestions`)
  return data
}

export async function setKeywords(id, items) {
  const { data } = await client.put(`/profiles/${id}/keywords`, { items })
  return data
}

export async function addKeyword(id, keyword) {
  const { data } = await client.post(`/profiles/${id}/keywords/add`, { keyword })
  return data
}

export async function removeKeyword(id, keyword) {
  const { data } = await client.delete(`/profiles/${id}/keywords`, {
    params: { keyword },
  })
  return data
}

export async function generateSkills(id) {
  const { data } = await client.post(`/profiles/${id}/skills`)
  return data
}

export async function setSkills(id, items) {
  const { data } = await client.put(`/profiles/${id}/skills`, { items })
  return data
}

export async function addSkill(id, skill) {
  const { data } = await client.post(`/profiles/${id}/skills/add`, { skill })
  return data
}

export async function removeSkill(id, skill) {
  const { data } = await client.delete(`/profiles/${id}/skills`, {
    params: { skill },
  })
  return data
}

export async function generateEducation(id) {
  const { data } = await client.post(`/profiles/${id}/education`)
  return data
}

export async function setEducation(id, items) {
  const { data } = await client.put(`/profiles/${id}/education`, { items })
  return data
}
