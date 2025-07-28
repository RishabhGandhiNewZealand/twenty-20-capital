import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Earnings Calendar & Reports | Rish Investing Journey",
  description: "Track upcoming earnings dates and access historical earnings reports for portfolio companies with 5 years of quarterly data",
}

export default function EarningsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}