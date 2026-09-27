import assert from 'node:assert/strict'
import { calculatePortfolioData } from '../lib/portfolio'
import { calculateDailyReturns } from '../lib/portfolioCalculations'
import type { TradeRecord } from '../types/portfolio'

const common = {
  marketCode: 'NYSE',
  instrumentCurrency: 'USD',
  brokerageCurrency: 'USD',
}

const spgiBuys: TradeRecord[] = [
  { ...common, code: 'SPGI', name: 'S&P Global Inc', date: '2024-12-09', type: 'Buy', qty: 2.003, price: 514.21, brokerage: 1, exchRate: 0.59, value: 1757.90 },
  { ...common, code: 'SPGI', name: 'S&P Global Inc', date: '2025-01-13', type: 'Buy', qty: 0.997, price: 483.11, brokerage: 1, exchRate: 0.56, value: 867.53 },
  { ...common, code: 'SPGI', name: 'S&P Global Inc', date: '2025-02-03', type: 'Buy', qty: 2, price: 518.23, brokerage: 1, exchRate: 0.56, value: 1843.26 },
]

const distribution: TradeRecord = {
  ...common,
  code: 'MBGL',
  name: 'Mobility Global Inc',
  date: '2026-07-01',
  type: 'Reinvestment',
  qty: 5,
  price: 0,
  brokerage: 0,
  exchRate: 1,
  value: 216.284596,
  sourceCode: 'SPGI',
  basisTransferUSD: 123.472597,
}

const sale: TradeRecord = {
  ...common,
  code: 'MBGL',
  name: 'Mobility Global Inc',
  date: '2026-07-31',
  type: 'Sell',
  qty: 5,
  price: 20,
  brokerage: 1.00305,
  exchRate: 0.59,
  value: 167.79,
}

const beforeSale = calculatePortfolioData([...spgiBuys, distribution])
const spgi = beforeSale.holdings.find(holding => holding.symbol === 'SPGI')
const mbgl = beforeSale.holdings.find(holding => holding.symbol === 'MBGL')
assert.ok(spgi)
assert.ok(mbgl)
assert.equal(spgi.totalShares, 5)
assert.equal(mbgl.totalShares, 5)
assert.ok(Math.abs(spgi.avgPriceNZD * 5 - 4252.405404) < 0.000001)
assert.ok(Math.abs(mbgl.avgPriceNZD * 5 - 216.284596) < 0.000001)
assert.ok(Math.abs(mbgl.avgPriceUSD! * 5 - 123.472597) < 0.000001)

const afterSale = calculatePortfolioData([...spgiBuys, distribution, sale])
assert.equal(afterSale.holdings.some(holding => holding.symbol === 'MBGL'), false)
const mbglExit = afterSale.exitedPositions.find(position => position.symbol === 'MBGL')
assert.ok(mbglExit)
assert.ok(Math.abs(mbglExit.profitLossNZD - (167.79 - 216.284596)) < 0.000001)

const historyBuy: TradeRecord = {
  ...common,
  code: 'SPGI',
  name: 'S&P Global Inc',
  date: '2026-06-30',
  type: 'Buy',
  qty: 5,
  price: 500,
  brokerage: 0,
  exchRate: 0.56,
  value: 4468.69,
}
const history = calculateDailyReturns(
  [historyBuy, distribution],
  new Map([
    ['SPGI', new Map([['2026-06-30', 435], ['2026-07-01', 414.44]])],
    ['MBGL', new Map([['2026-07-01', 21.08]])],
  ]),
  new Map([['2026-06-30', 1.7], ['2026-07-01', 1.7]]),
  new Map(),
  new Date('2026-06-30'),
  new Date('2026-07-01')
)
assert.equal(history.length, 2)
assert.equal(history[0].costBasis, 4468.69)
assert.equal(history[1].costBasis, 4468.69)
assert.ok(history[1].portfolioValue > 5 * 414.44 * 1.7)

console.log('Spin-off basis, sale, shares, and cash-flow checks passed')
