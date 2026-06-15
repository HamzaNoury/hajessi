import Link from "next/link";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

const navItems = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/products", label: "Produits" },
  { href: "/admin/orders", label: "Commandes" },
];

export function AdminNav() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <Link
          href="/admin"
          className="font-serif text-gold-dark font-bold tracking-widest"
        >
          HAJESSI Admin
        </Link>
        <nav className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-gray-600 hover:text-gold-dark transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <AdminLogoutButton />
        </nav>
      </div>
    </header>
  );
}
