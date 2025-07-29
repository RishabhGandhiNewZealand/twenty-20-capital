import { NextRequest, NextResponse } from 'next/server'
import { getInvestorRelationsUrl } from '@/lib/investor-relations-urls'

interface Report {
  title: string
  date: string
  url: string
  type: 'quarterly' | 'annual'
}

// Mock data for common companies - in production this could be fetched/scraped
const mockReports: Record<string, { quarterly: Report[], annual: Report[] }> = {
  'AAPL': {
    quarterly: [
      { title: 'Q3 2024 Earnings Release', date: '2024-08-01', url: 'https://www.apple.com/newsroom/pdfs/fy2024-q3-earnings-release.pdf', type: 'quarterly' },
      { title: 'Q2 2024 Earnings Release', date: '2024-05-02', url: 'https://www.apple.com/newsroom/pdfs/fy2024-q2-earnings-release.pdf', type: 'quarterly' },
      { title: 'Q1 2024 Earnings Release', date: '2024-02-01', url: 'https://www.apple.com/newsroom/pdfs/fy2024-q1-earnings-release.pdf', type: 'quarterly' },
      { title: 'Q4 2023 Earnings Release', date: '2023-11-02', url: 'https://www.apple.com/newsroom/pdfs/fy2023-q4-earnings-release.pdf', type: 'quarterly' },
      { title: 'Q3 2023 Earnings Release', date: '2023-08-03', url: 'https://www.apple.com/newsroom/pdfs/fy2023-q3-earnings-release.pdf', type: 'quarterly' },
    ],
    annual: [
      { title: '2023 Annual Report', date: '2023-10-30', url: 'https://s2.q4cdn.com/470004039/files/doc_financials/2023/ar/_10-K-2023-(As-Filed).pdf', type: 'annual' },
      { title: '2022 Annual Report', date: '2022-10-28', url: 'https://s2.q4cdn.com/470004039/files/doc_financials/2022/ar/_10-K-2022-(As-Filed).pdf', type: 'annual' },
      { title: '2021 Annual Report', date: '2021-10-29', url: 'https://s2.q4cdn.com/470004039/files/doc_financials/2021/ar/_10-K-2021-(As-Filed).pdf', type: 'annual' },
    ]
  },
  'MSFT': {
    quarterly: [
      { title: 'Q4 2024 Earnings Release', date: '2024-07-30', url: 'https://www.microsoft.com/investor/reports/ar24/index.html', type: 'quarterly' },
      { title: 'Q3 2024 Earnings Release', date: '2024-04-25', url: 'https://www.microsoft.com/investor/earnings/fy-2024-q3/', type: 'quarterly' },
      { title: 'Q2 2024 Earnings Release', date: '2024-01-24', url: 'https://www.microsoft.com/investor/earnings/fy-2024-q2/', type: 'quarterly' },
      { title: 'Q1 2024 Earnings Release', date: '2023-10-24', url: 'https://www.microsoft.com/investor/earnings/fy-2024-q1/', type: 'quarterly' },
    ],
    annual: [
      { title: '2023 Annual Report', date: '2023-07-27', url: 'https://www.microsoft.com/investor/reports/ar23/index.html', type: 'annual' },
      { title: '2022 Annual Report', date: '2022-07-28', url: 'https://www.microsoft.com/investor/reports/ar22/index.html', type: 'annual' },
    ]
  },
  'GOOGL': {
    quarterly: [
      { title: 'Q2 2024 Earnings Release', date: '2024-07-23', url: 'https://abc.xyz/investor/static/pdf/2024Q2_alphabet_earnings_release.pdf', type: 'quarterly' },
      { title: 'Q1 2024 Earnings Release', date: '2024-04-25', url: 'https://abc.xyz/investor/static/pdf/2024Q1_alphabet_earnings_release.pdf', type: 'quarterly' },
      { title: 'Q4 2023 Earnings Release', date: '2024-01-30', url: 'https://abc.xyz/investor/static/pdf/2023Q4_alphabet_earnings_release.pdf', type: 'quarterly' },
    ],
    annual: [
      { title: '2023 Annual Report', date: '2024-02-02', url: 'https://abc.xyz/investor/static/pdf/20240202_alphabet_10K.pdf', type: 'annual' },
      { title: '2022 Annual Report', date: '2023-02-03', url: 'https://abc.xyz/investor/static/pdf/20230203_alphabet_10K.pdf', type: 'annual' },
    ]
  },
  'MFT.NZ': {
    quarterly: [], // Mainfreight reports half-yearly
    annual: [
      { title: 'Annual Report 2024', date: '2024-05-30', url: 'https://www.mainfreight.com/getmedia/8f47b782-5635-4b94-b9f5-4824ef7b9e49/Mainfreight-Annual-Report-2024.pdf', type: 'annual' },
      { title: 'Half Year Report 2024', date: '2023-11-09', url: 'https://www.mainfreight.com/getmedia/5e3e5b3a-7c3b-4f89-8e3e-3b8c5e8f5b3a/Mainfreight-Half-Year-Report-2024.pdf', type: 'annual' },
      { title: 'Annual Report 2023', date: '2023-05-25', url: 'https://www.mainfreight.com/getmedia/5f8e5b3a-7c3b-4f89-8e3e-3b8c5e8f5b3a/Mainfreight-Annual-Report-2023.pdf', type: 'annual' },
      { title: 'Half Year Report 2023', date: '2022-11-10', url: 'https://www.mainfreight.com/getmedia/4e3e5b3a-7c3b-4f89-8e3e-3b8c5e8f5b3a/Mainfreight-Half-Year-Report-2023.pdf', type: 'annual' },
      { title: 'Annual Report 2022', date: '2022-05-26', url: 'https://www.mainfreight.com/getmedia/3e3e5b3a-7c3b-4f89-8e3e-3b8c5e8f5b3a/Mainfreight-Annual-Report-2022.pdf', type: 'annual' },
    ]
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const symbol = searchParams.get('symbol')
  
  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol parameter is required' },
      { status: 400 }
    )
  }
  
  try {
    // Get investor relations URL
    const irUrl = getInvestorRelationsUrl(symbol)
    
    // Check if we have mock data for this symbol
    const reports = mockReports[symbol] || mockReports[symbol.split('.')[0]]
    
    if (reports) {
      return NextResponse.json({
        symbol,
        investorRelationsUrl: irUrl,
        reports: {
          quarterly: reports.quarterly.slice(0, 20), // Last 20 quarterly reports
          annual: reports.annual.slice(0, 5), // Last 5 annual reports
        },
        lastUpdated: new Date().toISOString()
      })
    }
    
    // For companies without mock data, return the IR URL and empty reports
    // In production, this is where you would implement actual scraping
    return NextResponse.json({
      symbol,
      investorRelationsUrl: irUrl,
      reports: {
        quarterly: [],
        annual: [],
      },
      message: 'Reports not available. Please visit the investor relations page.',
      lastUpdated: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error fetching investor reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch investor reports' },
      { status: 500 }
    )
  }
}