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
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Workspaces
      </h1>

      {canManageWorkspace && (
        <section className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Create Workspace
          </h2>

          {createError && (
            <p className="text-red-500 mb-4">
              {createError}
            </p>
          )}

          <form
            onSubmit={handleCreateWorkspace}
            className="space-y-4"
          >
            <input
              type="text"
              name="name"
              placeholder="Workspace Name"
              value={workspaceForm.name}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
            />

            <textarea
              name="description"
              placeholder="Workspace Description"
              value={workspaceForm.description}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
              rows="4"
            />

            <button
              type="submit"
              disabled={creating}
              className="
                bg-blue-600
                text-white
                px-4
                py-2
                rounded-lg
                hover:bg-blue-700
                transition
                disabled:opacity-50
              "
            >
              {creating
                ? 'Creating...'
                : 'Create Workspace'}
            </button>
          </form>
        </section>
      )}

      {workspaces.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-500">
            No workspaces found
          </p>
        </div>
      ) : (
        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-2
            lg:grid-cols-3
            gap-6
          "
        >
          {workspaces.map((workspace) => (
            <div
              key={workspace._id}
              onClick={() =>
                navigate(
                  `/workspaces/${workspace._id}`
                )
              }
              className="
                bg-white
                rounded-xl
                shadow-md
                p-5
                cursor-pointer
                hover:shadow-lg
                transition
              "
            >
              <h2 className="text-xl font-semibold mb-2">
                {workspace.name}
              </h2>

              <p className="text-gray-600">
                {workspace.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Workspaces;
