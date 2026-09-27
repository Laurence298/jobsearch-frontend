import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from './auth/RequireAuth.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Profiles from './pages/Profiles.jsx'
import ProfileNew from './pages/ProfileNew.jsx'
import ProfileDetail from './pages/ProfileDetail.jsx'
import ProfileJobs from './pages/ProfileJobs.jsx'
import JobDetail from './pages/JobDetail.jsx'
import NotFound from './pages/NotFound.jsx'

const Admin = lazy(() => import('./pages/Admin.jsx'))

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/profiles" replace />} />
        <Route path="/profiles" element={<Profiles />} />
        <Route path="/profiles/new" element={<ProfileNew />} />
        <Route path="/profiles/:id" element={<ProfileDetail />} />
        <Route path="/profiles/:id/jobs" element={<ProfileJobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<div className="page-loading">Loading dashboard…</div>}>
              <Admin />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
