import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function na(value?: string | number | null): string {
  if (value === null || value === undefined) return "Non disponible"
  const s = String(value).trim()
  return s ? s : "Non disponible"
}
