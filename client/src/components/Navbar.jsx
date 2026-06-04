import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem('user') || 'null'
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    navigate('/login');
  };

  return (
    <nav className="h-16 border-b bg-white flex items-center justify-between px-6">
      <h1 className="font-bold text-xl">
        <Link to={'/dashboard'}>Task Manager</Link>
      </h1>

      <div className="flex items-center gap-4">
        <span>{user?.name}</span>

        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded bg-red-500 text-white cursor-pointer"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;