import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api.js';
import { handleChange } from '../utils/handlechange.js';

const Register = () => {
  const navigate = useNavigate();

  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      const { data } = await api.post('/auth/register', registerForm);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] px-4">

      {/* Card */}
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl">

        {/* Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-white tracking-wide">
            ✅ TaskFlow
          </Link>
          <h1 className="text-xl font-semibold text-white mt-3">
            Create your account
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Start organizing your work today
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-5">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Full name
            </label>
            <input
              type="text"
              name="name"
              value={registerForm.name}
              onChange={(e) => handleChange(e, setRegisterForm)}
              placeholder="John Doe"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Email address
            </label>
            <input
              type="email"
              name="email"
              value={registerForm.email}
              onChange={(e) => handleChange(e, setRegisterForm)}
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
              value={registerForm.password}
              onChange={(e) => handleChange(e, setRegisterForm)}
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

        </form>

        {/* Footer link */}
        <p className="text-center text-sm text-white/80 mt-6">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-green-400 hover:text-green-500 font-medium transition"
          >
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Register;