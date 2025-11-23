"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/browserClient";
import Button from "@/components/ui/button";

interface LogoutButtonProps {
  variant?: "filled" | "tonal" | "outline" | "text";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
}

export default function LogoutButton({
  variant = "text",
  size = "md",
  fullWidth = false,
  className,
}: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? "Signing out..." : "Log out"}
    </Button>
  );
}

