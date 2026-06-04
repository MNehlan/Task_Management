import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <aside className="w-64 min-h-screen border-r bg-white p-4">
      <h2 className="text-xl font-bold mb-6">
        Task Manager
      </h2>

      <nav className="flex flex-col gap-2">
        <Link
          to="/dashboard"
          className="px-3 py-2 rounded hover:bg-gray-100"
        >
          Dashboard
        </Link>

        <Link
          to="/workspaces"
          className="px-3 py-2 rounded hover:bg-gray-100"
        >
          Workspaces
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;