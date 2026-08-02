export interface ReturnSeriesPoint {
  portfolioPerformance: number
  sp500Performance: number
}

export interface PerformanceMetrics {
  annualizedReturn: number
  annualizedVolatility: number
  sharpeRatio: number
  sortinoRatio: number
  beta: number
  annualizedAlpha: number
  maxDrawdown: number
  informationRatio: number
  observations: number
}

const TRADING_DAYS_PER_YEAR = 252

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function sampleVariance(values: number[], average = mean(values)): number {
  if (values.length < 2) return 0
  return values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1)
}

/** Calculates daily-data risk statistics. Returned percentage metrics are decimals. */
export function calculatePerformanceMetrics(
  series: ReturnSeriesPoint[],
  annualRiskFreeRate = 0.025
): PerformanceMetrics | null {
  if (series.length < 21) return null

  const pairedReturns: Array<[number, number]> = []
  for (let index = 1; index < series.length; index += 1) {
    const previousPortfolioWealth = 1 + series[index - 1].portfolioPerformance / 100
    const previousBenchmarkWealth = 1 + series[index - 1].sp500Performance / 100
    const portfolioReturn = (1 + series[index].portfolioPerformance / 100) / previousPortfolioWealth - 1
    const benchmarkReturn = (1 + series[index].sp500Performance / 100) / previousBenchmarkWealth - 1
    if (
      previousPortfolioWealth > 0 &&
      previousBenchmarkWealth > 0 &&
      Number.isFinite(portfolioReturn) &&
      Number.isFinite(benchmarkReturn) &&
      (Math.abs(portfolioReturn) > 1e-12 || Math.abs(benchmarkReturn) > 1e-12)
    ) {
      pairedReturns.push([portfolioReturn, benchmarkReturn])
    }
  }

  const observations = pairedReturns.length
  if (observations < 20) return null

  const portfolio = pairedReturns.map(([portfolioReturn]) => portfolioReturn)
  const benchmark = pairedReturns.map(([, benchmarkReturn]) => benchmarkReturn)
  const portfolioMean = mean(portfolio)
  const benchmarkMean = mean(benchmark)
  const portfolioVariance = sampleVariance(portfolio, portfolioMean)
  const benchmarkVariance = sampleVariance(benchmark, benchmarkMean)
  const portfolioStdDev = Math.sqrt(portfolioVariance)
  const riskFreeDaily = (1 + annualRiskFreeRate) ** (1 / TRADING_DAYS_PER_YEAR) - 1
  const excessReturns = portfolio.map(value => value - riskFreeDaily)
  const excessMean = mean(excessReturns)

  const covariance = observations > 1
    ? portfolio.reduce(
      (sum, value, index) => sum + (value - portfolioMean) * (benchmark[index] - benchmarkMean),
      0
    ) / (observations - 1)
    : 0
  const beta = benchmarkVariance > 0 ? covariance / benchmarkVariance : 0

  const activeReturns = portfolio.map((value, index) => value - benchmark[index])
  const activeMean = mean(activeReturns)
  const trackingErrorDaily = Math.sqrt(sampleVariance(activeReturns, activeMean))
  const downsideDeviationDaily = Math.sqrt(
    excessReturns.reduce((sum, value) => sum + Math.min(value, 0) ** 2, 0) / observations
  )

  const totalGrowth = portfolio.reduce((wealth, value) => wealth * (1 + value), 1)
  const annualizedReturn = totalGrowth > 0
    ? totalGrowth ** (TRADING_DAYS_PER_YEAR / observations) - 1
    : -1

  let wealth = 1
  let peak = 1
  let maxDrawdown = 0
  for (const value of portfolio) {
    wealth *= 1 + value
    peak = Math.max(peak, wealth)
    maxDrawdown = Math.min(maxDrawdown, wealth / peak - 1)
  }

  return {
    annualizedReturn,
    annualizedVolatility: portfolioStdDev * Math.sqrt(TRADING_DAYS_PER_YEAR),
    sharpeRatio: portfolioStdDev > 1e-12 ? excessMean / portfolioStdDev * Math.sqrt(TRADING_DAYS_PER_YEAR) : 0,
    sortinoRatio: downsideDeviationDaily > 1e-12
      ? excessMean * TRADING_DAYS_PER_YEAR / (downsideDeviationDaily * Math.sqrt(TRADING_DAYS_PER_YEAR))
      : 0,
    beta,
    annualizedAlpha: (portfolioMean - riskFreeDaily - beta * (benchmarkMean - riskFreeDaily)) * TRADING_DAYS_PER_YEAR,
    maxDrawdown,
    informationRatio: trackingErrorDaily > 1e-12
      ? activeMean / trackingErrorDaily * Math.sqrt(TRADING_DAYS_PER_YEAR)
      : 0,
    observations,
  }
}
