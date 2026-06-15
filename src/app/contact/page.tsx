"use client";

import { useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        message: form.get("message"),
      }),
    });
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="text-center mb-14">
        <h1 className="font-serif text-4xl text-gold-gradient mb-3">Contact</h1>
        <div className="gold-line w-24 mx-auto mt-6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div>
            <h2 className="font-serif text-gold text-sm tracking-widest uppercase mb-4">
              Coordonnées
            </h2>
            <div className="space-y-3 text-cream/70 text-sm">
              <p>📍 Casablanca, Maroc</p>
              <p>📞 +212 6XX XXX XXX</p>
              <p>✉️ contact@hajessi.ma</p>
            </div>
          </div>

          <div>
            <h2 className="font-serif text-gold text-sm tracking-widest uppercase mb-4">
              Réseaux sociaux
            </h2>
            <div className="flex gap-4">
              {[
                { name: "Instagram", href: "https://instagram.com/hajessi" },
                { name: "Facebook", href: "https://facebook.com/hajessi" },
                { name: "TikTok", href: "https://tiktok.com/@hajessi" },
              ].map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 border border-gold/40 text-gold text-sm hover:bg-gold/10 transition-colors"
                >
                  <span className="w-6 h-6 rounded-full border border-gold flex items-center justify-center text-xs">
                    {s.name[0]}
                  </span>
                  {s.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div>
          {sent ? (
            <div className="p-8 bg-bg-card border border-gold/20 text-center">
              <p className="text-gold font-serif text-xl mb-2">Message envoyé</p>
              <p className="text-cream/60 text-sm">
                Nous vous répondrons dans les plus brefs délais.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs text-gold uppercase tracking-widest mb-2">
                  Nom
                </label>
                <input
                  name="name"
                  required
                  className="w-full bg-bg-card border border-gold/30 text-cream px-4 py-3 rounded-sm focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-xs text-gold uppercase tracking-widest mb-2">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full bg-bg-card border border-gold/30 text-cream px-4 py-3 rounded-sm focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-xs text-gold uppercase tracking-widest mb-2">
                  Message
                </label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  className="w-full bg-bg-card border border-gold/30 text-cream px-4 py-3 rounded-sm focus:border-gold resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 border border-gold text-gold text-sm tracking-widest uppercase hover:bg-gold hover:text-bg-deep transition-colors disabled:opacity-50"
              >
                {loading ? "Envoi..." : "Envoyer"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
