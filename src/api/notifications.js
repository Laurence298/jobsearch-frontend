import client from './client'

export async function listNotifications(unreadOnly = false, channel = '') {
  const { data } = await client.get('/notifications', {
    params: {
      ...(unreadOnly ? { unread_only: true } : {}),
      ...(channel ? { channel } : {}),
    },
  })
  return data
}

export async function unreadCount(channel = '') {
  const { data } = await client.get('/notifications/unread-count', {
    params: channel ? { channel } : undefined,
  })
  return data
}

export async function markRead(id) {
  const { data } = await client.post(`/notifications/${id}/read`)
  return data
}

export async function markAllRead() {
  await client.post('/notifications/read-all')
}

export async function deleteNotification(id) {
  await client.delete(`/notifications/${id}`)
}
