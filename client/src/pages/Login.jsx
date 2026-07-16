import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import { handleChange } from '../utils/handlechange.js';


const Login = () => {
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      const { data } = await api.post('/auth/login', loginForm);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] px-4">

      {/* Card */}
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-white tracking-wide">
            ✅ TaskFlow
          </Link>
          <h1 className="text-xl font-semibold text-white mt-3">
            Welcome back
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Sign in to continue to your workspace
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Email address
            </label>
            <input
              type="email"
              name="email"
              value={loginForm.email}
              onChange={(e) => handleChange(e, setLoginForm)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={loginForm.password}
              onChange={(e) => handleChange(e, setLoginForm)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition shadow-lg shadow-violet-600/30"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

        </form>

        {/* Footer link */}
        <p className="text-center text-sm text-white/80 mt-6">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="text-green-400 hover:text-green-500 font-medium transition"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;