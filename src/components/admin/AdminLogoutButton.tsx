"use client";

export function AdminLogoutButton() {
  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-sm text-red-500 hover:text-red-700"
    >
      Déconnexion
    </button>
  );
}
