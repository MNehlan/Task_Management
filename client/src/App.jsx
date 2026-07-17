import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard.jsx';
import Register from './pages/Register.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import PublicRoute from './routes/PublicRoute.jsx';
import AdminProtectedRoute from './routes/AdminProtectedRoute.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ManageUsers from './pages/ManageUsers.jsx';
import ManageWorkspaces from './pages/ManageWorkspaces.jsx';
import ManageTasks from './pages/ManageTasks.jsx';
import Workspaces from './pages/Workspaces.jsx';
import WorkspaceDetails from './pages/WorkspaceDetails.jsx';
import Layout from './components/Layout.jsx';

const App = () => {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
};

export default App;
