import { PortfolioHolding } from '@/types/portfolio'

// Static data as backup if file reading fails
export const staticPortfolioHoldings: PortfolioHolding[] = [
  {
    symbol: "META",
    name: "Meta Platforms Inc - Ordinary Shares - Class A",
    totalShares: 3.2752,
    avgPriceNZD: 756.64,
    avgPriceUSD: 461.37,
    allocation: 0,
    instrumentCurrency: "USD",
    marketCode: "NASDAQ",
    firstPurchaseDate: "2024-03-15"
  },
  {
    symbol: "AMZN", 
    name: "Amazon.com Inc.",
    totalShares: 7.6118,
    avgPriceNZD: 341.89,
    avgPriceUSD: 200.33,
    allocation: 0,
    instrumentCurrency: "USD",
    marketCode: "NASDAQ",
    firstPurchaseDate: "2024-07-30"
  },
  {
    symbol: "NFLX",
    name: "Netflix Inc.",
    totalShares: 2.0000,
    avgPriceNZD: 1152.77,
    avgPriceUSD: 720.16,
    allocation: 0,
    instrumentCurrency: "USD", 
    marketCode: "NASDAQ",
    firstPurchaseDate: "2024-08-29"
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc - Ordinary Shares - Class A",
    totalShares: 18.0000,
    avgPriceNZD: 270.14,
    avgPriceUSD: 169.42,
    allocation: 0,
    instrumentCurrency: "USD",
    marketCode: "NASDAQ",
    firstPurchaseDate: "2024-12-09"
  },
  {
    symbol: "ASML",
    name: "ASML Holding NV - New York Shares", 
    totalShares: 4.0000,
    avgPriceNZD: 1221.04,
    avgPriceUSD: 717.75,
    allocation: 0,
    instrumentCurrency: "USD",
    marketCode: "NASDAQ",
    firstPurchaseDate: "2025-01-06"
  },
  {
    symbol: "UBER",
    name: "Uber Technologies Inc",
    totalShares: 36.2042,
    avgPriceNZD: 116.26,
    avgPriceUSD: 67.97,
    allocation: 0,
    instrumentCurrency: "USD",
    marketCode: "NYSE",
    firstPurchaseDate: "2024-11-18"
  },
  {
    symbol: "SPGI",
    name: "S&P Global Inc",
    totalShares: 5.0000,
    avgPriceNZD: 894.66,
    avgPriceUSD: 505.18,
    allocation: 0,
    instrumentCurrency: "USD",
    marketCode: "NYSE",
    firstPurchaseDate: "2024-12-09"
  },

  {
    symbol: "MA",
    name: "Mastercard Incorporated - Ordinary Shares - Class A",
    totalShares: 4.0854,
    avgPriceNZD: 771.88,
    avgPriceUSD: 448.11,
    allocation: 0,
    instrumentCurrency: "USD",
    marketCode: "NYSE",
    firstPurchaseDate: "2024-06-07"
  },
  {
    symbol: "MFT",
    name: "Mainfreight Limited",
    totalShares: 25.5603,
    avgPriceNZD: 63.20,
    avgPriceUSD: undefined,
    allocation: 0,
    instrumentCurrency: "NZD",
    marketCode: "NZX",
    firstPurchaseDate: "2023-09-04"
  }
]

export const staticExitedPositions = [
  {
    symbol: "UNH",
    name: "Unitedhealth Group Inc",
    instrumentCurrency: "USD",
    marketCode: "NYSE",
    entryDate: "2024-02-07",
    exitDate: "2024-12-06",
    totalInvestedNZD: 3118.25,
    totalReturnNZD: 5063.59,
    profitLossNZD: 1945.34,
    profitLossPercentage: 62.4
  },
  {
    symbol: "CRM",
    name: "Salesforce Inc",
    instrumentCurrency: "USD",
    marketCode: "NYSE",
    entryDate: "2024-05-30",
    exitDate: "2025-03-31",
    totalInvestedNZD: 2404.02,
    totalReturnNZD: 3342.26,
    profitLossNZD: 938.24,
    profitLossPercentage: 39.0
  },
  {
    symbol: "CP",
    name: "Canadian Pacific Kansas City Limited",
    instrumentCurrency: "USD", 
    marketCode: "NYSE",
    entryDate: "2023-12-26",
    exitDate: "2025-02-03",
    totalInvestedNZD: 2408.45,
    totalReturnNZD: 2666.98,
    profitLossNZD: 258.53,
    profitLossPercentage: 10.7
  },
  {
    symbol: "MSCI",
    name: "MSCI Inc",
    instrumentCurrency: "USD",
    marketCode: "NYSE", 
    entryDate: "2024-07-08",
    exitDate: "2025-02-03",
    totalInvestedNZD: 1003.31,
    totalReturnNZD: 1283.93,
    profitLossNZD: 280.62,
    profitLossPercentage: 28.0
  },
  {
    symbol: "ANET",
    name: "Arista Networks Inc",
    instrumentCurrency: "USD",
    marketCode: "NYSE",
    entryDate: "2025-02-20", 
    exitDate: "2025-02-21",
    totalInvestedNZD: 518.84,
    totalReturnNZD: 504.82,
    profitLossNZD: -14.02,
    profitLossPercentage: -2.7
  }
] 