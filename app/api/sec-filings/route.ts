import { NextRequest, NextResponse } from 'next/server'

interface SECFiling {
  accessionNumber: string
  filingDate: string
  reportDate: string
  acceptanceDateTime: string
  act: string
  form: string
  fileNumber: string
  filmNumber: string
  items: string
  size: number
  isXBRL: number
  isInlineXBRL: number
  primaryDocument: string
  primaryDocDescription: string
}

interface CompanyInfo {
  cik: string
  entityType: string
  sic: string
  sicDescription: string
  insiderTransactionForOwnerExists: number
  insiderTransactionForIssuerExists: number
  name: string
  tickers: string[]
  exchanges: string[]
  ein: string
  description: string
  website: string
  investorWebsite: string
  category: string
  fiscalYearEnd: string
  stateOfIncorporation: string
  stateOfIncorporationDescription: string
  addresses: any
  phone: string
  flags: string
  formerNames: any[]
}

// SEC EDGAR API base URL
const SEC_BASE_URL = 'https://data.sec.gov'

// Required headers for SEC API
const SEC_HEADERS = {
  'User-Agent': 'Rish Investing Journey earnings@example.com',
  'Accept-Encoding': 'gzip, deflate',
  'Host': 'data.sec.gov'
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const cik = searchParams.get('cik')
  const filingType = searchParams.get('type') || '10-Q,10-K' // Default to earnings reports

  if (!symbol && !cik) {
    return NextResponse.json(
      { success: false, error: 'Symbol or CIK is required' },
      { status: 400 }
    )
  }

  try {
    let companyData: CompanyInfo | null = null
    let companyCik = cik

    // If symbol provided, get company info first
    if (symbol && !cik) {
      try {
        const companyResponse = await fetch(
          `${SEC_BASE_URL}/submissions/CIK${symbol.padStart(10, '0')}.json`,
          { headers: SEC_HEADERS }
        )
        
        if (!companyResponse.ok) {
          // Try ticker lookup via company tickers JSON
          const tickersResponse = await fetch(
            'https://www.sec.gov/files/company_tickers.json',
            { headers: SEC_HEADERS }
          )
          
          if (tickersResponse.ok) {
            const tickersData = await tickersResponse.json()
            const company = Object.values(tickersData).find((company: any) => 
              company.ticker === symbol.toUpperCase()
            ) as any
            
            if (company) {
              companyCik = company.cik_str.toString().padStart(10, '0')
            }
          }
        }
      } catch (error) {
        console.log('Error looking up company by symbol:', error)
      }
    }

    // Get company filings
    if (companyCik) {
      const submissionsResponse = await fetch(
        `${SEC_BASE_URL}/submissions/CIK${companyCik.padStart(10, '0')}.json`,
        { headers: SEC_HEADERS }
      )

      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json()
        companyData = submissionsData

        // Filter filings by type
        const filings = submissionsData.filings?.recent || {}
        const filteredFilings: SECFiling[] = []

        const types = filingType.split(',')
        
        if (filings.form && filings.form.length > 0) {
          for (let i = 0; i < filings.form.length; i++) {
            if (types.includes(filings.form[i])) {
              filteredFilings.push({
                accessionNumber: filings.accessionNumber[i],
                filingDate: filings.filingDate[i],
                reportDate: filings.reportDate[i],
                acceptanceDateTime: filings.acceptanceDateTime[i],
                act: filings.act[i],
                form: filings.form[i],
                fileNumber: filings.fileNumber[i],
                filmNumber: filings.filmNumber[i],
                items: filings.items[i],
                size: filings.size[i],
                isXBRL: filings.isXBRL[i],
                isInlineXBRL: filings.isInlineXBRL[i],
                primaryDocument: filings.primaryDocument[i],
                primaryDocDescription: filings.primaryDocDescription[i]
              })
            }
          }
        }

        return NextResponse.json({
          success: true,
          company: {
            name: companyData.name,
            cik: companyData.cik,
            tickers: companyData.tickers,
            sic: companyData.sic,
            sicDescription: companyData.sicDescription,
            website: companyData.website,
            investorWebsite: companyData.investorWebsite
          },
          filings: filteredFilings.slice(0, 10), // Return latest 10 filings
          count: filteredFilings.length
        })
      }
    }

    // Fallback with mock data
    const mockFilings: SECFiling[] = [
      {
        accessionNumber: '0000320193-24-000007',
        filingDate: '2024-01-26',
        reportDate: '2023-12-30',
        acceptanceDateTime: '2024-01-26T18:01:14.000Z',
        act: '34',
        form: '10-Q',
        fileNumber: '001-36743',
        filmNumber: '24576890',
        items: '1.01,1.02,2.02,9.01',
        size: 5234567,
        isXBRL: 1,
        isInlineXBRL: 1,
        primaryDocument: 'aapl-20231230x10q.htm',
        primaryDocDescription: 'FORM 10-Q'
      }
    ]

    return NextResponse.json({
      success: true,
      company: {
        name: symbol ? `${symbol.toUpperCase()} Inc.` : 'Unknown Company',
        cik: '0000000000',
        tickers: symbol ? [symbol.toUpperCase()] : [],
        sic: '3571',
        sicDescription: 'Electronic Computers',
        website: '',
        investorWebsite: ''
      },
      filings: mockFilings,
      count: mockFilings.length,
      note: 'Demo data - Connect with valid CIK for real SEC data'
    })

  } catch (error) {
    console.error('Error fetching SEC filings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SEC filings' },
      { status: 500 }
    )
  }
}