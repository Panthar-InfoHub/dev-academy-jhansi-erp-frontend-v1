import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface serverResponseParserArguments<T> {
  status: "SUCCESS" | "ERROR"
  message?: string
  data?: T
  count?: number
}

export function parseServerResponse<T>(args: serverResponseParserArguments<T>) {
  return {
    status: args.status,
    message: args.message || "",
    data: args.data,
    count: args.count,
  }
}

export function normalizeDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function getInitials(name: string): string {
  // Trim whitespace and split the name into words
  const words = name.trim().split(/\s+/);

  if (words.length === 0) {
    return "";
  }

  // If there's only one word, return the first character of that word.
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  // Return the first letter of the first and last words.
  const firstInitial = words[0].charAt(0).toUpperCase();
  const lastInitial = words[words.length - 1].charAt(0).toUpperCase();
  
  return `${firstInitial}${lastInitial}`;
}
