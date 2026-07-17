import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import api from '../api/api.js';

const Layout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const syncUserSession = async () => {
      try {
        const { data } = await api.get('/auth/me');
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');

        // Sync local storage if data changes
        if (
          localUser.role !== data.user.role ||
          localUser.name !== data.user.name ||
          localUser.email !== data.user.email
        ) {
          localStorage.setItem('user', JSON.stringify(data.user));
          window.location.reload(); // Force full reload to update role-based routing elements
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login', { replace: true });
      }
    };

    syncUserSession();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0e0e1a] text-white">
      <Navbar />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;