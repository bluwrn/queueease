import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, KeyRound, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AdminLoginPage() {
  const { token, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (token) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(form);
      navigate(location.state?.from?.pathname || "/admin", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login gagal. Periksa koneksi backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="rounded-xl bg-blue-50 p-3 text-blue-700"><KeyRound size={22} /></span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Login Petugas</h2>
            <p className="mt-1 text-sm text-slate-500">Masuk untuk mengelola antrean.</p>
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} />{error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-username" className="mb-1.5 block text-sm font-semibold text-slate-700">Username</label>
            <input
              id="admin-username"
              autoComplete="username"
              required
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <button
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn size={17} />{loading ? "Memeriksa..." : "Login"}
          </button>
        </form>
      </section>
    </div>
  );
}
