import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <>
      <Navbar />

      <div>
        <Sidebar />

        <main>
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default Layout;