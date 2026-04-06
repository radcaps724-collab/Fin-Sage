import { ThemeToggle } from "@/components/ThemeToggle";

export interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

export function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  return (
    <header className="admin-header panel">
      <div>
        <h1 className="section-title">{title}</h1>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      <ThemeToggle />
    </header>
  );
}
