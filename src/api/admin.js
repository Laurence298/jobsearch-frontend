import client from './client'

export async function getAdminStats() {
  const { data } = await client.get('/admin/stats')
  return data
}

export async function listAllowedEmails() {
  const { data } = await client.get('/admin/allowed-emails')
  return data
}

export async function addAllowedEmail(email) {
  const { data } = await client.post('/admin/allowed-emails', { email })
  return data
}

export async function deleteAllowedEmail(email) {
  await client.delete(`/admin/allowed-emails/${encodeURIComponent(email)}`)
}