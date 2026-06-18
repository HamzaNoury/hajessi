import type { Product } from "@/types";

export function isProductAvailable(product: Product): boolean {
  return product.stock > 0;
}
