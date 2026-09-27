import client from './client'

export async function getAdminStats() {
  const { data } = await client.get('/admin/stats')
  return data
}
