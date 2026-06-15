import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getProducts, getProductById, saveProducts } from "@/lib/products";
import type { Product } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const product = await getProductById(id);
    if (!product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }
    return NextResponse.json(product);
  }

  const products = await getProducts();
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = (await request.json()) as Omit<Product, "id" | "slug"> & {
    name: string;
  };
  const products = await getProducts();
  const id = String(Date.now());
  const slug = body.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const newProduct: Product = { ...body, id, slug };
  products.push(newProduct);
  await saveProducts(products);

  return NextResponse.json(newProduct, { status: 201 });
}
