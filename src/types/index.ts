export type ProductCategory = "homme" | "femme" | "unisexe";

export type OrderStatus =
  | "nouvelle"
  | "confirmée"
  | "en livraison"
  | "livrée"
  | "annulée";

export interface OlfactoryNotes {
  tete: string;
  coeur: string;
  fond: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  description: string;
  notes: OlfactoryNotes;
  category: ProductCategory;
  imageUrl: string;
  stock: number;
  featured?: boolean;
}

export interface Order {
  id: string;
  date: string;
  clientName: string;
  phone: string;
  city: string;
  address: string;
  productName: string;
  productId?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: OrderStatus;
}

export interface OrderFormData {
  clientName: string;
  phone: string;
  city: string;
  address: string;
  productId: string;
  quantity: number;
}
