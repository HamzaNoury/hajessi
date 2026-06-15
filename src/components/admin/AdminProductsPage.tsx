"use client";

import { useEffect, useState } from "react";
import type { Product, ProductCategory } from "@/types";

const emptyProduct = {
  name: "",
  price: 0,
  description: "",
  notes: { tete: "", coeur: "", fond: "" },
  category: "unisexe" as ProductCategory,
  imageUrl: "",
  stock: 0,
  featured: false,
};

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [showForm, setShowForm] = useState(false);

  async function loadProducts() {
    const res = await fetch("/api/products");
    setProducts(await res.json());
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function openAdd() {
    setEditing(null);
    setForm(emptyProduct);
    setShowForm(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      price: product.price,
      description: product.description,
      notes: product.notes,
      category: product.category,
      imageUrl: product.imageUrl,
      stock: product.stock,
      featured: product.featured ?? false,
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await fetch(`/api/products/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setShowForm(false);
    loadProducts();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce produit ?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    loadProducts();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-serif text-gray-900">Gestion produits</h1>
        <button
          type="button"
          onClick={openAdd}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800"
        >
          + Ajouter
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSave}
          className="mb-8 p-6 bg-white border border-gray-200 rounded-lg space-y-4"
        >
          <h2 className="font-serif text-lg">
            {editing ? "Modifier" : "Nouveau produit"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Nom"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border border-gray-300 px-3 py-2 rounded text-gray-900"
            />
            <input
              type="number"
              placeholder="Prix (MAD)"
              required
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: Number(e.target.value) })
              }
              className="border border-gray-300 px-3 py-2 rounded text-gray-900"
            />
            <select
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value as ProductCategory,
                })
              }
              className="border border-gray-300 px-3 py-2 rounded text-gray-900"
            >
              <option value="homme">Homme</option>
              <option value="femme">Femme</option>
              <option value="unisexe">Unisexe</option>
            </select>
            <input
              type="number"
              placeholder="Stock"
              value={form.stock}
              onChange={(e) =>
                setForm({ ...form, stock: Number(e.target.value) })
              }
              className="border border-gray-300 px-3 py-2 rounded text-gray-900"
            />
            <input
              placeholder="URL image"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="border border-gray-300 px-3 py-2 rounded text-gray-900 md:col-span-2"
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="border border-gray-300 px-3 py-2 rounded text-gray-900 md:col-span-2"
              rows={3}
            />
            <input
              placeholder="Notes tête"
              value={form.notes.tete}
              onChange={(e) =>
                setForm({
                  ...form,
                  notes: { ...form.notes, tete: e.target.value },
                })
              }
              className="border border-gray-300 px-3 py-2 rounded text-gray-900"
            />
            <input
              placeholder="Notes cœur"
              value={form.notes.coeur}
              onChange={(e) =>
                setForm({
                  ...form,
                  notes: { ...form.notes, coeur: e.target.value },
                })
              }
              className="border border-gray-300 px-3 py-2 rounded text-gray-900"
            />
            <input
              placeholder="Notes fond"
              value={form.notes.fond}
              onChange={(e) =>
                setForm({
                  ...form,
                  notes: { ...form.notes, fond: e.target.value },
                })
              }
              className="border border-gray-300 px-3 py-2 rounded text-gray-900"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) =>
                  setForm({ ...form, featured: e.target.checked })
                }
              />
              Produit vedette
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-gold-dark text-white text-sm rounded"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 text-sm rounded"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 text-gray-600">Nom</th>
              <th className="text-left p-3 text-gray-600">Catégorie</th>
              <th className="text-left p-3 text-gray-600">Prix</th>
              <th className="text-left p-3 text-gray-600">Stock</th>
              <th className="text-left p-3 text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-3 text-gray-900">{p.name}</td>
                <td className="p-3 text-gray-600">{p.category}</td>
                <td className="p-3 text-gray-900">
                  {p.price.toLocaleString("fr-MA")} MAD
                </td>
                <td className="p-3 text-gray-600">{p.stock}</td>
                <td className="p-3 space-x-2">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="text-gold-dark hover:underline"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="text-red-500 hover:underline"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
