// Mapping of company symbols to their investor relations URLs
// This can be expanded over time as we add more companies
export const investorRelationsUrls: Record<string, string> = {
  // US Companies
  'AAPL': 'https://investor.apple.com/investor-relations/default.aspx',
  'MSFT': 'https://www.microsoft.com/en-us/investor',
  'GOOGL': 'https://abc.xyz/investor/',
  'GOOG': 'https://abc.xyz/investor/',
  'AMZN': 'https://ir.aboutamazon.com/',
  'TSLA': 'https://ir.tesla.com/',
  'META': 'https://investor.fb.com/',
  'NVDA': 'https://investor.nvidia.com/',
  'BRK.A': 'https://www.berkshirehathaway.com/reports.html',
  'BRK.B': 'https://www.berkshirehathaway.com/reports.html',
  'JPM': 'https://www.jpmorganchase.com/ir/quarterly-earnings',
  'JNJ': 'https://www.investor.jnj.com/',
  'V': 'https://investor.visa.com/',
  'PG': 'https://www.pginvestor.com/',
  'UNH': 'https://www.unitedhealthgroup.com/investors.html',
  'HD': 'https://ir.homedepot.com/',
  'MA': 'https://investor.mastercard.com/',
  'DIS': 'https://thewaltdisneycompany.com/investor-relations/',
  'ADBE': 'https://www.adobe.com/investor-relations.html',
  'NFLX': 'https://ir.netflix.net/',
  'CRM': 'https://investor.salesforce.com/',
  'PFE': 'https://investors.pfizer.com/',
  'WMT': 'https://stock.walmart.com/',
  'KO': 'https://investors.coca-colacompany.com/',
  'PEP': 'https://www.pepsico.com/investors',
  'CSCO': 'https://investor.cisco.com/',
  'INTC': 'https://www.intc.com/investor-relations',
  'ORCL': 'https://investor.oracle.com/',
  'ACN': 'https://investor.accenture.com/',
  'MCD': 'https://corporate.mcdonalds.com/corpmcd/investors.html',
  'NKE': 'https://investors.nike.com/',
  'COST': 'https://investor.costco.com/',
  
  // New Zealand Companies
  'MFT.NZ': 'https://www.mainfreight.com/global/en/investor-centre/investor-centre.aspx',
  'FPH.NZ': 'https://www.fphcare.com/nz/investor/',
  'AIR.NZ': 'https://www.airnewzealand.co.nz/investor-centre',
  'SPK.NZ': 'https://www.spark.co.nz/investors/',
  'MEL.NZ': 'https://www.meridianenergy.co.nz/investors',
  'AIA.NZ': 'https://www.aucklandairport.co.nz/investors',
  'FBU.NZ': 'https://www.fletcherbuilding.com/investor-centre/',
  'RYM.NZ': 'https://www.ryman.co.nz/investor-centre',
  'SUM.NZ': 'https://www.summerset.co.nz/investor-centre/',
  'CEN.NZ': 'https://www.contactenergy.co.nz/investor-centre',
  
  // Australian Companies
  'CBA.AX': 'https://www.commbank.com.au/about-us/investors.html',
  'BHP.AX': 'https://www.bhp.com/investors',
  'CSL.AX': 'https://www.csl.com/investors',
  'ANZ.AX': 'https://www.anz.com/shareholder/centre/',
  'WBC.AX': 'https://www.westpac.com.au/about-westpac/investor-centre/',
  'NAB.AX': 'https://www.nab.com.au/about-us/investor-centre',
  'WES.AX': 'https://www.wesfarmers.com.au/investor-centre',
  'MQG.AX': 'https://www.macquarie.com/au/en/investors.html',
  'WOW.AX': 'https://www.woolworthsgroup.com.au/investors',
  'TLS.AX': 'https://www.telstra.com.au/aboutus/investors',
}

// Helper function to get investor relations URL
export function getInvestorRelationsUrl(symbol: string): string | null {
  // Check direct match
  if (investorRelationsUrls[symbol]) {
    return investorRelationsUrls[symbol]
  }
  
  // Check without exchange suffix
  const baseSymbol = symbol.split('.')[0]
  if (investorRelationsUrls[baseSymbol]) {
    return investorRelationsUrls[baseSymbol]
  }
  
  return null
}

// Common patterns for finding earnings reports on IR pages
export const reportPatterns = {
  quarterly: [
    /Q[1-4]\s*20\d{2}/i,
    /\d{1,2}Q\d{2}/i,
    /quarterly.*report/i,
    /earnings.*release/i,
    /financial.*results/i,
    /quarter.*ended/i,
  ],
  annual: [
    /annual.*report.*20\d{2}/i,
    /20\d{2}.*annual.*report/i,
    /form.*10-?k/i,
    /yearly.*report/i,
    /full.*year.*20\d{2}/i,
  ]
}