import { redirect } from "next/navigation";

export const metadata = {
  title: "API Docs",
  description: "Interactive REST API documentation",
};

export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (
    // process.env.NODE_ENV === "production" &&
    process.env.ENABLE_SWAGGER !== "true"
  ) {
    redirect("/");
  }

  return <>{children}</>;
}