"use client";

import { useEffect, useState } from "react";
import type { Order, OrderStatus } from "@/types";

const statuses: OrderStatus[] = [
  "nouvelle",
  "confirmée",
  "en livraison",
  "livrée",
  "annulée",
];

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<(Order & { rowIndex?: number })[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  async function loadOrders() {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (dateFilter) params.set("date", dateFilter);
    const res = await fetch(`/api/orders?${params}`);
    const data = await res.json();
    setOrders(data);
  }

  useEffect(() => {
    loadOrders();
  }, [statusFilter, dateFilter]);

  async function updateStatus(rowIndex: number, status: OrderStatus) {
    await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowIndex, status }),
    });
    loadOrders();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-serif text-gray-900 mb-8">
        Gestion commandes
      </h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 px-3 py-2 rounded text-sm text-gray-900"
        >
          <option value="all">Tous les statuts</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="border border-gray-300 px-3 py-2 rounded text-sm text-gray-900"
        />
      </div>

      {orders.length === 0 ? (
        <p className="text-gray-500 text-sm">
          Aucune commande. Configurez Google Sheets pour synchroniser les
          commandes.
        </p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 text-gray-600">Date</th>
                <th className="text-left p-3 text-gray-600">Client</th>
                <th className="text-left p-3 text-gray-600">Téléphone</th>
                <th className="text-left p-3 text-gray-600">Adresse</th>
                <th className="text-left p-3 text-gray-600">Produit</th>
                <th className="text-left p-3 text-gray-600">Qté</th>
                <th className="text-left p-3 text-gray-600">Total</th>
                <th className="text-left p-3 text-gray-600">Statut</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-gray-600 whitespace-nowrap">
                    {new Date(order.date).toLocaleDateString("fr-MA")}
                  </td>
                  <td className="p-3 text-gray-900">{order.clientName}</td>
                  <td className="p-3 text-gray-600">{order.phone}</td>
                  <td className="p-3 text-gray-600 max-w-[150px] truncate">
                    {order.city}, {order.address}
                  </td>
                  <td className="p-3 text-gray-900">{order.productName}</td>
                  <td className="p-3 text-gray-600">{order.quantity}</td>
                  <td className="p-3 text-gray-900 font-medium">
                    {order.total.toLocaleString("fr-MA")} MAD
                  </td>
                  <td className="p-3">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        updateStatus(
                          order.rowIndex ?? i + 2,
                          e.target.value as OrderStatus
                        )
                      }
                      className="border border-gray-300 px-2 py-1 rounded text-xs text-gray-900"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
