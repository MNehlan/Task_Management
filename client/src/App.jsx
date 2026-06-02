import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard.jsx';
import Register from './pages/Register.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path='/login'
          element={<Login />}
        />
         <Route
          path='/register'
          element={<Register />}
        />
        <Route element={<ProtectedRoute/>}>
        <Route
          path='/dashboard'
          element={<Dashboard />}
        />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
