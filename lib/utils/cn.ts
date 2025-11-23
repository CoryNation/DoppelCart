import { clsx, type ClassValue } from "clsx";

/**
 * Utility function to merge Tailwind CSS classes.
 * Combines clsx for conditional classes with Tailwind's class merging.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

