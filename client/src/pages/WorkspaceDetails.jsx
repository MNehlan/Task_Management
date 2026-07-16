import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/api.js';
import TaskForm from './TaskForm.jsx';
import TaskCard from '../components/TaskCard.jsx';
import MemberList from '../components/MemberList.jsx';
import Modal from '../components/Modal.jsx';

const WorkspaceDetails = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);

  // Add member form
  const [memberEmail, setMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const canManageWorkspace = user?.role === 'admin' || workspace?.owner === user?.id;

  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);
      setError('');
      const [workspaceRes, membersRes, tasksRes] = await Promise.all([
        api.get(`/workspace/${workspaceId}`),
        api.get(`/workspace/${workspaceId}/members`),
        api.get(`/task/workspace/${workspaceId}`),
      ]);
      setWorkspace(workspaceRes.data.workspace);
      setMembers(membersRes.data.members);
      setTasks(tasksRes.data.tasks);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load workspace data');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (taskId, status) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    try {
      await api.patch(`/task/${taskId}`, { status });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to change task status');
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/task/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      setAddingMember(true);
      setMemberError('');
      const response = await api.post(`/workspace/${workspaceId}/members`, { email: memberEmail });
      setMembers((prev) => [...prev, response.data.member]);
      setMemberEmail('');
      setMemberModalOpen(false);
    } catch (error) {
      setMemberError(error.response?.data?.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/workspace/${workspaceId}/members/${userId}`);
      setMembers((prev) => prev.filter((m) => m._id !== userId));
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleLeaveWorkspace = async () => {
    if (!window.confirm('Leave this workspace?')) return;
    try {
      await api.delete(`/workspace/${workspaceId}/leave`);
      navigate('/workspaces');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to leave workspace');
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!window.confirm('Permanently delete this workspace?')) return;
    try {
      await api.delete(`/workspace/${workspaceId}`);
      navigate('/workspaces');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete workspace');
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-white/40 text-sm">
        Loading workspace...
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
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Workspace Header ── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white">{workspace.name}</h1>
            <p className="text-sm text-white/50 mt-1 max-w-lg">{workspace.description}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {canManageWorkspace && (
              <button
                onClick={handleDeleteWorkspace}
                className="text-sm px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
              >
                Delete Workspace
              </button>
            )}
            <button
              onClick={handleLeaveWorkspace}
              className="text-sm px-4 py-2 rounded-xl border border-white/15 text-white/50 hover:bg-white/5 transition"
            >
              Leave
            </button>
          </div>
        </div>
      </div>

      {/* ── Members Section ── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-white">Members</h2>
            <p className="text-xs text-white/40 mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>
          {canManageWorkspace && (
            <button
              onClick={() => { setMemberError(''); setMemberModalOpen(true); }}
              className="text-sm px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium transition"
            >
              + Add Member
            </button>
          )}
        </div>

        <MemberList
          members={members}
          canManage={canManageWorkspace}
          ownerId={workspace.owner}
          onRemove={handleRemoveMember}
        />
      </div>

      {/* ── Tasks Section ── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-white">Tasks</h2>
            <p className="text-xs text-white/40 mt-0.5">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
          </div>
          {canManageWorkspace && (
            <button
              onClick={() => { setEditingTask(null); setTaskModalOpen(true); }}
              className="text-sm px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium transition"
            >
              + New Task
            </button>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm text-white/40">No tasks yet. Create the first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                canManage={canManageWorkspace}
                onStatusChange={updateStatus}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Task Modal (Create / Edit) ── */}
      <Modal
        isOpen={taskModalOpen}
        onClose={() => { setTaskModalOpen(false); setEditingTask(null); }}
        title={editingTask ? 'Edit Task' : 'New Task'}
      >
        <TaskForm
          members={members}
          editingTask={editingTask}
          setEditingTask={setEditingTask}
          setTasks={setTasks}
          onClose={() => { setTaskModalOpen(false); setEditingTask(null); }}
        />
      </Modal>

      {/* ── Add Member Modal ── */}
      <Modal
        isOpen={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        title="Add Member"
      >
        {memberError && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {memberError}
          </div>
        )}
        <form onSubmit={handleAddMember} className="space-y-4">
          <input
            type="email"
            placeholder="Enter member email"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMemberModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addingMember}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold text-sm transition"
            >
              {addingMember ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default WorkspaceDetails;