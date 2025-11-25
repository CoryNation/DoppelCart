import { LayoutDashboard, Users } from "lucide-react";
import { getServerUser } from "@/lib/auth/getServerUser";
import AuthenticatedLayoutClient from "@/components/auth/AuthenticatedLayoutClient";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Verify user is authenticated - redirects to /auth/login if not
  await getServerUser();

  const sidebarItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      label: "Personas",
      href: "/personas",
      icon: <Users className="h-5 w-5" />,
    },
  ];

  return (
    <AuthenticatedLayoutClient sidebarItems={sidebarItems}>
      {children}
    </AuthenticatedLayoutClient>
  );
}

