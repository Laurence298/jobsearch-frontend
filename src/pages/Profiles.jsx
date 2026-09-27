import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { deleteProfile, listProfiles } from '../api/profiles.js'
import { apiErrorMessage } from '../api/client.js'
import ProfileCard from '../components/ProfileCard.jsx'
import { useToast } from '../components/Toast.jsx'

export default function Profiles() {
  const queryClient = useQueryClient()
  const { notify } = useToast()

  const profilesQuery = useQuery({
    queryKey: ['profiles'],
    queryFn: listProfiles,
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteProfile(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: ['profile', id] })
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      notify('Profile deleted', 'success')
    },
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  function handleDelete(profile) {
    if (window.confirm(`Delete "${profile.name}" and all of its jobs?`)) {
      deleteMutation.mutate(profile.id)
    }
  }

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <h1>Job profiles</h1>
          <p className="muted">
            Each profile has its own resume, keywords, search settings, and jobs.
          </p>
        </div>
        <Link className="btn btn--primary" to="/profiles/new">
          New profile
        </Link>
      </header>

      {profilesQuery.isLoading && <div className="page-loading">Loading profiles…</div>}

      {profilesQuery.isError && (
        <div className="alert alert--error">{apiErrorMessage(profilesQuery.error)}</div>
      )}

      {profilesQuery.isSuccess && profilesQuery.data.length === 0 && (
        <div className="card empty-state">
          <h3>No profiles yet</h3>
          <p className="muted">
            Create a profile to upload a resume, generate keywords, and search jobs.
          </p>
          <Link className="btn btn--primary" to="/profiles/new">
            Create your first profile
          </Link>
        </div>
      )}

      {profilesQuery.isSuccess && profilesQuery.data.length > 0 && (
        <div className="grid">
          {profilesQuery.data.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onDelete={handleDelete}
              deleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
