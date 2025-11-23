import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "filled" | "tonal" | "outline" | "text";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "filled",
      size = "md",
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-motion focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variantStyles = {
      filled:
        "bg-primary text-text-on-primary hover:bg-primary-hover active:bg-primary-active shadow-sm hover:shadow-md",
      tonal:
        "bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/30",
      outline:
        "border-2 border-border text-text-primary hover:border-border-hover hover:bg-surface-container-high active:bg-surface-container-highest",
      text: "text-primary hover:bg-surface-container-high active:bg-surface-container-highest",
    };

    const sizeStyles = {
      sm: "text-body-s px-3 py-1.5 rounded-sm",
      md: "text-body-m px-4 py-2 rounded-sm",
      lg: "text-body-l px-6 py-3 rounded-md",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;

