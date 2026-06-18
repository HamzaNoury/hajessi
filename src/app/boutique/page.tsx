import { Suspense } from "react";
import { getProducts } from "@/lib/products";
import { BoutiqueClient } from "@/components/BoutiqueClient";

export const metadata = {
  title: "المتجر",
};

export default async function BoutiquePage() {
  const products = await getProducts();
  return (
    <Suspense>
      <BoutiqueClient products={products} />
    </Suspense>
  );
}
