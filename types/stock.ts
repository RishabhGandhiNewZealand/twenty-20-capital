export interface StockPrice {
  symbol: string
  currentPrice: number
  currency: string
  longName: string
  exchangeName: string
  lastUpdated: string
}

export interface StockPriceError {
  error: string
} 