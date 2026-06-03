import { useState, useEffect } from "react"
import { useParams } from "react-router-dom";
import api from "../api/api.js"

const TaskForm = ({ members, fetchWorkspaceData, setEditingTask, editingTask }) => {
  const { workspaceId } = useParams()
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

  const handleChange = (e) => {
    setTaskForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setCreating(true);
      setCreateError('');

      if (editingTask) {
        await api.put(
          `/task/${editingTask.id}`,
          taskForm
        );

        setEditingTask(null);
      } else {
        await api.post(
          '/task/create',
          taskForm
        );
      }

      setTaskForm({
        title: '',
        description: '',
        priority: 'Medium',
        deadline: '',
        workspaceId,
        assignedTo: '',
      });

      await fetchWorkspaceData();
    } catch (error) {
      setCreateError(
        error.response?.data?.message ||
        'Operation failed'
      );
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (editingTask) {
      setTaskForm({
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        deadline:
          editingTask.deadline?.split('T')[0] ||
          '',
        workspaceId,
        assignedTo:
          editingTask.assignedTo?.id || '',
      });
    }
  }, [editingTask, workspaceId]);

  return (
    <>
      <form onSubmit={handleSubmit}>
        <p>{createError}</p>
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={taskForm.title}
          onChange={handleChange}
        />

        <textarea
          name="description"
          placeholder="Description"
          value={taskForm.description}
          onChange={handleChange}
        />

        <select
          name="priority"
          value={taskForm.priority}
          onChange={handleChange}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <input
          type="date"
          name="deadline"
          value={taskForm.deadline}
          onChange={handleChange}
        />

        <select
          name="assignedTo"
          value={taskForm.assignedTo}
          onChange={handleChange}
        >
          <option value="">
            Select Member
          </option>

          {members.map((member) => (
            <option
              key={member._id}
              value={member._id}
            >
              {member.name}
            </option>
          ))}
        </select>

        {editingTask && (
          <button
            type="button"
            onClick={() => {
              setEditingTask(null);

              setTaskForm({
                title: '',
                description: '',
                priority: 'Medium',
                deadline: '',
                workspaceId,
                assignedTo: '',
              });
            }}
          >
            Cancel Edit
          </button>
        )}

        <button
          type="submit"
          disabled={creating}
        >
          {creating
            ? editingTask
              ? 'Updating...'
              : 'Creating...'
            : editingTask
              ? 'Update Task'
              : 'Create Task'}
        </button>
      </form>
    </>
  )
}

export default TaskForm