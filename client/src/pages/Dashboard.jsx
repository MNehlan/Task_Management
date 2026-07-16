import { useEffect, useState } from 'react';
import api from '../api/api.js';

const statCards = [
  { key: 'workspaces', label: 'Workspaces', icon: '🗂️', color: 'from-violet-600/20 to-violet-600/5', border: 'border-violet-500/30', text: 'text-violet-400' },
  { key: 'tasks', label: 'Total Tasks', icon: '📋', color: 'from-blue-600/20 to-blue-600/5', border: 'border-blue-500/30', text: 'text-blue-400' },
  { key: 'todo', label: 'Todo', icon: '⏳', color: 'from-yellow-600/20 to-yellow-600/5', border: 'border-yellow-500/30', text: 'text-yellow-400' },
  { key: 'inProgress', label: 'In Progress', icon: '🔄', color: 'from-orange-600/20 to-orange-600/5', border: 'border-orange-500/30', text: 'text-orange-400' },
  { key: 'review', label: 'Review', icon: '🔍', color: 'from-cyan-600/20 to-cyan-600/5', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  { key: 'completed', label: 'Completed', icon: '✅', color: 'from-green-600/20 to-green-600/5', border: 'border-green-500/30', text: 'text-green-400' },
];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/workspace/dashboard');
      setStats(data.stats);
    } catch (error) {
      setError(error.response?.data?.message || 'No data found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-white/40 text-sm">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm max-w-md">
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : 'Guest'} 👋
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Here&apos;s an overview of your workspace activity.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map(({ key, label, icon, color, border, text }) => (
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
  );
};

export default Dashboard;
