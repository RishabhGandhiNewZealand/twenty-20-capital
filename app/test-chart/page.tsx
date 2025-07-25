"use client"

import { PortfolioChart } from "@/components/portfolio-chart"

export default function TestChartPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Portfolio Chart Test</h1>
      <PortfolioChart />
    </div>
  )
}