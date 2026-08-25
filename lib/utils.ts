import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Mask an email address for privacy display (e.g. `al***@gmail.com`)
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '';
  return email.replace(/(.{2})(.*)(?=@)/, (_gp1: string, gp2: string, gp3: string) => {
    let mask = '';
    for (let i = 0; i < gp3.length; i++) mask += '*';
    return gp2 + mask;
  });
}
