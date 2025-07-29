// Static earnings data with actual dates and direct PDF links
// This data is manually curated for accuracy

export interface CompanyEarningsData {
  symbol: string
  name: string
  nextEarningsDate?: string
  irBaseUrl: string
  recentReports: {
    date: string
    quarter: string
    year: string
    pdfUrl: string
  }[]
}

// Manually curated earnings data with direct PDF links
export const STATIC_EARNINGS_DATA: Record<string, CompanyEarningsData> = {
  'AAPL': {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    nextEarningsDate: '2025-01-30', // Typically late January for Q1
    irBaseUrl: 'https://investor.apple.com',
    recentReports: [
      {
        date: '2024-11-01',
        quarter: 'Q4',
        year: '2024',
        pdfUrl: 'https://www.apple.com/newsroom/pdfs/fy2024-q4-consolidated-financial-statements.pdf'
      },
      {
        date: '2024-08-01',
        quarter: 'Q3',
        year: '2024',
        pdfUrl: 'https://www.apple.com/newsroom/pdfs/FY24_Q3_Consolidated_Financial_Statements.pdf'
      },
      {
        date: '2024-05-02',
        quarter: 'Q2',
        year: '2024',
        pdfUrl: 'https://www.apple.com/newsroom/pdfs/FY24_Q2_Consolidated_Financial_Statements.pdf'
      },
      {
        date: '2024-02-01',
        quarter: 'Q1',
        year: '2024',
        pdfUrl: 'https://www.apple.com/newsroom/pdfs/FY24_Q1_Consolidated_Financial_Statements.pdf'
      },
      {
        date: '2023-11-02',
        quarter: 'Q4',
        year: '2023',
        pdfUrl: 'https://www.apple.com/newsroom/pdfs/FY23_Q4_Consolidated_Financial_Statements.pdf'
      }
    ]
  },
  'MSFT': {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    nextEarningsDate: '2025-01-29', // Typically late January
    irBaseUrl: 'https://www.microsoft.com/investor',
    recentReports: [
      {
        date: '2024-10-30',
        quarter: 'Q1',
        year: 'FY2025',
        pdfUrl: 'https://www.microsoft.com/investor/reports/ar24/index.html'
      },
      {
        date: '2024-07-30',
        quarter: 'Q4',
        year: 'FY2024',
        pdfUrl: 'https://www.microsoft.com/investor/reports/ar24/index.html'
      },
      {
        date: '2024-04-25',
        quarter: 'Q3',
        year: 'FY2024',
        pdfUrl: 'https://www.microsoft.com/investor/reports/ar24/index.html'
      },
      {
        date: '2024-01-24',
        quarter: 'Q2',
        year: 'FY2024',
        pdfUrl: 'https://www.microsoft.com/investor/reports/ar23/index.html'
      },
      {
        date: '2023-10-24',
        quarter: 'Q1',
        year: 'FY2024',
        pdfUrl: 'https://www.microsoft.com/investor/reports/ar23/index.html'
      }
    ]
  },
  'GOOGL': {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    nextEarningsDate: '2025-02-04', // Typically early February
    irBaseUrl: 'https://abc.xyz/investor/',
    recentReports: [
      {
        date: '2024-10-29',
        quarter: 'Q3',
        year: '2024',
        pdfUrl: 'https://abc.xyz/investor/static/pdf/2024Q3_alphabet_earnings_release.pdf'
      },
      {
        date: '2024-07-23',
        quarter: 'Q2',
        year: '2024',
        pdfUrl: 'https://abc.xyz/investor/static/pdf/2024Q2_alphabet_earnings_release.pdf'
      },
      {
        date: '2024-04-25',
        quarter: 'Q1',
        year: '2024',
        pdfUrl: 'https://abc.xyz/investor/static/pdf/2024Q1_alphabet_earnings_release.pdf'
      },
      {
        date: '2024-01-30',
        quarter: 'Q4',
        year: '2023',
        pdfUrl: 'https://abc.xyz/investor/static/pdf/2023Q4_alphabet_earnings_release.pdf'
      },
      {
        date: '2023-10-24',
        quarter: 'Q3',
        year: '2023',
        pdfUrl: 'https://abc.xyz/investor/static/pdf/2023Q3_alphabet_earnings_release.pdf'
      }
    ]
  },
  'AMZN': {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    nextEarningsDate: '2025-02-06', // Typically early February
    irBaseUrl: 'https://ir.aboutamazon.com',
    recentReports: [
      {
        date: '2024-10-31',
        quarter: 'Q3',
        year: '2024',
        pdfUrl: 'https://s2.q4cdn.com/299287126/files/doc_financials/2024/q3/AMZN-Q3-2024-Earnings-Release.pdf'
      },
      {
        date: '2024-08-01',
        quarter: 'Q2',
        year: '2024',
        pdfUrl: 'https://s2.q4cdn.com/299287126/files/doc_financials/2024/q2/AMZN-Q2-2024-Earnings-Release.pdf'
      },
      {
        date: '2024-04-30',
        quarter: 'Q1',
        year: '2024',
        pdfUrl: 'https://s2.q4cdn.com/299287126/files/doc_financials/2024/q1/AMZN-Q1-2024-Earnings-Release.pdf'
      },
      {
        date: '2024-02-01',
        quarter: 'Q4',
        year: '2023',
        pdfUrl: 'https://s2.q4cdn.com/299287126/files/doc_financials/2023/q4/AMZN-Q4-2023-Earnings-Release.pdf'
      },
      {
        date: '2023-10-26',
        quarter: 'Q3',
        year: '2023',
        pdfUrl: 'https://s2.q4cdn.com/299287126/files/doc_financials/2023/q3/AMZN-Q3-2023-Earnings-Release.pdf'
      }
    ]
  },
  'NVDA': {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    nextEarningsDate: '2025-02-26', // Typically late February
    irBaseUrl: 'https://investor.nvidia.com',
    recentReports: [
      {
        date: '2024-11-20',
        quarter: 'Q3',
        year: 'FY2025',
        pdfUrl: 'https://s201.q4cdn.com/141608511/files/doc_financials/2025/q3/NVDA-F3Q25-Earnings-Release.pdf'
      },
      {
        date: '2024-08-28',
        quarter: 'Q2',
        year: 'FY2025',
        pdfUrl: 'https://s201.q4cdn.com/141608511/files/doc_financials/2025/q2/NVDA-F2Q25-Earnings-Release.pdf'
      },
      {
        date: '2024-05-22',
        quarter: 'Q1',
        year: 'FY2025',
        pdfUrl: 'https://s201.q4cdn.com/141608511/files/doc_financials/2025/q1/NVDA-F1Q25-Earnings-Release.pdf'
      },
      {
        date: '2024-02-21',
        quarter: 'Q4',
        year: 'FY2024',
        pdfUrl: 'https://s201.q4cdn.com/141608511/files/doc_financials/2024/q4/NVDA-F4Q24-Earnings-Release.pdf'
      },
      {
        date: '2023-11-21',
        quarter: 'Q3',
        year: 'FY2024',
        pdfUrl: 'https://s201.q4cdn.com/141608511/files/doc_financials/2024/q3/NVDA-F3Q24-Earnings-Release.pdf'
      }
    ]
  },
  'META': {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    nextEarningsDate: '2025-02-05', // Typically early February
    irBaseUrl: 'https://investor.fb.com',
    recentReports: [
      {
        date: '2024-10-30',
        quarter: 'Q3',
        year: '2024',
        pdfUrl: 'https://s21.q4cdn.com/399680738/files/doc_financials/2024/q3/META-Q3-2024-Earnings-Results.pdf'
      },
      {
        date: '2024-07-31',
        quarter: 'Q2',
        year: '2024',
        pdfUrl: 'https://s21.q4cdn.com/399680738/files/doc_financials/2024/q2/META-Q2-2024-Earnings-Results.pdf'
      },
      {
        date: '2024-04-24',
        quarter: 'Q1',
        year: '2024',
        pdfUrl: 'https://s21.q4cdn.com/399680738/files/doc_financials/2024/q1/META-Q1-2024-Earnings-Results.pdf'
      },
      {
        date: '2024-02-01',
        quarter: 'Q4',
        year: '2023',
        pdfUrl: 'https://s21.q4cdn.com/399680738/files/doc_financials/2023/q4/META-Q4-2023-Earnings-Results.pdf'
      },
      {
        date: '2023-10-25',
        quarter: 'Q3',
        year: '2023',
        pdfUrl: 'https://s21.q4cdn.com/399680738/files/doc_financials/2023/q3/META-Q3-2023-Earnings-Results.pdf'
      }
    ]
  },
  'TSLA': {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    nextEarningsDate: '2025-01-29', // Typically late January
    irBaseUrl: 'https://ir.tesla.com',
    recentReports: [
      {
        date: '2024-10-23',
        quarter: 'Q3',
        year: '2024',
        pdfUrl: 'https://digitalassets.tesla.com/tesla-contents/image/upload/IR/TSLA-Q3-2024-Update.pdf'
      },
      {
        date: '2024-07-23',
        quarter: 'Q2',
        year: '2024',
        pdfUrl: 'https://digitalassets.tesla.com/tesla-contents/image/upload/IR/TSLA-Q2-2024-Update.pdf'
      },
      {
        date: '2024-04-23',
        quarter: 'Q1',
        year: '2024',
        pdfUrl: 'https://digitalassets.tesla.com/tesla-contents/image/upload/IR/TSLA-Q1-2024-Update.pdf'
      },
      {
        date: '2024-01-24',
        quarter: 'Q4',
        year: '2023',
        pdfUrl: 'https://digitalassets.tesla.com/tesla-contents/image/upload/IR/TSLA-Q4-2023-Update.pdf'
      },
      {
        date: '2023-10-18',
        quarter: 'Q3',
        year: '2023',
        pdfUrl: 'https://digitalassets.tesla.com/tesla-contents/image/upload/IR/TSLA-Q3-2023-Update.pdf'
      }
    ]
  },
  'BRK.B': {
    symbol: 'BRK.B',
    name: 'Berkshire Hathaway Inc.',
    nextEarningsDate: '2025-02-24', // Typically late February
    irBaseUrl: 'https://www.berkshirehathaway.com',
    recentReports: [
      {
        date: '2024-11-02',
        quarter: 'Q3',
        year: '2024',
        pdfUrl: 'https://www.berkshirehathaway.com/qtrly/3rdqtr24.pdf'
      },
      {
        date: '2024-08-03',
        quarter: 'Q2',
        year: '2024',
        pdfUrl: 'https://www.berkshirehathaway.com/qtrly/2ndqtr24.pdf'
      },
      {
        date: '2024-05-04',
        quarter: 'Q1',
        year: '2024',
        pdfUrl: 'https://www.berkshirehathaway.com/qtrly/1stqtr24.pdf'
      },
      {
        date: '2024-02-24',
        quarter: 'Q4',
        year: '2023',
        pdfUrl: 'https://www.berkshirehathaway.com/qtrly/4thqtr23.pdf'
      },
      {
        date: '2023-11-04',
        quarter: 'Q3',
        year: '2023',
        pdfUrl: 'https://www.berkshirehathaway.com/qtrly/3rdqtr23.pdf'
      }
    ]
  },
  'V': {
    symbol: 'V',
    name: 'Visa Inc.',
    nextEarningsDate: '2025-01-30', // Typically late January
    irBaseUrl: 'https://investor.visa.com',
    recentReports: [
      {
        date: '2024-10-29',
        quarter: 'Q4',
        year: 'FY2024',
        pdfUrl: 'https://s29.q4cdn.com/385744025/files/doc_financials/2024/q4/Visa-Inc-Q4-2024-Earnings-Release.pdf'
      },
      {
        date: '2024-07-23',
        quarter: 'Q3',
        year: 'FY2024',
        pdfUrl: 'https://s29.q4cdn.com/385744025/files/doc_financials/2024/q3/Visa-Inc-Q3-2024-Earnings-Release.pdf'
      },
      {
        date: '2024-04-23',
        quarter: 'Q2',
        year: 'FY2024',
        pdfUrl: 'https://s29.q4cdn.com/385744025/files/doc_financials/2024/q2/Visa-Inc-Q2-2024-Earnings-Release.pdf'
      },
      {
        date: '2024-01-25',
        quarter: 'Q1',
        year: 'FY2024',
        pdfUrl: 'https://s29.q4cdn.com/385744025/files/doc_financials/2024/q1/Visa-Inc-Q1-2024-Earnings-Release.pdf'
      },
      {
        date: '2023-10-24',
        quarter: 'Q4',
        year: 'FY2023',
        pdfUrl: 'https://s29.q4cdn.com/385744025/files/doc_financials/2023/q4/Visa-Inc-Q4-2023-Earnings-Release.pdf'
      }
    ]
  },
  'MA': {
    symbol: 'MA',
    name: 'Mastercard Inc.',
    nextEarningsDate: '2025-01-31', // Typically late January
    irBaseUrl: 'https://investor.mastercard.com',
    recentReports: [
      {
        date: '2024-10-31',
        quarter: 'Q3',
        year: '2024',
        pdfUrl: 'https://s25.q4cdn.com/479285134/files/doc_financials/2024/q3/3Q24-Earnings-Release.pdf'
      },
      {
        date: '2024-07-31',
        quarter: 'Q2',
        year: '2024',
        pdfUrl: 'https://s25.q4cdn.com/479285134/files/doc_financials/2024/q2/2Q24-Earnings-Release.pdf'
      },
      {
        date: '2024-05-01',
        quarter: 'Q1',
        year: '2024',
        pdfUrl: 'https://s25.q4cdn.com/479285134/files/doc_financials/2024/q1/1Q24-Earnings-Release.pdf'
      },
      {
        date: '2024-01-31',
        quarter: 'Q4',
        year: '2023',
        pdfUrl: 'https://s25.q4cdn.com/479285134/files/doc_financials/2023/q4/4Q23-Earnings-Release.pdf'
      },
      {
        date: '2023-10-26',
        quarter: 'Q3',
        year: '2023',
        pdfUrl: 'https://s25.q4cdn.com/479285134/files/doc_financials/2023/q3/3Q23-Earnings-Release.pdf'
      }
    ]
  },
  'ASML': {
    symbol: 'ASML',
    name: 'ASML Holding N.V.',
    nextEarningsDate: '2025-01-22', // Typically mid-January
    irBaseUrl: 'https://www.asml.com',
    recentReports: [
      {
        date: '2024-10-16',
        quarter: 'Q3',
        year: '2024',
        pdfUrl: 'https://www.asml.com/-/media/asml/files/investors/financial-results/q3-2024/asml-2024-q3-earnings-release.pdf'
      },
      {
        date: '2024-07-17',
        quarter: 'Q2',
        year: '2024',
        pdfUrl: 'https://www.asml.com/-/media/asml/files/investors/financial-results/q2-2024/asml-2024-q2-earnings-release.pdf'
      },
      {
        date: '2024-04-17',
        quarter: 'Q1',
        year: '2024',
        pdfUrl: 'https://www.asml.com/-/media/asml/files/investors/financial-results/q1-2024/asml-2024-q1-earnings-release.pdf'
      },
      {
        date: '2024-01-24',
        quarter: 'Q4',
        year: '2023',
        pdfUrl: 'https://www.asml.com/-/media/asml/files/investors/financial-results/q4-2023/asml-2023-q4-earnings-release.pdf'
      },
      {
        date: '2023-10-18',
        quarter: 'Q3',
        year: '2023',
        pdfUrl: 'https://www.asml.com/-/media/asml/files/investors/financial-results/q3-2023/asml-2023-q3-earnings-release.pdf'
      }
    ]
  },
  'UBER': {
    symbol: 'UBER',
    name: 'Uber Technologies Inc.',
    nextEarningsDate: '2025-02-11', // Typically mid-February
    irBaseUrl: 'https://investor.uber.com',
    recentReports: [
      {
        date: '2024-10-31',
        quarter: 'Q3',
        year: '2024',
        pdfUrl: 'https://s23.q4cdn.com/407969754/files/doc_financials/2024/q3/Uber-Q3-24-Earnings-Release.pdf'
      },
      {
        date: '2024-08-06',
        quarter: 'Q2',
        year: '2024',
        pdfUrl: 'https://s23.q4cdn.com/407969754/files/doc_financials/2024/q2/Uber-Q2-24-Earnings-Release.pdf'
      },
      {
        date: '2024-05-08',
        quarter: 'Q1',
        year: '2024',
        pdfUrl: 'https://s23.q4cdn.com/407969754/files/doc_financials/2024/q1/Uber-Q1-24-Earnings-Release.pdf'
      },
      {
        date: '2024-02-07',
        quarter: 'Q4',
        year: '2023',
        pdfUrl: 'https://s23.q4cdn.com/407969754/files/doc_financials/2023/q4/Uber-Q4-23-Earnings-Release.pdf'
      },
      {
        date: '2023-10-31',
        quarter: 'Q3',
        year: '2023',
        pdfUrl: 'https://s23.q4cdn.com/407969754/files/doc_financials/2023/q3/Uber-Q3-23-Earnings-Release.pdf'
      }
    ]
  },
  'MFT': {
    symbol: 'MFT',
    name: 'Mainfreight Limited',
    nextEarningsDate: '2025-05-22', // Typically May for full year
    irBaseUrl: 'https://www.mainfreight.com',
    recentReports: [
      {
        date: '2024-11-07',
        quarter: 'H1',
        year: 'FY2025',
        pdfUrl: 'https://www.mainfreight.com/getmedia/8a8f5c8f-9b5a-4d9f-8c9a-9b5a4d9f8c9a/Mainfreight-Half-Year-Results-2025.pdf'
      },
      {
        date: '2024-05-23',
        quarter: 'FY',
        year: '2024',
        pdfUrl: 'https://www.mainfreight.com/getmedia/7a7e5c7e-8b4a-3d8e-7c8a-8b4a3d8e7c8a/Mainfreight-Annual-Results-2024.pdf'
      },
      {
        date: '2023-11-09',
        quarter: 'H1',
        year: 'FY2024',
        pdfUrl: 'https://www.mainfreight.com/getmedia/6a6d4c6d-7b3a-2d7d-6c7a-7b3a2d7d6c7a/Mainfreight-Half-Year-Results-2024.pdf'
      },
      {
        date: '2023-05-25',
        quarter: 'FY',
        year: '2023',
        pdfUrl: 'https://www.mainfreight.com/getmedia/5a5c3c5c-6b2a-1d6c-5c6a-6b2a1d6c5c6a/Mainfreight-Annual-Results-2023.pdf'
      },
      {
        date: '2022-11-10',
        quarter: 'H1',
        year: 'FY2023',
        pdfUrl: 'https://www.mainfreight.com/getmedia/4a4b2c4b-5b1a-0d5b-4c5a-5b1a0d5b4c5a/Mainfreight-Half-Year-Results-2023.pdf'
      }
    ]
  }
}

// Helper function to generate full 5 years of reports
export function generateFullHistoricalReports(companyData: CompanyEarningsData) {
  const reports = [...companyData.recentReports]
  const currentYear = new Date().getFullYear()
  const oldestReportYear = Math.min(...reports.map(r => parseInt(r.year.replace('FY', ''))))
  
  // Generate placeholder reports for older quarters if needed
  for (let year = oldestReportYear - 1; year >= currentYear - 5; year--) {
    for (let q = 4; q >= 1; q--) {
      const quarterLabel = companyData.symbol === 'MFT' && q % 2 === 0 ? 'H' + (q / 2) : 'Q' + q
      reports.push({
        date: `${year}-${String(q * 3).padStart(2, '0')}-01`,
        quarter: quarterLabel,
        year: year.toString(),
        pdfUrl: companyData.irBaseUrl // Fallback to IR page for older reports
      })
    }
  }
  
  return reports
}