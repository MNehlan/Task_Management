import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard.jsx';
import Register from './pages/Register.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import Workspaces from './pages/Workspaces.jsx';
import WorkspaceDetails from './pages/WorkspaceDetails.jsx';
import Layout from './components/Layout.jsx';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path='/login'
          element={<Login />}
        />
        <Route
          path='/register'
          element={<Register />}
        />
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
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
