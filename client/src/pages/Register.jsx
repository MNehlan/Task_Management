import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api.js';

const Register = () => {
  const navigate = useNavigate();

  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setRegisterForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      const { data } = await api.post(
        '/auth/register',
        registerForm
      );

      localStorage.setItem(
        'token',
        data.token
      );

      navigate('/dashboard');
    } catch (error) {
      setError(
        error.response?.data?.message ||
          'Registration failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleRegister}
        className="bg-white w-full max-w-md p-6 rounded-lg shadow-md space-y-4"
      >
        <h1 className="text-2xl font-bold text-center">
          Create Account
        </h1>

        {error && (
          <p className="text-red-500 text-sm">
            {error}
          </p>
        )}

        <div>
          <label className="block mb-1">
            Name
          </label>

          <input
            type="text"
            name="name"
            value={registerForm.name}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block mb-1">
            Email
          </label>

          <input
            type="email"
            name="email"
            value={registerForm.email}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block mb-1">
            Password
          </label>

          <input
            type="password"
            name="password"
            value={registerForm.password}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded p-2"
        >
          {loading
            ? 'Creating Account...'
            : 'Register'}
        </button>

        <p className="text-center text-sm">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-blue-600"
          >
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;