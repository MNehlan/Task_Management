import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/api.js';
import TaskForm from './TaskForm.jsx';

const WorkspaceDetails = () => {
  const { workspaceId } = useParams();

  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        <p>{workspace.description}</p>
      </section>

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
              <p><button onClick={() => handleDeleteTask(task.id)}>Delete</button></p>
            </div>
          ))
        )}
      </section>
      <TaskForm members={members} fetchWorkspaceData={fetchWorkspaceData} />
    </div>
  );
};

export default WorkspaceDetails;