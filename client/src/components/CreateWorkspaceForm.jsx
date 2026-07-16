import { handleChange } from '../utils/handlechange.js';

const CreateWorkspaceForm = ({ form, setForm, onSubmit, loading, error }) => {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-lg">
          ➕
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">New Workspace</h2>
          <p className="text-xs text-white/40">Create a new team workspace</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Workspace name"
          value={form.name}
          onChange={(e) => handleChange(e, setForm)}
          required
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
        />

        <textarea
          name="description"
          placeholder="Short description (optional)"
          value={form.description}
          onChange={(e) => handleChange(e, setForm)}
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition resize-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition shadow-lg shadow-violet-600/20"
        >
          {loading ? 'Creating...' : 'Create Workspace'}
        </button>
      </form>
    </div>
  );
};

export default CreateWorkspaceForm;
