import { useEffect, useState } from 'react';
import api from '../api/api.js';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/admin/users');
      setUsers(data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, userName, currentRole, newRole) => {
    if (userId === currentUser?.id) return;

    const confirmChange = window.confirm(
      `Are you sure you want to change the role of "${userName}" from "${currentRole}" to "${newRole}"?`
    );

    if (!confirmChange) return;

    try {
      setUpdatingId(userId);
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, role: newRole } : user))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (userId === currentUser?.id) return;

    const confirmDelete = window.confirm(
      `WARNING: Are you sure you want to delete user "${userName}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      setUpdatingId(userId);
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-white/40 text-sm">
        Loading user database...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Manage Users 👥</h1>
        <p className="text-sm text-white/40 mt-1">
          Review, promote, demote, or remove system users.
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm max-w-md">
          {error}
        </div>
      )}

      {/* Users Table / List */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-white/30 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-white/80">
              {users.map((user) => {
                const isSelf = user.id === currentUser?.id;
                const isUpdating = updatingId === user.id;

                return (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors duration-150">
                    {/* Name */}
                    <td className="px-6 py-4 font-medium text-white">
                      <div className="flex items-center gap-2">
                        {user.name}
                        {isSelf && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-400 border border-violet-500/30">
                            You
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 text-white/60">{user.email}</td>

                    {/* Joined Date */}
                    <td className="px-6 py-4 text-white/40">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                        : '—'}
                    </td>

                    {/* Role Dropdown */}
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        disabled={isSelf || isUpdating}
                        onChange={(e) =>
                          handleRoleChange(user.id, user.name, user.role, e.target.value)
                        }
                        className={`text-xs px-3 py-1.5 rounded-lg border text-white/80 focus:outline-none focus:border-violet-500 transition [scheme:dark] ${isSelf
                          ? 'bg-violet-500/10 border-violet-500/30 text-violet-400 cursor-not-allowed opacity-75'
                          : 'bg-white/5 border-white/10 cursor-pointer hover:border-white/20'
                          }`}
                      >
                        <option value="member" className="bg-[#1a1a2e] text-white">Member</option>
                        <option value="manager" className="bg-[#1a1a2e] text-white">Manager</option>
                        <option value="admin" className="bg-[#1a1a2e] text-white">Admin</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      {!isSelf && (
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          disabled={isUpdating}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition cursor-pointer"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center text-white/40">
            <span className="text-4xl mb-3">👥</span>
            <p className="text-sm">No users registered in the system yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;
