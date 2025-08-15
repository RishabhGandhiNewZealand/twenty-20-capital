export interface TradeRecord {
  id?: number | string // Optional for new trades, can be string for temporary IDs
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
  deleted_flag?: boolean
  deleted_at?: string
  created_at?: string
  updated_at?: string
  user_id?: string
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