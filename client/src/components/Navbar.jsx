import { useNavigate } from 'react-router-dom';

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
    <nav>
      <h1>Task Manager</h1>

      <span>{user?.name}</span>

      <button onClick={handleLogout}>
        Logout
      </button>
    </nav>
  );
};

export default Navbar;