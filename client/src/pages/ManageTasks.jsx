import { useEffect, useState } from 'react';
import api from '../api/api.js';
import Modal from '../components/Modal.jsx';

const ManageTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [workspaceFilter, setWorkspaceFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [taskDetails, setTaskDetails] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/admin/tasks');
      setTasks(data.tasks);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleViewTask = async (taskId) => {
    try {
      setModalOpen(true);
      setModalLoading(true);
      setTaskDetails(null);
      const { data } = await api.get(`/admin/tasks/${taskId}`);
      setTaskDetails(data.task);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load task details');
      setModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteTask = async (taskId, taskTitle) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete task "${taskTitle}"?`
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(taskId);
      await api.delete(`/task/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setDeletingId(null);
    }
  };

  // Get unique workspaces for filter dropdown
  const uniqueWorkspaces = Array.from(
    new Map(tasks.map((t) => [t.workspace?.id, t.workspace])).values()
  ).filter(Boolean);

  // Filter logic
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    const matchesWorkspace = !workspaceFilter || task.workspace?.id === workspaceFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesWorkspace;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-white/40 text-sm">
        Loading system tasks...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Manage Tasks 📋</h1>
        <p className="text-sm text-white/40 mt-1">
          Review, filter, view details, or delete system-wide tasks.
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm max-w-md">
          {error}
        </div>
      )}

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
        {/* Search */}
        <input
          type="text"
          placeholder="Search by title or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="lg:col-span-2 w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
        />

        {/* Workspace filter */}
        <select
          value={workspaceFilter}
          onChange={(e) => setWorkspaceFilter(e.target.value)}
          className="w-full px-4 py-2 rounded-xl bg-[#1a1a2e] border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500 transition [scheme:dark]"
        >
          <option value="" className="bg-[#1a1a2e] text-white">All Workspaces</option>
          {uniqueWorkspaces.map((ws) => (
            <option key={ws.id} value={ws.id} className="bg-[#1a1a2e] text-white">{ws.name}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-4 py-2 rounded-xl bg-[#1a1a2e] border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500 transition [scheme:dark]"
        >
          <option value="" className="bg-[#1a1a2e] text-white">All Statuses</option>
          <option value="Todo" className="bg-[#1a1a2e] text-white">Todo</option>
          <option value="In Progress" className="bg-[#1a1a2e] text-white">In Progress</option>
          <option value="Review" className="bg-[#1a1a2e] text-white">Review</option>
          <option value="Completed" className="bg-[#1a1a2e] text-white">Completed</option>
        </select>

        {/* Priority filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="w-full px-4 py-2 rounded-xl bg-[#1a1a2e] border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500 transition [scheme:dark]"
        >
          <option value="" className="bg-[#1a1a2e] text-white">All Priorities</option>
          <option value="Low" className="bg-[#1a1a2e] text-white">Low</option>
          <option value="Medium" className="bg-[#1a1a2e] text-white">Medium</option>
          <option value="High" className="bg-[#1a1a2e] text-white">High</option>
        </select>
      </div>

      {/* Tasks Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-white/30 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Task Title</th>
                <th className="px-6 py-4">Workspace</th>
                <th className="px-6 py-4">Assignee</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Deadline</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-white/80">
              {filteredTasks.map((task) => {
                const isDeleting = deletingId === task.id;

                return (
                  <tr key={task.id} className="hover:bg-white/5 transition-colors duration-150">
                    {/* Title */}
                    <td className="px-6 py-4 font-semibold text-white truncate max-w-xs">{task.title}</td>

                    {/* Workspace */}
                    <td className="px-6 py-4 text-white/60 truncate max-w-[120px]">
                      {task.workspace?.name || '—'}
                    </td>

                    {/* Assignee */}
                    <td className="px-6 py-4 text-white/60 truncate max-w-[120px]">
                      {task.assignedTo?.name || 'Unassigned'}
                    </td>

                    {/* Priority badge */}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${task.priority === 'High'
                          ? 'bg-red-500/10 border-red-500/30 text-red-400'
                          : task.priority === 'Medium'
                            ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                            : 'bg-green-500/10 border-green-500/30 text-green-400'
                        }`}>
                        {task.priority}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${task.status === 'Completed'
                          ? 'bg-green-500/10 border-green-500/30 text-green-400'
                          : task.status === 'Review'
                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                            : task.status === 'In Progress'
                              ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                              : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                        }`}>
                        {task.status}
                      </span>
                    </td>

                    {/* Deadline */}
                    <td className="px-6 py-4 text-white/40">
                      {task.deadline
                        ? new Date(task.deadline).toLocaleDateString('en-GB', {
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
                          onClick={() => handleViewTask(task.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 transition cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id, task.title)}
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

        {filteredTasks.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center text-white/40">
            <span className="text-4xl mb-3">📋</span>
            <p className="text-sm">No tasks match the active filter criteria.</p>
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={taskDetails ? `Task Details` : 'Loading details...'}
      >
        {modalLoading ? (
          <div className="text-center text-white/40 py-8 text-sm">Fetching task details...</div>
        ) : taskDetails ? (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {/* Title */}
            <div>
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Title</h3>
              <p className="text-base font-bold text-white leading-snug">{taskDetails.title}</p>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Description</h3>
              <p className="text-sm text-white/80 bg-white/5 border border-white/10 p-3 rounded-xl leading-relaxed whitespace-pre-wrap">
                {taskDetails.description || 'No description provided.'}
              </p>
            </div>

            {/* Meta statistics */}
            <div className="grid grid-cols-2 gap-4 bg-white/5 border border-white/10 p-4 rounded-xl text-sm">
              <div>
                <span className="text-xs text-white/40 block mb-0.5">Workspace</span>
                <span className="text-white font-medium">{taskDetails.workspace?.name || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-white/40 block mb-0.5">Status</span>
                <span className="text-white font-medium">{taskDetails.status}</span>
              </div>
              <div>
                <span className="text-xs text-white/40 block mb-0.5">Priority</span>
                <span className="text-white font-medium">{taskDetails.priority}</span>
              </div>
              <div>
                <span className="text-xs text-white/40 block mb-0.5">Deadline</span>
                <span className="text-white font-medium">
                  {taskDetails.deadline
                    ? new Date(taskDetails.deadline).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                    : '—'}
                </span>
              </div>
            </div>

            {/* Assignee & Creator */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                <span className="text-xs text-white/40 block mb-1">Assigned To</span>
                {taskDetails.assignedTo ? (
                  <div>
                    <p className="text-sm text-white font-semibold">{taskDetails.assignedTo.name}</p>
                    <p className="text-xs text-white/40">{taskDetails.assignedTo.email}</p>
                  </div>
                ) : (
                  <p className="text-xs text-white/40">Unassigned</p>
                )}
              </div>

              <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                <span className="text-xs text-white/40 block mb-1">Created By</span>
                <div>
                  <p className="text-sm text-white font-semibold">{taskDetails.createdBy?.name || '—'}</p>
                  <p className="text-xs text-white/40">{taskDetails.createdBy?.email || ''}</p>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="text-[10px] text-white/20 flex gap-4 justify-between border-t border-white/5 pt-3">
              <span>Created at: {new Date(taskDetails.createdAt).toLocaleString()}</span>
              {taskDetails.updatedAt && (
                <span>Last updated: {new Date(taskDetails.updatedAt).toLocaleString()}</span>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default ManageTasks;
