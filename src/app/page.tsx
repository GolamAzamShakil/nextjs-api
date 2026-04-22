"use client"
import { CanvasText } from "@/components/ui/canvas-text";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  const redirectUrl = "/api-docs";

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(redirectUrl);
    }, 60000);

    return () => clearTimeout(timer);
  }, [router]);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center text-center px-4">
      <div className="flex flex-col items-center space-y-4">
        <CanvasText
          text="Next.js REST API"
          className="text-6xl font-semibold"
          backgroundClassName="bg-teal-600 dark:bg-teal-700"
          colors={[
            /* "rgba(20, 184, 166, 1)",
            "rgba(20, 184, 166, 0.9)",
            "rgba(20, 184, 166, 0.8)",
            "rgba(20, 184, 166, 0.7)",
            "rgba(20, 184, 166, 0.6)", */
            /* "var(--primary)",
            "rgba(20, 184, 166, 0.9)",
            "rgba(20, 184, 166, 0.7)",
            "rgba(20, 184, 166, 0.5)", */
            "rgba(13, 148, 136, 1)", // teal-600
            "rgba(20, 184, 166, 1)", // teal-500
            "rgba(45, 212, 191, 1)", // teal-400
            "rgba(94, 234, 212, 1)", // teal-300
            "rgba(153, 246, 228, 1)", // teal-200
          ]}
          curveIntensity={90}
          lineGap={4}
          animationDuration={20}
        />

        <Link
          href={redirectUrl}
          className="block text-lg text-muted-foreground underline hover:text-primary transition-colors"
        >
          Continue to api-docs
        </Link>
      </div>
    </main>
  );
}
