import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/api.js';
import TaskForm from './TaskForm.jsx';

const WorkspaceDetails = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingTask, setEditingTask] = useState(null)

  const [memberEmail, setMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState('');

  const user = JSON.parse(
    localStorage.getItem('user') || 'null'
  );

  const canManageWorkspace =
    user?.role === 'admin' ||
    workspace?.owner === user?.id;

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
      setError(
        error.response?.data?.message ||
        'Failed to load workspace data'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (taskId, status) => {
    try {
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId
            ? {
              ...task, status
            } : task
        )
      );

      await api.patch(`/task/${taskId}`, { status });
    } catch (error) {
      setError(
        error.response?.data?.message ||
        'Failed to change task status'
      );
    }
  }

  const handleDeleteTask = async (taskId) => {
    const confirmed = window.confirm(
      'Remove this task?'
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/task/${taskId}`);
      setTasks(prev => prev.filter(task => task.id !== taskId))
    } catch (error) {
      setError(
        error.response?.data?.message ||
        'Failed to delete task'
      );
    }
  }

  const handleEditTask = (task) => {
    setEditingTask(task);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();

    try {
      setAddingMember(true);
      setMemberError('');

      const response = await api.post(
        `/workspace/${workspaceId}/members`,
        {
          email: memberEmail,
        }
      );

      setMemberEmail('');

      setMembers(prev => [...prev, response.data.member])
    } catch (error) {
      setMemberError(
        error.response?.data?.message ||
        'Failed to add member'
      );
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    const confirmed = window.confirm(
      'Remove this member?'
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/workspace/${workspaceId}/members/${userId}`
      );

      setMembers(prev => prev.filter(member => member._id !== userId))
    } catch (error) {
      setError(
        error.response?.data?.message ||
        'Failed to remove member'
      );
    }
  };

  const handleLeaveWorkspace = async () => {
    const confirmed =
      window.confirm(
        'Leave this workspace?'
      );

    if (!confirmed) return;

    try {
      await api.delete(
        `/workspace/${workspaceId}/leave`
      );

      navigate('/workspaces');
    } catch (error) {
      setError(
        error.response?.data?.message ||
        'Failed to leave workspace'
      );
    }
  };

  const handleDeleteWorkspace = async () => {
    const confirmed = window.confirm(
      'Delete this workspace?'
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/workspace/${workspaceId}`
      );

      navigate('/workspaces');
    } catch (error) {
      setError(
        error.response?.data?.message ||
        'Failed to delete workspace'
      );
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [workspaceId]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="p-6">
      <section className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">{workspace.name}</h1>
        <p className="text-gray-600 mb-4">{workspace.description}</p>
        <div className="flex gap-3">
          {canManageWorkspace && (
            <button
              onClick={handleDeleteWorkspace}
              className="bg-red-500 text-white px-4 py-2  rounded-lg hover:bg-red-600"
            >
              Delete Workspace
            </button>
          )}
          <button
            onClick={handleLeaveWorkspace}
            className='bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900'
          >
            Leave Workspace
          </button>
        </div>
      </section>
      {canManageWorkspace && (
        <section className='bg-white rounded-xl shadow-md p-6 mb-6'>
          <h2 className='text-2xl font-bold mb-4'>Add Member</h2>

          {memberError && (
            <p>{memberError}</p>
          )}

          <form onSubmit={handleAddMember}>
            <input
              type="email"
              placeholder="Enter user email"
              value={memberEmail}
              onChange={(e) =>
                setMemberEmail(e.target.value)
              }
              className='w-full border rounded-lg p-3 mb-4'
            />

            <button
              type="submit"
              disabled={addingMember}
              className='bg-blue-600 text-white px-4 py-2 rounded-lg'
            >
              {addingMember
                ? 'Adding...'
                : 'Add Member'}
            </button>
          </form>
        </section>
      )
      }
      <section className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className='text-2xl font-bold mb-4'>Members ({members.length})</h2>

        {members.length === 0 ? (
          <p className='text-gray-600 mb-4'>No members found</p>
        ) : (
          members.map((member) => (
            <div key={member._id}
              className='grid grid-cols-[1fr_120px_120px] items-center border-b py-3'
            >
              <div>
                <p className='font-medium'>{member.name}</p>
                <p className='text-sm text-gray-500'>{member.email}</p>
              </div>

              <p className='text-sm text-black'>{member.role}</p>
              <div className='flex justify-end'>
                {canManageWorkspace && (
                  member._id !== workspace.owner && (
                    <button
                      onClick={() =>
                        handleRemoveMember(member._id)
                      }
                      className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
                    >
                      Remove
                    </button>
                  )
                )}
              </div>
            </div>
          ))
        )}
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-4">
          Tasks ({tasks.length})
        </h2>

        {tasks.length === 0 ? (
          <p>No tasks found</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id}
              className='bg-white rounded-xl shadow-md p-5 mb-4'
            >
              <h3 className='text-lg font-semibold'>{task.title}</h3>

              <p className="text-gray-600 mt-2">{task.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <p>
                  <strong>Assigned:</strong>{' '}
                  {task.assignedTo?.name || 'Unassigned'}
                </p>

                <p>
                  <strong>Priority:</strong>{' '}
                  {task.priority}
                </p>

                <p>
                  <strong>Status:</strong>{' '}
                  <select
                    value={task.status}
                    onChange={(e) =>
                      updateStatus(
                        task.id,
                        e.target.value
                      )
                    }
                    className="border rounded-lg px-2 py-1"
                  >
                    <option>Todo</option>
                    <option>In Progress</option>
                    <option>Review</option>
                    <option>Completed</option>
                  </select>
                </p>

                <p>
                  <strong>Deadline:</strong>{' '}
                  {task.deadline
                    ? new Date(
                      task.deadline
                    ).toLocaleDateString()
                    : 'No deadline'}
                </p>
              </div>
              {canManageWorkspace && (
                <div className='flex gap-2 mt-4'>
                  <button onClick={() => handleEditTask(task)}
                    className='bg-yellow-500 text-white px-3 py-2 rounded-lg'
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDeleteTask(task.id)}
                    className='bg-red-500 text-white px-3 py-2 rounded-lg'
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </section>
      {canManageWorkspace && (
        <section className="bg-white rounded-xl shadow-md p-6 mt-6">
          <h2 className="text-2xl font-bold mb-4">
            {editingTask
              ? 'Edit Task'
              : 'Create Task'}
          </h2>
          <TaskForm
            members={members}
            editingTask={editingTask}
            setEditingTask={setEditingTask}
            setTasks={setTasks}
          />
        </section>
      )}
    </div >
  );
};

export default WorkspaceDetails;