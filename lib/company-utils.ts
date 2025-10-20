export function getLogoUrl(symbol: string, size: number = 64): string {
  const s = encodeURIComponent(symbol)
  return `/api/logo/${s}?size=${size}`
}