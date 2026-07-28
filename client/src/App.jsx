import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import PublicRoute from './routes/PublicRoute.jsx';
// lazy loading routes
const ProtectedRoute = lazy(() => import('./routes/ProtectedRoute.jsx'));
const AdminProtectedRoute = lazy(() => import('./routes/AdminProtectedRoute.jsx'));

// Lazy load page components for Code Splitting & Performance optimization
const Layout = lazy(() => import('./components/Layout.jsx'));
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Workspaces = lazy(() => import('./pages/Workspaces.jsx'));
const WorkspaceDetails = lazy(() => import('./pages/WorkspaceDetails.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const ManageUsers = lazy(() => import('./pages/ManageUsers.jsx'));
const ManageWorkspaces = lazy(() => import('./pages/ManageWorkspaces.jsx'));
const ManageTasks = lazy(() => import('./pages/ManageTasks.jsx'));

// Loading spinner matching TaskFlow dark glassmorphism theme
const LoadingFallback = () => (
  <div className="min-h-screen bg-[#0e0e1a] flex items-center justify-center text-white/40 text-sm">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-t-violet-600 border-white/10 animate-spin" />
      <span className="tracking-wider">Loading...</span>
    </div>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes - Redirect to dashboard if logged in */}
          <Route element={<PublicRoute />}>
            <Route path='/' element={<Home />} />
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route
                path='/dashboard'
                element={<Dashboard />}
              />
              <Route
                path='/workspaces'
                element={<Workspaces />}
              />
              <Route
                path='/workspaces/:workspaceId'
                element={<WorkspaceDetails />}
              />

              {/* Admin Routes */}
              <Route element={<AdminProtectedRoute />}>
                <Route
                  path='/admin/dashboard'
                  element={<AdminDashboard />}
                />
                <Route
                  path='/admin/users'
                  element={<ManageUsers />}
                />
                <Route
                  path='/admin/workspaces'
                  element={<ManageWorkspaces />}
                />
                <Route
                  path='/admin/tasks'
                  element={<ManageTasks />}
                />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
