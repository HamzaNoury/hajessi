import { getOrdersFromSheet } from "@/lib/sheets";

export default async function AdminDashboardPage() {
  const orders = await getOrdersFromSheet();
  const today = new Date().toISOString().split("T")[0];

  const totalOrders = orders.length;
  const todayOrders = orders.filter((o) => o.date.startsWith(today)).length;
  const pendingOrders = orders.filter(
    (o) => o.status === "nouvelle" || o.status === "confirmée"
  ).length;
  const revenue = orders
    .filter((o) => o.status !== "annulée")
    .reduce((sum, o) => sum + o.total, 0);

  const stats = [
    { label: "Total commandes", value: totalOrders },
    { label: "Commandes aujourd'hui", value: todayOrders },
    { label: "En attente", value: pendingOrders },
    {
      label: "Revenu estimé",
      value: `${revenue.toLocaleString("fr-MA")} MAD`,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-serif text-gray-900 mb-8">Vue d&apos;ensemble</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
          >
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
              {stat.label}
            </p>
            <p className="text-3xl font-serif text-gold-dark">{stat.value}</p>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <strong>Google Sheets non configuré.</strong> Configurez{" "}
          <code className="bg-amber-100 px-1 rounded">GOOGLE_SHEET_WEBAPP_URL</code>{" "}
          dans <code className="bg-amber-100 px-1 rounded">.env.local</code> pour
          voir les commandes ici. Voir <code>docs/SETUP.md</code> pour les
          instructions.
        </div>
      )}
    </div>
  );
}
