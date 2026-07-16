const WorkspaceCard = ({ workspace, onClick }) => {
  // Generate a consistent color based on workspace name
  const colors = [
    { bg: 'from-violet-600/20 to-violet-600/5', border: 'border-violet-500/30', dot: 'bg-violet-500', text: 'text-violet-400' },
    { bg: 'from-blue-600/20 to-blue-600/5',     border: 'border-blue-500/30',   dot: 'bg-blue-500',   text: 'text-blue-400' },
    { bg: 'from-cyan-600/20 to-cyan-600/5',     border: 'border-cyan-500/30',   dot: 'bg-cyan-500',   text: 'text-cyan-400' },
    { bg: 'from-emerald-600/20 to-emerald-600/5', border: 'border-emerald-500/30', dot: 'bg-emerald-500', text: 'text-emerald-400' },
    { bg: 'from-orange-600/20 to-orange-600/5', border: 'border-orange-500/30', dot: 'bg-orange-500', text: 'text-orange-400' },
    { bg: 'from-pink-600/20 to-pink-600/5',     border: 'border-pink-500/30',   dot: 'bg-pink-500',   text: 'text-pink-400' },
  ];

  const colorIndex = workspace.name.charCodeAt(0) % colors.length;
  const color = colors[colorIndex];

  const initials = workspace.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      onClick={onClick}
      className={`group bg-linear-to-br ${color.bg} border ${color.border} rounded-2xl p-6 cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:shadow-black/30 transition-all duration-200`}
    >
      {/* Top row */}
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-11 h-11 rounded-xl ${color.dot} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
          {initials}
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-white truncate group-hover:text-white/90">
            {workspace.name}
          </h2>
          <span className={`text-xs ${color.text} font-medium`}>Workspace</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-white/50 leading-relaxed line-clamp-2">
        {workspace.description || 'No description provided.'}
      </p>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs text-white/30">
          {workspace.members?.length ?? 0} member{workspace.members?.length !== 1 ? 's' : ''}
        </span>
        <span className={`text-xs font-medium ${color.text} group-hover:underline`}>
          Open →
        </span>
      </div>
    </div>
  );
};

export default WorkspaceCard;
