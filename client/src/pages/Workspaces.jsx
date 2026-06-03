import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api.js';

const Workspaces = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [workspaceForm, setWorkspaceForm] = useState({
    name: '',
    description: '',
  });

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const user = JSON.parse(
    localStorage.getItem('user') || 'null'
  );
  
  const canManageWorkspace =
    user?.role === 'admin' ||
    user?.role === 'manager'

  const handleChange = (e) => {
    setWorkspaceForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();

    try {
      setCreating(true);
      setCreateError('');

      await api.post(
        '/workspace/create',
        workspaceForm
      );

      setWorkspaceForm({
        name: '',
        description: '',
      });

      await fetchWorkspaces();
    } catch (error) {
      setCreateError(
        error.response?.data?.message ||
        'Failed to create workspace'
      );
    } finally {
      setCreating(false);
    }
  };


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

  return (
    <div>
      {canManageWorkspace && (
        <section>
          <h2>Create Workspace</h2>

          {createError && (
            <p>{createError}</p>
          )}

          <form onSubmit={handleCreateWorkspace}>
            <input
              type="text"
              name="name"
              placeholder="Workspace Name"
              value={workspaceForm.name}
              onChange={handleChange}
            />

            <textarea
              name="description"
              placeholder="Workspace Description"
              value={workspaceForm.description}
              onChange={handleChange}
            />

            <button
              type="submit"
              disabled={creating}
            >
              {creating
                ? 'Creating...'
                : 'Create Workspace'}
            </button>
          </form>
        </section>
      )}
      <div>
        {workspaces.length === 0 ? (
          <p>No workspaces found</p>
        ) :
          (
            workspaces.map((workspace) => (
              <div
                key={workspace._id}
                onClick={() => navigate(`/workspaces/${workspace._id}`)}
              >
                <h2>{workspace.name}</h2>
                <p>{workspace.description}</p>
              </div>
            ))
          )
        }
      </div>
    </div>
  );
};

export default Workspaces;
