import { useEffect, useState } from 'react';
import api from '../api/api.js';
import Modal from '../components/Modal.jsx';

const ManageWorkspaces = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Detail Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [workspaceDetails, setWorkspaceDetails] = useState(null);

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

  const handleViewWorkspace = async (workspaceId) => {
    try {
      setModalOpen(true);
      setModalLoading(true);
      setWorkspaceDetails(null);
      const { data } = await api.get(`/admin/workspaces/${workspaceId}`);
      setWorkspaceDetails(data.workspace);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load workspace details');
      setModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

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
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewWorkspace(ws.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 transition cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteWorkspace(ws.id, ws.name)}
                          disabled={isDeleting}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition cursor-pointer"
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
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

      {/* Workspace Details Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={workspaceDetails ? `Workspace: ${workspaceDetails.name}` : 'Loading details...'}
      >
        {modalLoading ? (
          <div className="text-center text-white/40 py-8 text-sm">Fetching workspace details...</div>
        ) : workspaceDetails ? (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {/* Description */}
            <div>
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Description</h3>
              <p className="text-sm text-white/80 bg-white/5 border border-white/10 p-3 rounded-xl leading-relaxed">
                {workspaceDetails.description || 'No description provided.'}
              </p>
            </div>

            {/* Owner Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Owner</h3>
                <p className="text-sm text-white font-medium">{workspaceDetails.owner?.name || '—'}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Owner Email</h3>
                <p className="text-sm text-white/60 truncate">{workspaceDetails.owner?.email || '—'}</p>
              </div>
            </div>

            {/* Members Section */}
            <div>
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                Members ({workspaceDetails.members?.length ?? 0})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {workspaceDetails.members?.map((m) => (
                  <div key={m.id} className="flex items-center justify-between bg-white/5 border border-white/10 p-2.5 rounded-xl text-xs">
                    <div>
                      <p className="font-semibold text-white">{m.name}</p>
                      <p className="text-white/40">{m.email}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] uppercase text-white/60">
                      {m.role}
                    </span>
                  </div>
                ))}
                {(!workspaceDetails.members || workspaceDetails.members.length === 0) && (
                  <p className="text-xs text-white/40">No members found.</p>
                )}
              </div>
            </div>

            {/* Tasks Section */}
            <div>
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                Tasks ({workspaceDetails.tasks?.length ?? 0})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {workspaceDetails.tasks?.map((task) => (
                  <div key={task.id} className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white">{task.title}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${
                        task.status === 'Completed'
                          ? 'bg-green-500/10 border-green-500/30 text-green-400'
                          : task.status === 'Review'
                          ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                          : task.status === 'In Progress'
                          ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                          : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="text-white/50 line-clamp-1">{task.description}</p>
                    <div className="flex justify-between text-[10px] text-white/30 pt-1 border-t border-white/5">
                      <span>Priority: <strong className="text-white/50">{task.priority}</strong></span>
                      <span>Assignee: <strong className="text-white/50">{task.assignedTo?.name || 'Unassigned'}</strong></span>
                    </div>
                  </div>
                ))}
                {(!workspaceDetails.tasks || workspaceDetails.tasks.length === 0) && (
                  <p className="text-xs text-white/40">No tasks found.</p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default ManageWorkspaces;
