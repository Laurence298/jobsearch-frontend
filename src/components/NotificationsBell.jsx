import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  deleteNotification,
  listNotifications,
  markAllRead,
  markRead,
  unreadCount,
} from '../api/notifications.js'
import { formatDateTime } from '../lib/format.js'

export default function NotificationsBell() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const unreadQuery = useQuery({
    queryKey: ['notificationsUnread'],
    queryFn: unreadCount,
    refetchInterval: 30_000,
  })

  const listQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => listNotifications(false),
    enabled: open,
  })

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
    queryClient.invalidateQueries({ queryKey: ['notificationsUnread'] })
  }

  const markReadMutation = useMutation({
    mutationFn: (id) => markRead(id),
    onSuccess: refresh,
  })

  const markAllMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: refresh,
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteNotification(id),
    onSuccess: refresh,
  })

  const unread = unreadQuery.data?.unread ?? 0

  return (
    <div className="notif">
      <button
        type="button"
        className="btn btn--ghost notif__bell"
        onClick={() => setOpen((current) => !current)}
        aria-label="Notifications"
      >
        <span>Notifications</span>
        {unread > 0 && <span className="notif__count">{unread}</span>}
      </button>

      {open && (
        <div className="notif__panel card">
          <div className="notif__head">
            <strong>Notifications</strong>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
            >
              Mark all read
            </button>
          </div>

          {listQuery.isLoading && <p className="muted">Loading…</p>}

          {listQuery.isSuccess && listQuery.data.length === 0 && (
            <p className="muted">No notifications.</p>
          )}

          <ul className="notif__list">
            {listQuery.data?.map((notification) => (
              <li
                key={notification.id}
                className={`notif__item ${notification.is_read ? '' : 'notif__item--unread'}`}
              >
                <Link
                  to={`/profiles/${notification.profile_id}/jobs`}
                  onClick={() => {
                    if (!notification.is_read) markReadMutation.mutate(notification.id)
                    setOpen(false)
                  }}
                >
                  <strong>{notification.title}</strong>
                  {notification.body ? <p className="muted">{notification.body}</p> : null}
                  <small className="muted">
                    {formatDateTime(notification.created_at)} · {notification.job_count} job(s)
                  </small>
                </Link>
                <button
                  type="button"
                  className="notif__delete"
                  aria-label="Delete notification"
                  onClick={() => deleteMutation.mutate(notification.id)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}