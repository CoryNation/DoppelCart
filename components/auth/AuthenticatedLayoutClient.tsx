"use client";

import Link from "next/link";
import { Sidebar } from "@/components/ui/sidebar";
import { Moon, Sun, Settings } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import Button from "@/components/ui/button";
import LogoutButton from "./LogoutButton";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="text"
      size="md"
      onClick={toggleTheme}
      className="w-full justify-start"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <>
          <Moon className="mr-2 h-4 w-4" />
          Dark Mode
        </>
      ) : (
        <>
          <Sun className="mr-2 h-4 w-4" />
          Light Mode
        </>
      )}
    </Button>
  );
}

interface AuthenticatedLayoutClientProps {
  children: React.ReactNode;
  sidebarItems: Array<{
    label: string;
    href: string;
    icon: React.ReactNode;
  }>;
}

export default function AuthenticatedLayoutClient({
  children,
  sidebarItems,
}: AuthenticatedLayoutClientProps) {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar
        logo={
          <Link href="/dashboard" className="text-h4 font-bold text-text-primary">
            DoppleCart
          </Link>
        }
        items={sidebarItems}
        footer={
          <div className="space-y-2">
            <Button
              variant="text"
              size="md"
              className="w-full justify-start text-text-secondary hover:text-text-primary"
              onClick={() => {}}
              asChild
            >
              <Link href="/settings/profile">
                <Settings className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </Button>
            <ThemeToggle />
            <LogoutButton variant="text" size="md" fullWidth />
          </div>
        }
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

