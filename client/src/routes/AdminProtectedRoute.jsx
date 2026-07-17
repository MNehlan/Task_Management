import { Navigate, Outlet } from 'react-router-dom';

const AdminProtectedRoute = () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

export default AdminProtectedRoute;
