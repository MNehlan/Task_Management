import { useEffect, useState } from 'react';
import api from '../api/api.js';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/workspace/dashboard');
      setStats(data.stats);
    } catch (error) {
      setError(
        error.response?.data?.message ||
        'No data found'
      );
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <div>Loading..</div>
  }

  if (error) {
    return <div>{error}</div>
  }

  const cards = [
    { title: 'Workspaces', value: stats.workspaces },
    { title: 'Tasks', value: stats.tasks },
    { title: 'Todo', value: stats.todo },
    { title: 'Review', value: stats.review },
    { title: 'In Progress', value: stats.inProgress },
    { title: 'Completed', value: stats.completed },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-xl shadow-md p-6 border"
          >
            <h2 className="text-gray-500 text-sm font-medium">
              {card.title}
            </h2>

            <p className="text-3xl font-bold mt-2">
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
