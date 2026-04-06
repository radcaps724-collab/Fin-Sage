"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminNavItem {
  label: string;
  href: string;
}

const adminNavItems: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Transactions", href: "/admin/transactions" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar panel">
      <div className="admin-sidebar-top">
        <h2>FinSage Admin</h2>
        <p>Control center</p>
      </div>
      <nav className="admin-sidebar-nav" aria-label="Admin navigation">
        {adminNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-link ${isActive ? "active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
