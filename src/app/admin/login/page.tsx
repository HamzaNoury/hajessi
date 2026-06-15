"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      setError("Mot de passe incorrect");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gold flex items-center justify-center">
            <span className="font-serif text-gold text-xl" dir="rtl">
              هاجسي
            </span>
          </div>
          <h1 className="font-serif text-2xl text-gray-900 tracking-widest">
            HAJESSI
          </h1>
          <p className="text-gray-500 text-sm mt-1">Administration</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 px-4 py-3 rounded text-gray-900 focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gray-900 text-white text-sm tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
