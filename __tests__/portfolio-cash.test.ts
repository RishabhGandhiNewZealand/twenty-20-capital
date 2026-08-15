import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateCashBalanceNZD } from '@/lib/portfolio-cash'
import { calculateDailyReturns } from '@/lib/portfolioCalculations'
import { TradeRecord } from '@/types/portfolio'

function trade(overrides: Partial<TradeRecord>): TradeRecord {
  return {
    code: 'TEST',
    marketCode: 'NZX',
    name: 'Test Holding',
    date: '2026-01-01',
    type: 'Buy',
    qty: 10,
    price: 10,
    instrumentCurrency: 'NZD',
    brokerage: 0,
    brokerageCurrency: 'NZD',
    exchRate: 1,
    value: 100,
    ...overrides,
  }
}

test('cash is sale proceeds left after later buys', () => {
  const trades = [
    trade({ type: 'Buy', value: 100 }),
    trade({ date: '2026-01-02', type: 'Sell', qty: 8, value: 80 }),
    trade({ date: '2026-01-03', type: 'Buy', qty: 3, value: 30 }),
  ]

  assert.equal(calculateCashBalanceNZD(trades), 50)
})

test('same-day sells fund buys regardless of input order', () => {
  const trades = [
    trade({ date: '2026-01-02', type: 'Buy', qty: 3, value: 30 }),
    trade({ date: '2026-01-02', type: 'Sell', qty: 8, value: 80 }),
  ]

  assert.equal(calculateCashBalanceNZD(trades), 50)
})

test('reinvestments do not change the cash balance', () => {
  const trades = [
    trade({ type: 'Sell', qty: 5, value: 50 }),
    trade({ date: '2026-01-02', type: 'Reinvestment', qty: 1, value: 10 }),
  ]

  assert.equal(calculateCashBalanceNZD(trades), 50)
})

test('daily portfolio value includes retained cash after a sale', () => {
  const trades = [
    trade({ type: 'Buy', qty: 10, value: 100 }),
    trade({ date: '2026-01-02', type: 'Sell', qty: 5, value: 60 }),
  ]
  const prices = new Map([
    [
      'TEST',
      new Map([
        ['2026-01-01', 10],
        ['2026-01-02', 10],
      ]),
    ],
  ])

  const history = calculateDailyReturns(
    trades,
    prices,
    new Map(),
    new Map(),
    new Date('2026-01-01T00:00:00Z'),
    new Date('2026-01-02T00:00:00Z')
  )

  assert.equal(history.at(-1)?.portfolioValue, 110)
  assert.equal(history.at(-1)?.costBasis, 100)
})
