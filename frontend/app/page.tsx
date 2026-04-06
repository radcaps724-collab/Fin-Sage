"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSplash } from "@/components/LoadingSplash";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace("/splash");
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [router]);

  return <LoadingSplash label="Loading FinSage..." />;
}
