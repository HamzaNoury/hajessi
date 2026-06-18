import { promises as fs } from "fs";
import path from "path";
import type { Product } from "@/types";

const DATA_PATH = path.join(process.cwd(), "data", "products.json");

export async function getProducts(): Promise<Product[]> {
  const raw = await fs.readFile(DATA_PATH, "utf-8");
  return JSON.parse(raw) as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.id === id);
}

export async function saveProducts(products: Product[]): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(products, null, 2), "utf-8");
}

export async function getFeaturedProducts(): Promise<Product[]> {
  return getProducts();
}

export async function getAvailableProducts(): Promise<Product[]> {
  return getProducts();
}

export async function getProductsByCategory(
  category: Product["category"]
): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((p) => p.category === category);
}
