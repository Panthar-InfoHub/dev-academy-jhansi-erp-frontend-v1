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
