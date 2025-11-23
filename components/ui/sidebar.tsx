"use client";

import { HTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun } from "lucide-react";
import Button from "./button";

export interface SidebarProps extends HTMLAttributes<HTMLDivElement> {
  logo?: ReactNode;
  items: SidebarItem[];
  footer?: ReactNode;
}

export interface SidebarItem {
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: ReactNode;
}

export function Sidebar({ className, logo, items, footer, ...props }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-screen w-64 flex-col border-r border-border bg-surface-container",
        className
      )}
      {...props}
    >
      {/* Logo */}
      {logo && (
        <div className="flex h-16 items-center border-b border-border px-6">
          {logo}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-body-m font-medium transition-motion",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-text-secondary hover:bg-surface-container-high hover:text-text-primary"
                  )}
                >
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  <span className="flex-1">{item.label}</span>
                  {item.badge && <span className="flex-shrink-0">{item.badge}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4 space-y-2">
        {footer || <ThemeToggle />}
      </div>
    </aside>
  );
}

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

