import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getProducts, saveProducts } from "@/lib/products";
import type { Product } from "@/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as Partial<Product>;
  const products = await getProducts();
  const index = products.findIndex((p) => p.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }

  products[index] = { ...products[index], ...body, id };
  await saveProducts(products);
  return NextResponse.json(products[index]);
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await context.params;
  const products = await getProducts();
  const filtered = products.filter((p) => p.id !== id);

  if (filtered.length === products.length) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }

  await saveProducts(filtered);
  return NextResponse.json({ success: true });
}
