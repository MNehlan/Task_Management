import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/workspaces', label: 'Workspaces', icon: '🗂️' },
];

const adminLinks = [
  { to: '/admin/dashboard', label: 'System Overview', icon: '🛡️' },
  { to: '/admin/users', label: 'Manage Users', icon: '👥' },
  { to: '/admin/workspaces', label: 'Manage Workspaces', icon: '📁' },
  { to: '/admin/tasks', label: 'Manage Tasks', icon: '📋' },
];

const Navbar = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <nav className="h-16 bg-[#1a1a2e] border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg hover:bg-white/5 md:hidden text-white cursor-pointer text-lg leading-none"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
        <h1 className="font-bold text-lg text-white tracking-wide">
          <Link to="/dashboard" onClick={() => setMenuOpen(false)}>✅ TaskFlow</Link>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Avatar + name */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
          <span className="text-sm text-white/70 hidden sm:block">{user?.name}</span>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-1.5 rounded-lg border border-red-500/40 text-red-400 text-sm hover:bg-red-500/10 transition cursor-pointer"
        >
          Logout
        </button>
      </div>

      {/* Mobile Navigation Dropdown Overlay */}
      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-[#12122a] border-b border-white/10 p-4 md:hidden flex flex-col gap-4 z-40 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1.5 px-2">
              Navigation
            </p>
            {navLinks.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition"
              >
                <span>{icon}</span>
                {label}
              </Link>
            ))}
          </div>

          {user?.role === 'admin' && (
            <div className="flex flex-col gap-1 border-t border-white/5 pt-3">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1.5 px-2">
                Admin Panel
              </p>
              {adminLinks.map(({ to, label, icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition"
                >
                  <span>{icon}</span>
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;