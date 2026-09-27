# Frontend Implementation Plan

Status of the React frontend (`JobTracker`) against the backend contract in
[`JobTrackerServer/docs/FRONTEND_INTEGRATION.md`](../JobTrackerServer/docs/FRONTEND_INTEGRATION.md).

Legend: [x] implemented · [ ] planned/deferred

---

## Progress

### Auth
- [x] Register (`POST /auth/register`) with invite-only 403 messaging via `apiErrorMessage`
- [x] Login (`POST /auth/login`, form-urlencoded)
- [x] `GET /auth/me` session restore on load
- [x] JWT in `localStorage`, Bearer request interceptor, 401 → `/login` response interceptor
- [x] `<RequireAuth>` route guard

### Profiles
- [x] CRUD (`POST/GET/PUT/DELETE /profiles`)
- [x] Resume upload (`text`/`.txt` file + `label`), list, delete
- [x] Keywords: generate + add/remove (editable chips)
- [x] Skills: extract-from-resume + add/remove (editable chips)
- [x] Education: extract-from-resume + add/remove (editable chips via replace-all)
- [x] Full `JobProfileIn` fields in the form — `date_posted`, `auto_tailor`,
      `notify_new_jobs`, `search_hours` (hourly 8am–9pm checkboxes), `timezone`,
      `searches_per_day`
- [x] Tracked companies: add/list/remove + view open roles (ATS boards)

### Jobs
- [x] List (`GET /jobs?profile_id=`) grouped by save date — `GET /jobs/dates` menu +
      `GET /jobs?date=YYYY-MM-DD`; default to all dates so earlier jobs aren't hidden
- [x] Search (`POST /jobs/search`) with query + `date_posted`/`auto_tailor`/`publishers`
      options, budget-exhausted notice, corrected `new_jobs` count
- [x] Unified search (`GET /jobs/search?q=&location=`) with comma/“or”-separated
      role terms searched independently; shows returned matches (including older saved
      jobs) and budget status separately from the saved-by-date view
- [x] Delete job (`DELETE /jobs/{id}`) with confirmation
- [x] Feedback loop (`POST /jobs/{id}/feedback`) — saved / applied / not_interested +
      status display
- [x] `JobOut` rendering fixes: `posted_at` (was broken `created_at`), `salary`,
      `matched_skills` chips, `source` badge, removed non-existent `description`/`is_remote`

### Tailored resumes
- [x] Tailor on demand (`POST /jobs/{id}/tailor`) with template + multi-resume select
- [x] Regenerate (destructive, confirmed) (`POST /jobs/{id}/tailored/regenerate`)
- [x] PDF preview + download (`GET /jobs/{id}/tailored/pdf`) with graceful text fallback
- [x] Structured edit form (`GET/PUT /jobs/{id}/tailored/data`) — dumb-simple editor
- [x] `is_user_edited` "AI-tailored" vs "edited by you" label
- [x] Async auto-tailor grace period: poll `GET /jobs/{id}/tailored` after a search
      (it briefly 404s while the background pass finishes) before offering manual tailor

### Notifications
- [x] Bell in the header with unread count (30s poll)
- [x] Dropdown list, mark-read on open, mark-all-read, per-item delete

### Admin
- Backend-only: served server-rendered at `/dashboard` (HTTP Basic). The frontend does
  **not** build an admin route/UI — removed `/admin` route, `Admin` page, `RequireAdmin`,
  and `api/admin.js`.

---

## Verification

```bash
npm run lint      # oxlint (warnings only; no errors)
npm run build     # vite build passes
```

Dev server binds to `0.0.0.0` (`vite.config.js` `server.host: true`) so it is
reachable from other devices on the network. Use same-origin `/api` for browser
requests; set `VITE_DEV_API_TARGET` to the backend's LAN address when developing
against a remote server. The Docker frontend proxies `/api` to `jobtracker-app:8000`.

---

## Deferred / follow-ups (not blocking)

- Multi-step create wizard (`/profiles/new` currently shows "Step 1 of 3")
- Per-item delete in profile/job lists is present; bulk actions not needed
- Resume PDF/DOCX parsing stays client-side until backend support lands
- Verify the Docker `/api` proxy end-to-end after redeployment
