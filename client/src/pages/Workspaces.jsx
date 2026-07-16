import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api.js';
import WorkspaceCard from '../components/WorkspaceCard.jsx';
import CreateWorkspaceForm from '../components/CreateWorkspaceForm.jsx';

const Workspaces = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [workspaceForm, setWorkspaceForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const canManageWorkspace = user?.role === 'admin' || user?.role === 'manager';

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

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      setCreateError('');
      const { data } = await api.post('/workspace/create', workspaceForm);
      setWorkspaces((prev) => [...prev, data.workspace]);
      setWorkspaceForm({ name: '', description: '' });
    } catch (error) {
      setCreateError(error.response?.data?.message || 'Failed to create workspace');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-white/40 text-sm">
        Loading workspaces...
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
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Workspaces</h1>
        <p className="text-sm text-white/40 mt-1">
          {workspaces.length === 0
            ? 'No workspaces yet.'
            : `${workspaces.length} workspace${workspaces.length !== 1 ? 's' : ''} available`}
        </p>
      </div>

      {/* Create form — only for admin / manager */}
      {canManageWorkspace && (
        <CreateWorkspaceForm
          form={workspaceForm}
          setForm={setWorkspaceForm}
          onSubmit={handleCreateWorkspace}
          loading={creating}
          error={createError}
        />
      )}

      {/* Workspace grid */}
      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">🗂️</div>
          <p className="text-white/40 text-sm">
            {canManageWorkspace
              ? 'Create your first workspace above to get started.'
              : 'You have not been added to any workspace yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace._id}
              workspace={workspace}
              onClick={() => navigate(`/workspaces/${workspace._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Workspaces;
