import { FALLBACK_USD_TO_NZD_RATE } from './constants'
import { TradeRecord } from '@/types/portfolio'

export const CASH_SYMBOL = 'CASH'
export const CASH_NAME = 'Cash (NZD)'

const TRADE_TYPE_ORDER: Record<TradeRecord['type'], number> = {
  Sell: 0,
  Buy: 1,
  Reinvestment: 2,
}

/**
 * Return trades in ledger order. Sells are processed before buys on the same
 * date so sale proceeds can fund another purchase made that day.
 */
export function sortTradesInLedgerOrder(trades: TradeRecord[]): TradeRecord[] {
  return [...trades].sort((a, b) => {
    const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime()
    if (dateComparison !== 0) return dateComparison
    return TRADE_TYPE_ORDER[a.type] - TRADE_TYPE_ORDER[b.type]
  })
}

/**
 * Trades normally store their final NZD value. The price-based calculation is
 * retained as a defensive fallback for older or incomplete records.
 */
export function getTradeValueNZD(trade: TradeRecord): number {
  const storedValue = Number(trade.value)
  if (Number.isFinite(storedValue) && Math.abs(storedValue) > 0) {
    return Math.abs(storedValue)
  }

  const quantity = Math.abs(Number(trade.qty) || 0)
  const price = Math.abs(Number(trade.price) || 0)
  const tradeExchangeRate = Number(trade.exchRate)
  const usdToNzd = tradeExchangeRate > 0 ? 1 / tradeExchangeRate : FALLBACK_USD_TO_NZD_RATE
  const instrumentRate = trade.instrumentCurrency === 'USD' ? usdToNzd : 1
  const grossValueNZD = quantity * price * instrumentRate

  const brokerage = Math.abs(Number(trade.brokerage) || 0)
  const brokerageNZD = brokerage * (trade.brokerageCurrency === 'USD' ? usdToNzd : 1)

  return trade.type === 'Sell'
    ? Math.max(0, grossValueNZD - brokerageNZD)
    : grossValueNZD + brokerageNZD
}

/**
 * Cash is never withdrawn: sale proceeds accumulate and subsequent buys use
 * that balance before they are treated as new portfolio contributions.
 */
export function applyTradeToCashBalance(cashBalanceNZD: number, trade: TradeRecord): number {
  const tradeValueNZD = getTradeValueNZD(trade)

  if (trade.type === 'Sell') {
    return cashBalanceNZD + tradeValueNZD
  }

  if (trade.type === 'Buy') {
    return Math.max(0, cashBalanceNZD - tradeValueNZD)
  }

  return cashBalanceNZD
}

export function calculateCashBalanceNZD(trades: TradeRecord[]): number {
  return sortTradesInLedgerOrder(trades).reduce(applyTradeToCashBalance, 0)
}
