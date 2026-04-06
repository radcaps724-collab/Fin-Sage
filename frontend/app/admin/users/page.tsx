"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { UsersTable } from "@/components/admin/UsersTable";
import { getUsers, type User } from "@/lib/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        if (mounted) {
          setUsers(data);
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load users."
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchUsers();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="grid">
      <AdminHeader
        title="Users"
        subtitle="Manage and monitor registered platform users."
      />

      {isLoading && <p className="section-subtitle">Loading users...</p>}
      {errorMessage && <p style={{ color: "var(--danger)" }}>{errorMessage}</p>}
      {!isLoading && !errorMessage && <UsersTable users={users} />}
    </section>
  );
}
