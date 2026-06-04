import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <aside>
      <ul>
        <li>
          <Link to="/dashboard">
            Dashboard
          </Link>
        </li>

        <li>
          <Link to="/workspaces">
            Workspaces
          </Link>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;