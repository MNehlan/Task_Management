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
      await api.patch(`/task/${taskId}`, { status });
      await fetchWorkspaceData();
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
      await fetchWorkspaceData();
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

      await api.post(
        `/workspace/${workspaceId}/members`,
        {
          email: memberEmail,
        }
      );

      setMemberEmail('');

      await fetchWorkspaceData();
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

      await fetchWorkspaceData();
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
    <div>
      <section>
        <h1>{workspace.name}</h1>
        {canManageWorkspace && (
          <button
            onClick={handleDeleteWorkspace}
          >
            Delete Workspace
          </button>
        )}
        <button
          onClick={handleLeaveWorkspace}
        >
          Leave Workspace
        </button>
        <p>{workspace.description}</p>
      </section>
      {canManageWorkspace && (
        <section>
          <h2>Add Member</h2>

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
            />

            <button
              type="submit"
              disabled={addingMember}
            >
              {addingMember
                ? 'Adding...'
                : 'Add Member'}
            </button>
          </form>
        </section>
      )
      }
      <section>
        <h2>Members ({members.length})</h2>

        {members.length === 0 ? (
          <p>No members found</p>
        ) : (
          members.map((member) => (
            <div key={member._id}>
              <p>{member.name}</p>
              <p>{member.email}</p>
              <p>{member.role}</p>
              {canManageWorkspace && (
                member._id !== workspace.owner && (
                  <button
                    onClick={() =>
                      handleRemoveMember(member._id)
                    }
                  >
                    Remove
                  </button>
                )
              )}
            </div>
          ))
        )}
      </section>

      <section>
        <h2>Tasks ({tasks.length})</h2>

        {tasks.length === 0 ? (
          <p>No tasks found</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id}>
              <h3>{task.title}</h3>

              <p>{task.description}</p>

              <p>
                <strong>Assigned To:</strong>{' '}
                {task.assignedTo?.name || 'Unassigned'}
              </p>

              <p>
                <strong>Priority:</strong> {task.priority}
              </p>

              <p>
                <strong>Status:</strong> <select
                  value={task.status}
                  onChange={(e) =>
                    updateStatus(task.id, e.target.value)
                  }
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
                  ? new Date(task.deadline).toLocaleDateString()
                  : 'No deadline'}
              </p>
              {canManageWorkspace && (
                <div>
                  <p>
                    <button onClick={() => handleEditTask(task)}>Edit</button>
                  </p>
                  <p>
                    <button onClick={() => handleDeleteTask(task.id)}>Delete</button>
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </section>
      {canManageWorkspace && (
        <TaskForm
          members={members}
          fetchWorkspaceData={fetchWorkspaceData}
          editingTask={editingTask}
          setEditingTask={setEditingTask}
        />)}
    </div >
  );
};

export default WorkspaceDetails;