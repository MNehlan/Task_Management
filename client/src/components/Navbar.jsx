import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <nav className="h-16 bg-[#1a1a2e] border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="font-bold text-lg text-white tracking-wide">
        <Link to="/dashboard">✅ TaskFlow</Link>
      </h1>

      <div className="flex items-center gap-4">
        {/* Avatar + name */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
          <span className="text-sm text-white/70 hidden sm:block">{user?.name}</span>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-1.5 rounded-lg border border-red-500/40 text-red-400 text-sm hover:bg-red-500/10 transition cursor-pointer"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;