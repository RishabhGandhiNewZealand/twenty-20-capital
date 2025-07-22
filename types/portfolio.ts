export interface TradeRecord {
  code: string
  marketCode: string
  name: string
  date: string
  type: 'Buy' | 'Sell' | 'Reinvestment'
  qty: number
  price: number
  instrumentCurrency: string
  brokerage: number
  brokerageCurrency: string
  exchRate: number
  value: number
}

export interface PortfolioHolding {
  symbol: string
  name: string
  totalShares: number
  avgPriceNZD: number
  avgPriceUSD?: number // Only for USD stocks
  allocation: number
  currentValueNZD?: number // Calculated with current prices
  instrumentCurrency: string
  marketCode: string
  firstPurchaseDate: string
}

export interface ExitedPosition {
  symbol: string
  name: string
  instrumentCurrency: string
  marketCode: string
  entryDate: string
  exitDate: string
  totalInvestedNZD: number
  totalReturnNZD: number
  profitLossNZD: number
  profitLossPercentage: number
}

export interface PortfolioSummary {
  holdings: PortfolioHolding[]
  exitedPositions: ExitedPosition[]
  totalValueNZD: number
  lastUpdated: string
} 