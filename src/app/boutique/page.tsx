import { getProducts } from "@/lib/products";
import { BoutiqueClient } from "@/components/BoutiqueClient";

export const metadata = {
  title: "Boutique",
};

export default async function BoutiquePage() {
  const products = await getProducts();
  return <BoutiqueClient products={products} />;
}
