import { Link, useLocation } from 'react-router-dom';

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

const Sidebar = () => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  return (
    <aside className="w-60 min-h-screen bg-[#12122a] border-r border-white/10 p-5 flex flex-col gap-2 shrink-0">
      <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2 px-2">
        Navigation
      </p>

      <nav className="flex flex-col gap-1 mb-6">
        {navLinks.map(({ to, label, icon }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {user?.role === 'admin' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2 px-2">
            Admin Panel
          </p>
          <nav className="flex flex-col gap-1">
            {adminLinks.map(({ to, label, icon }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{icon}</span>
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;