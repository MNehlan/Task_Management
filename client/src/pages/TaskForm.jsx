import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api.js";
import { handleChange } from "../utils/handlechange.js";

const inputCls = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition";
const selectCls = "w-full px-4 py-2.5 rounded-xl bg-[#1a1a2e] border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition";

const TaskForm = ({ members, setEditingTask, editingTask, setTasks, onClose }) => {
  const { workspaceId } = useParams();
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    deadline: '',
    workspaceId,
    assignedTo: '',
  });

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (editingTask) {
      setTaskForm({
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        deadline: editingTask.deadline?.split('T')[0] || '',
        workspaceId,
        assignedTo: editingTask.assignedTo?.id || '',
      });
    }
  }, [editingTask, workspaceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      setCreateError('');

      const taskData = { ...taskForm, assignedTo: taskForm.assignedTo || undefined };

      if (editingTask) {
        const response = await api.put(`/task/${editingTask.id}`, taskData);
        setTasks((prev) =>
          prev.map((task) => (task.id === editingTask.id ? response.data.task : task))
        );
        setEditingTask(null);
      } else {
        const response = await api.post('/task/create', taskData);
        setTasks((prev) => [...prev, response.data.task]);
      }

      setTaskForm({ title: '', description: '', priority: 'Medium', deadline: '', workspaceId, assignedTo: '' });
      onClose?.();
    } catch (error) {
      setCreateError(error.response?.data?.message || 'Operation failed');
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    setEditingTask(null);
    setTaskForm({ title: '', description: '', priority: 'Medium', deadline: '', workspaceId, assignedTo: '' });
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {createError && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {createError}
        </div>
      )}

      <input
        type="text"
        name="title"
        placeholder="Task title"
        value={taskForm.title}
        onChange={(e) => handleChange(e, setTaskForm)}
        required
        className={inputCls}
      />

      <textarea
        name="description"
        placeholder="Task description"
        value={taskForm.description}
        onChange={(e) => handleChange(e, setTaskForm)}
        rows={3}
        className={`${inputCls} resize-none`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select name="priority" value={taskForm.priority} onChange={(e) => handleChange(e, setTaskForm)} className={`${selectCls} [scheme:dark]`}>
          <option value="Low" className="bg-[#1a1a2e] text-white">Low</option>
          <option value="Medium" className="bg-[#1a1a2e] text-white">Medium</option>
          <option value="High" className="bg-[#1a1a2e] text-white">High</option>
        </select>

        <input
          type="date"
          name="deadline"
          value={taskForm.deadline}
          onChange={(e) => handleChange(e, setTaskForm)}
          className={`${inputCls} [scheme:dark]`}
        />

        <select name="assignedTo" value={taskForm.assignedTo} onChange={(e) => handleChange(e, setTaskForm)} className={`${selectCls} [colorscheme:dark]`}>
          <option value="" className="bg-[#1a1a2e] text-white">Unassigned</option>
          {members.map((member) => (
            <option key={member._id} value={member._id} className="bg-[#1a1a2e] text-white">{member.name}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={handleCancel}
          className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:bg-white/5 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={creating}
          className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold text-sm transition"
        >
          {creating
            ? editingTask ? 'Updating...' : 'Creating...'
            : editingTask ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;