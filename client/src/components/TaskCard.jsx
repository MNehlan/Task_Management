const priorityConfig = {
  High: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  Medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  Low: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
};

const allStatusOptions = ['Todo', 'In Progress', 'Review', 'Completed'];
const memberStatusOptions = ['Todo', 'In Progress', 'Review'];

const TaskCard = ({ task, canManage, onStatusChange, onEdit, onDelete }) => {
  const priority = priorityConfig[task.priority] || priorityConfig.Medium;
  const isCompleted = task.status === 'Completed';

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-white leading-snug">{task.title}</h3>
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${priority.color} ${priority.bg} ${priority.border}`}>
          {task.priority}
        </span>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-white/50 leading-relaxed mb-4 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Meta row */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div className="bg-white/5 rounded-lg px-3 py-2">
          <p className="text-white/30 mb-0.5">Assigned to</p>
          <p className="text-white/80 font-medium truncate">
            {task.assignedTo?.name || 'Unassigned'}
          </p>
        </div>
        <div className="bg-white/5 rounded-lg px-3 py-2">
          <p className="text-white/30 mb-0.5">Deadline</p>
          <p className="text-white/80 font-medium">
            {task.deadline
              ? new Date(task.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : '—'}
          </p>
        </div>
      </div>

      {/* Footer: status + actions */}
      <div className="flex items-center justify-between gap-3">
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
          disabled={isCompleted}
          className={`flex-1 text-xs px-3 py-2 rounded-lg border text-white/80 focus:outline-none focus:border-violet-500 transition [scheme:dark] ${isCompleted
              ? 'bg-green-500/10 border-green-500/30 text-green-400 cursor-not-allowed opacity-70'
              : 'bg-white/5 border-white/10 cursor-pointer'
            }`}
        >
          {(isCompleted ? ['Completed'] : canManage ? allStatusOptions : memberStatusOptions).map((s) => (
            <option key={s} value={s} className="bg-[#1a1a2e] text-white">{s}</option>
          ))}
        </select>

        {canManage && (
          <div className="flex gap-2 shrink-0">
            {!isCompleted && (
              <button
                onClick={() => onEdit(task)}
                className="text-xs px-3 py-2 rounded-lg border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition"
              >
                Edit
              </button>
            )}
            <button
              onClick={() => onDelete(task.id)}
              className="text-xs px-3 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div >
  );
};

export default TaskCard;
