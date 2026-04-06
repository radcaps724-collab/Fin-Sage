import { AppChrome } from "@/components/AppChrome";
import { Suspense } from "react";
import { LoadingSplash } from "@/components/LoadingSplash";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingSplash label="Loading dashboard..." />}>
      <AppChrome>{children}</AppChrome>
    </Suspense>
  );
}
