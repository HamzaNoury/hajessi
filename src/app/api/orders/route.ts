import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getProductById } from "@/lib/products";
import {
  postOrderToSheet,
  getOrdersFromSheet,
  updateOrderStatusInSheet,
} from "@/lib/sheets";
import type { OrderStatus } from "@/types";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const dateFilter = searchParams.get("date");

  let orders = await getOrdersFromSheet();

  if (statusFilter && statusFilter !== "all") {
    orders = orders.filter((o) => o.status === statusFilter);
  }
  if (dateFilter) {
    orders = orders.filter((o) => o.date.startsWith(dateFilter));
  }

  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { clientName, phone, city, address, productId, quantity } = body;

  if (!clientName || !phone || !city || !address || !productId || !quantity) {
    return NextResponse.json(
      { error: "Tous les champs sont requis" },
      { status: 400 }
    );
  }

  const product = await getProductById(productId);
  if (!product) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }

  const order = {
    date: new Date().toISOString(),
    clientName,
    phone,
    city,
    address,
    productName: product.name,
    productId,
    quantity: Number(quantity),
    unitPrice: product.price,
    total: product.price * Number(quantity),
    status: "nouvelle" as const,
  };

  const result = await postOrderToSheet(order);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? "Erreur Google Sheets" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, order }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { rowIndex, status } = (await request.json()) as {
    rowIndex: number;
    status: OrderStatus;
  };

  const ok = await updateOrderStatusInSheet(rowIndex, status);
  if (!ok) {
    return NextResponse.json({ error: "Mise à jour échouée" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
