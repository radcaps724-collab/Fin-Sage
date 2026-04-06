"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getCurrentUser, logoutUser } from "@/lib/api";
import styles from "@/styles/components/AppChrome.module.css";

const navItems = [
  { label: "Dashboard", href: "/dashboard", hint: "Today at a glance" },
  { label: "Transactions", href: "/transactions", hint: "Voice and manual logging" },
  { label: "Insights", href: "/insights", hint: "Patterns and nudges" },
  { label: "Profile", href: "/profile", hint: "Identity and preferences" },
];

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const validateFlow = async () => {
      try {
        const me = await getCurrentUser();
        setUserName(me.name);
        if (!me.onboardingCompleted) {
          router.replace("/onboarding");
        }
      } catch {
        router.replace("/login");
      }
    };
    void validateFlow();
  }, [router]);

  const avatarText = useMemo(() => {
    const parts = userName.trim().split(" ").filter(Boolean);
    if (parts.length === 0) {
      return "US";
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }, [userName]);

  const currentSection =
    navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.label ??
    "FinSage";

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className={`${styles.layout} ${collapsed ? styles.layoutCollapsed : ""}`}>
      <aside className={`${styles.sidebar} ${styles.panel}`}>
        <div className={styles.brandBlock}>
          <div className={styles.brandMark}>FS</div>
          {!collapsed && (
            <div>
              <p className={styles.eyebrow}>Voice-first finance</p>
              <h2>FinSage</h2>
            </div>
          )}
          <button
            type="button"
            className={styles.sidebarToggle}
            onClick={() => setCollapsed((value) => !value)}
            aria-label="Toggle sidebar"
          >
            {collapsed ? ">" : "<"}
          </button>
        </div>
        {!collapsed && (
          <div className={styles.userRail}>
            <div className={styles.avatarLarge}>{avatarText}</div>
            <div>
              <p className={styles.userLabel}>Signed in as</p>
              <strong>{userName}</strong>
            </div>
          </div>
        )}
        <nav className={styles.sidebarNav}>
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.sidebarLink} ${active ? styles.sidebarLinkActive : ""}`}
              >
                <span className={styles.navLabel}>{item.label}</span>
                {!collapsed && <span className={styles.navHint}>{item.hint}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className={styles.main}>
        <header className={`${styles.topbar} ${styles.panel}`}>
          <div>
            <p className={styles.eyebrow}>Personal finance assistant</p>
            <strong className={styles.topbarTitle}>{currentSection}</strong>
          </div>
          <div className={styles.topbarActions}>
            <ThemeToggle />
            <div className={styles.avatar}>{avatarText}</div>
            <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>
        <main className={styles.pageBody}>{children}</main>
      </div>
    </div>
  );
}
