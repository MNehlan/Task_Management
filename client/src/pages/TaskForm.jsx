import { useState, useEffect } from "react"
import { useParams } from "react-router-dom";
import api from "../api/api.js"

const TaskForm = ({ members, setEditingTask, editingTask, setTasks }) => {
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

      const taskData = {
        ...taskForm,
        assignedTo:
          taskForm.assignedTo || undefined,
      };

      console.log(editingTask)


      if (editingTask) {
        const response = await api.put(
          `/task/${editingTask.id}`,
          taskData
        );

        setTasks(prev =>
          prev.map(task =>
            task.id === editingTask.id
              ? response.data.task
              : task
          ));

        setEditingTask(null);
      } else {
        const response = await api.post(
          '/task/create',
          taskData
        );

        setTasks(prev => [...prev, response.data.task])
      }

      setTaskForm({
        title: '',
        description: '',
        priority: 'Medium',
        deadline: '',
        workspaceId,
        assignedTo: '',
      });

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
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {createError && (
        <p className="text-red-500">
          {createError}
        </p>
      )}

      <input
        type="text"
        name="title"
        placeholder="Task Title"
        value={taskForm.title}
        onChange={handleChange}
        className="
          w-full
          border
          rounded-lg
          p-3
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
        "
      />

      <textarea
        name="description"
        placeholder="Task Description"
        value={taskForm.description}
        onChange={handleChange}
        rows="4"
        className="
          w-full
          border
          rounded-lg
          p-3
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
        "
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <select
          name="priority"
          value={taskForm.priority}
          onChange={handleChange}
          className="
            border
            rounded-lg
            p-3
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
          "
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
          className="
            border
            rounded-lg
            p-3
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
          "
        />

        <select
          name="assignedTo"
          value={taskForm.assignedTo}
          onChange={handleChange}
          className="
            border
            rounded-lg
            p-3
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
          "
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
      </div>

      <div className="flex gap-3">
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
            className="
              bg-gray-500
              text-white
              px-4
              py-2
              rounded-lg
              hover:bg-gray-600
            "
          >
            Cancel Edit
          </button>
        )}

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
            disabled:opacity-50
          "
        >
          {creating
            ? editingTask
              ? 'Updating...'
              : 'Creating...'
            : editingTask
              ? 'Update Task'
              : 'Create Task'}
        </button>
      </div>
    </form>
  );
}

export default TaskForm