import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: "filled" | "border";
  error?: boolean;
  errorMessage?: string;
  label?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant = "border",
      error = false,
      errorMessage,
      label,
      helperText,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const baseStyles =
      "w-full transition-motion focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed text-text-primary placeholder:text-text-tertiary";

    const variantStyles = {
      filled:
        "bg-surface-container-high border-0 rounded-lg px-4 py-2.5 focus:bg-surface-container-highest focus:ring-primary",
      border:
        "bg-transparent border-2 rounded-sm px-4 py-2.5 focus:ring-primary",
    };

    const errorStyles = error
      ? "border-danger focus:border-danger focus:ring-danger"
      : "border-border focus:border-border-focus";

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-body-m font-medium text-text-primary mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            baseStyles,
            variantStyles[variant],
            errorStyles,
            className
          )}
          aria-invalid={error}
          aria-describedby={
            error && errorMessage
              ? `${inputId}-error`
              : helperText
              ? `${inputId}-helper`
              : undefined
          }
          {...props}
        />
        {error && errorMessage && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-body-s text-danger"
            role="alert"
          >
            {errorMessage}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-body-s text-text-tertiary">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;





