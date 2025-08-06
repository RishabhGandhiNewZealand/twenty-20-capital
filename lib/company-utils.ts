// Company domain mapping for logo URLs
const COMPANY_DOMAINS: Record<string, string> = {
  'UBER': 'uber.com',
  'GOOGL': 'google.com',
  'AMZN': 'amazon.com',
  'META': 'meta.com',
  'NFLX': 'netflix.com',
  'MA': 'mastercard.com',
  'ASML': 'asml.com',
  'SPGI': 'spglobal.com',
  'MFT': 'mainfreight.com',
  'CRM': 'salesforce.com',
  'UNH': 'unitedhealthgroup.com',
  'ANET': 'arista.com',
  'CP': 'cpr.ca',
  'MSCI': 'msci.com',
  'MSFT': 'microsoft.com',
  'TSLA': 'tesla.com',
  'FCG': 'fonterra.com',
  'FBU': 'fletcherbuilding.com'
}

export function getCompanyDomain(symbol: string): string {
  return COMPANY_DOMAINS[symbol] || `${symbol.toLowerCase()}.com`
}

export function getLogoUrl(symbol: string): string {
  return `https://logo.clearbit.com/${getCompanyDomain(symbol)}`
}