import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white font-sans">

      {/* Navbar */}
      <nav className="flex justify-between items-center px-12 py-5 border-b border-white/10">
        <h2 className="text-xl font-bold tracking-wide">
          ✅ TaskFlow
        </h2>
        <div className="flex gap-3">
          <Link
            to="/login"
            className="px-5 py-2 rounded-lg border border-white/30 text-sm text-white hover:bg-white/10 transition"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-5 py-2 rounded-lg bg-violet-600 text-sm font-semibold text-white hover:bg-violet-700 transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="text-center px-6 pt-24 pb-20">
        <h1 className="text-5xl font-extrabold leading-tight mb-5">
          Organize Work.<br />
          <span className="text-violet-400">Achieve More.</span>
        </h1>
        <p className="text-lg text-white/60 max-w-xl mx-auto mb-10 leading-relaxed">
          A simple, powerful task management tool to help teams stay focused,
          collaborate seamlessly, and ship faster.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            to="/register"
            className="px-8 py-3 rounded-xl bg-violet-600 text-white font-bold text-base hover:bg-violet-700 transition shadow-lg shadow-violet-600/40"
          >
            Get Started Free →
          </Link>
          <Link
            to="/login"
            className="px-8 py-3 rounded-xl border border-white/25 bg-white/5 text-white font-semibold text-base hover:bg-white/10 transition"
          >
            Login
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-12 pb-20 max-w-5xl mx-auto">
        <h2 className="text-center text-2xl font-bold mb-12 text-white/90">
          Everything you need to stay on track
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Card 1 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-7 backdrop-blur-md hover:bg-white/10 transition">
            <div className="text-3xl mb-3">🗂️</div>
            <h3 className="text-base font-bold mb-2">Workspaces</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Create dedicated workspaces for every project. Keep everything
              organized and context-separated.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-7 backdrop-blur-md hover:bg-white/10 transition">
            <div className="text-3xl mb-3">✅</div>
            <h3 className="text-base font-bold mb-2">Task Boards</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Manage tasks with priority levels, due dates, and status tracking
              — all in one place.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-7 backdrop-blur-md hover:bg-white/10 transition">
            <div className="text-3xl mb-3">🤝</div>
            <h3 className="text-base font-bold mb-2">Team Collaboration</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Invite teammates, assign tasks, and keep everyone aligned with
              real-time updates.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-white/10 text-white/40 text-sm">
        © {new Date().getFullYear()} TaskFlow. Built with ❤️ using MERN Stack.
      </footer>

    </div>
  );
};

export default Home;
