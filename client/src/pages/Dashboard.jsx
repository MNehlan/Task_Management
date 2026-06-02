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

  return (
    <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
      <div>
        <p>Workspaces</p>
        <p>{stats.workspaces}</p>
      </div>

      <div>
        <p>Tasks</p>
        <p>{stats.tasks}</p>
      </div>
      <div>
        <p>Todo</p>
        <p>{stats.todo}</p>
      </div>
      <div>
        <p>Review</p>
        <p>{stats.review}</p>
      </div>
      <div>
        <p>In progress</p>
        <p>{stats.inProgress}</p>
      </div>
      <div>
        <p>Completed</p>
        <p>{stats.completed}</p>
      </div>

    </div>
  );
};

export default Dashboard;
