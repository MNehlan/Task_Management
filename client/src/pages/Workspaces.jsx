import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api.js';

const Workspaces = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);

      const { data } = await api.get('/workspace');

      setWorkspaces(data.workspaces);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  if (loading) return <p>Loading...</p>;

  if (error) return <p>{error}</p>;

  if (!workspaces.length) {
    return <p>No workspaces found</p>;
  }

  return (
    <div>
      {workspaces.map((workspace) => (
        <div
          key={workspace._id}
          onClick={() => navigate(`/workspaces/${workspace._id}`)}
        >
          <div key={workspace._id}>
            <h2>{workspace.name}</h2>
            <p>{workspace.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Workspaces;
