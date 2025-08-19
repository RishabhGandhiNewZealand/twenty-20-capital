export interface TradeRecord {
  id?: number // Optional for new trades that haven't been saved yet
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
  // Stored amounts in base currency
  baseValue: number // qty * price (+ brokerage) in baseCurrency at trade date
  baseCurrency: string // e.g., 'USD', 'NZD', 'EUR'
  user_id?: string
  deleted_flag?: boolean
  deleted_at?: string
  created_at?: string
  updated_at?: string
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