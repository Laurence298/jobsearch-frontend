import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { createProfile } from '../api/profiles.js'
import { apiErrorMessage } from '../api/client.js'
import ProfileForm from '../components/ProfileForm.jsx'
import { useToast } from '../components/Toast.jsx'

export default function ProfileNew() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notify } = useToast()

  const createMutation = useMutation({
    mutationFn: createProfile,
    onSuccess: (profile) => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      notify('Profile created — add a resume and generate keywords', 'success')
      navigate(`/profiles/${profile.id}`, { replace: true })
    },
    onError: (error) => notify(apiErrorMessage(error), 'error'),
  })

  return (
    <div className="page">
      <header className="page__head">
        <div>
          <h1>New profile</h1>
          <p className="muted">
            Step 1 of 3 — set up the search settings. Resume and keywords come next.
          </p>
        </div>
      </header>

      <ProfileForm
        onSubmit={(values) => createMutation.mutate(values)}
        submitLabel="Create profile"
        submitting={createMutation.isPending}
      />
    </div>
  )
}
