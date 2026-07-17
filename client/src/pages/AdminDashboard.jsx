import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api.js';

const systemStatCards = [
  { key: 'users', label: 'Total Users', icon: '👤', color: 'from-blue-600/20 to-blue-600/5', border: 'border-blue-500/30', text: 'text-blue-400', link: '/admin/users' },
  { key: 'workspaces', label: 'Workspaces', icon: '🗂️', color: 'from-violet-600/20 to-violet-600/5', border: 'border-violet-500/30', text: 'text-violet-400', link: '/admin/workspaces' },
  { key: 'tasks', label: 'Total Tasks', icon: '📋', color: 'from-emerald-600/20 to-emerald-600/5', border: 'border-emerald-500/30', text: 'text-emerald-400', link: '/admin/tasks' },
];

const taskStatCards = [
  { key: 'todo', label: 'Todo', icon: '⏳', color: 'from-yellow-600/20 to-yellow-600/5', border: 'border-yellow-500/30', text: 'text-yellow-400' },
  { key: 'inProgress', label: 'In Progress', icon: '🔄', color: 'from-orange-600/20 to-orange-600/5', border: 'border-orange-500/30', text: 'text-orange-400' },
  { key: 'review', label: 'Review', icon: '🔍', color: 'from-cyan-600/20 to-cyan-600/5', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  { key: 'completed', label: 'Completed', icon: '✅', color: 'from-green-600/20 to-green-600/5', border: 'border-green-500/30', text: 'text-green-400' },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/admin');
      setStats(data.stats);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load system statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-white/40 text-sm">
        Loading system statistics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm max-w-md mx-auto">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">System Admin Overview 🛡️</h1>
        <p className="text-sm text-white/40 mt-1">
          Monitor users, workspaces, and system tasks statistics.
        </p>
      </div>

      {/* System Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-white/80 mb-4">Core System Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {systemStatCards.map(({ key, label, icon, color, border, text, link }) => (
            <Link
              key={key}
              to={link}
              className={`block bg-linear-to-br ${color} border ${border} rounded-2xl p-6 backdrop-blur-sm hover:scale-[1.02] hover:shadow-lg hover:shadow-black/30 transition-all duration-200`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{icon}</span>
                <span className={`text-xs font-semibold uppercase tracking-wider ${text}`}>
                  {label}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <p className={`text-4xl font-extrabold ${text}`}>
                  {stats[key] ?? 0}
                </p>
                <span className="text-xs text-white/40 hover:text-white/60 transition underline">
                  Manage →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Task Distribution */}
      <div>
        <h2 className="text-lg font-semibold text-white/80 mb-4">Global Task Distribution</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {taskStatCards.map(({ key, label, icon, color, border, text }) => (
            <div
              key={key}
              className={`bg-linear-to-br ${color} border ${border} rounded-2xl p-6 backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">{icon}</span>
                <span className={`text-xs font-semibold uppercase tracking-wider ${text}`}>
                  {label}
                </span>
              </div>
              <p className={`text-4xl font-extrabold ${text}`}>
                {stats[key] ?? 0}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
