import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortenAddress(address: string, startLength = 6, endLength = 4): string {
  if (!address) return "N/A"
  if (address.length <= startLength + endLength) return address
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`
}

export function formatAmount(amount: any, decimals:any): any {
  if (!amount) return "0"
  const num = Number.parseFloat(amount) / Math.pow(10, decimals)
  return num.toLocaleString(undefined, { maximumFractionDigits: 6 })
}

export function formatTimestamp(timestamp: string): string {
  if (!timestamp) return "N/A"
  return new Date(Number.parseInt(timestamp) * 1000).toLocaleString()
}
