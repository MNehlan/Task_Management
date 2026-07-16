const MemberList = ({ members, canManage, ownerId, onRemove }) => {
  if (members.length === 0) {
    return (
      <p className="text-sm text-white/40 py-4">No members yet.</p>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const initials = member.name
          ? member.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
          : '?';

        const isOwner = member._id === ownerId;

        return (
          <div
            key={member._id}
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10"
          >
            {/* Avatar + info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-violet-600/40 border border-violet-500/30 flex items-center justify-center text-violet-300 text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {member.name}
                  {isOwner && (
                    <span className="ml-2 text-xs text-violet-400 font-normal">(Owner)</span>
                  )}
                </p>
                <p className="text-xs text-white/40 truncate">{member.email}</p>
              </div>
            </div>

            {/* Role + remove */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-white/40 capitalize">{member.role}</span>
              {canManage && !isOwner && (
                <button
                  onClick={() => onRemove(member._id)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MemberList;
