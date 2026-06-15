import { GOOGLE_SHEET_WEBAPP_URL } from "./config";
import type { Order, OrderStatus } from "@/types";

/** Envoie une nouvelle commande vers Google Sheets via Apps Script */
export async function postOrderToSheet(
  order: Omit<Order, "id">
): Promise<{ success: boolean; error?: string }> {
  if (GOOGLE_SHEET_WEBAPP_URL.includes("VOTRE_DEPLOYMENT_ID")) {
    console.warn(
      "[HAJESSI] GOOGLE_SHEET_WEBAPP_URL non configurée — commande enregistrée localement uniquement"
    );
    return { success: true };
  }

  try {
    const res = await fetch(GOOGLE_SHEET_WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        date: order.date,
        clientName: order.clientName,
        phone: order.phone,
        city: order.city,
        address: order.address,
        productName: order.productName,
        quantity: order.quantity,
        unitPrice: order.unitPrice,
        total: order.total,
        status: order.status,
      }),
    });

    if (!res.ok) {
      return { success: false, error: `Sheets API error: ${res.status}` };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur réseau",
    };
  }
}

/** Récupère toutes les commandes depuis Google Sheets */
export async function getOrdersFromSheet(): Promise<Order[]> {
  if (GOOGLE_SHEET_WEBAPP_URL.includes("VOTRE_DEPLOYMENT_ID")) {
    return [];
  }

  try {
    const res = await fetch(`${GOOGLE_SHEET_WEBAPP_URL}?action=list`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { orders?: Order[] };
    return data.orders ?? [];
  } catch {
    return [];
  }
}

/** Met à jour le statut d'une commande dans Google Sheets */
export async function updateOrderStatusInSheet(
  rowIndex: number,
  status: OrderStatus
): Promise<boolean> {
  if (GOOGLE_SHEET_WEBAPP_URL.includes("VOTRE_DEPLOYMENT_ID")) {
    return false;
  }

  try {
    const res = await fetch(GOOGLE_SHEET_WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateStatus", rowIndex, status }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
