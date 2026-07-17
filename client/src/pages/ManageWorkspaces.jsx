import { useEffect, useState } from 'react';
import api from '../api/api.js';

const ManageWorkspaces = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/admin/workspaces');
      setWorkspaces(data.workspaces);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch workspaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleDeleteWorkspace = async (workspaceId, workspaceName) => {
    const confirmDelete = window.confirm(
      `WARNING: Are you sure you want to delete workspace "${workspaceName}"? This will permanently delete all tasks associated with this workspace.`
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(workspaceId);
      await api.delete(`/workspace/${workspaceId}`);
      setWorkspaces((prev) => prev.filter((ws) => ws.id !== workspaceId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete workspace');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-white/40 text-sm">
        Loading workspaces database...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Manage Workspaces 📁</h1>
        <p className="text-sm text-white/40 mt-1">
          Monitor active workspaces, members, tasks, and delete workspaces when necessary.
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm max-w-md">
          {error}
        </div>
      )}

      {/* Workspaces Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-white/30 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Workspace Name</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">Members</th>
                <th className="px-6 py-4">Tasks</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-white/80">
              {workspaces.map((ws) => {
                const isDeleting = deletingId === ws.id;

                return (
                  <tr key={ws.id} className="hover:bg-white/5 transition-colors duration-150">
                    {/* Name */}
                    <td className="px-6 py-4 font-semibold text-white">{ws.name}</td>

                    {/* Owner */}
                    <td className="px-6 py-4">
                      <div className="text-white/80">{ws.owner?.name || '—'}</div>
                      <div className="text-xs text-white/40">{ws.owner?.email || ''}</div>
                    </td>

                    {/* Members Count */}
                    <td className="px-6 py-4 text-white/60">
                      <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs">
                        👥 {ws.memberCount ?? 0}
                      </span>
                    </td>

                    {/* Tasks Count */}
                    <td className="px-6 py-4 text-white/60">
                      <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs">
                        📋 {ws.taskCount ?? 0}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 text-white/40">
                      {ws.createdAt
                        ? new Date(ws.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteWorkspace(ws.id, ws.name)}
                        disabled={isDeleting}
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition cursor-pointer"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {workspaces.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center text-white/40">
            <span className="text-4xl mb-3">📁</span>
            <p className="text-sm">No workspaces currently exist in the system.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageWorkspaces;
