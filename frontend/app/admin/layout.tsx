import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <section className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">{children}</div>
    </section>
  );
}
