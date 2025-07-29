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
  
  // Additional US Companies
  'UBER': 'https://investor.uber.com/',
  'SPGI': 'https://investor.spglobal.com/',
  'PYPL': 'https://investor.pypl.com/',
  'AMD': 'https://ir.amd.com/',
  'QCOM': 'https://investor.qualcomm.com/',
  'TXN': 'https://investor.ti.com/',
  'AVGO': 'https://investors.broadcom.com/',
  'CVX': 'https://www.chevron.com/investors',
  'XOM': 'https://corporate.exxonmobil.com/investors',
  'BAC': 'https://investor.bankofamerica.com/',
  'WFC': 'https://www.wellsfargo.com/about/investor-relations/',
  'MS': 'https://www.morganstanley.com/about-us-ir',
  'GS': 'https://www.goldmansachs.com/investor-relations/',
  'C': 'https://www.citigroup.com/global/investors',
  'SCHW': 'https://www.aboutschwab.com/investor-relations',
  'BKNG': 'https://ir.bookingholdings.com/',
  'ABNB': 'https://investors.airbnb.com/',
  'SPOT': 'https://investors.spotify.com/',
  'SQ': 'https://investors.squareup.com/',
  'SHOP': 'https://investors.shopify.com/',
  'SNAP': 'https://investor.snap.com/',
  'PINS': 'https://investor.pinterestinc.com/',
  'TWTR': 'https://investor.twitter.com/',
  'LYFT': 'https://investor.lyft.com/',
  'ZM': 'https://investors.zoom.us/',
  'DOCU': 'https://investor.docusign.com/',
  'ROKU': 'https://ir.roku.com/',
  'PLTR': 'https://investors.palantir.com/',
  'SNOW': 'https://investors.snowflake.com/',
  'DDOG': 'https://investors.datadoghq.com/',
  'CRWD': 'https://ir.crowdstrike.com/',
  'NET': 'https://www.cloudflare.com/investor-relations/',
  'COIN': 'https://investor.coinbase.com/',
  'HOOD': 'https://investors.robinhood.com/',
  'RBLX': 'https://ir.roblox.com/',
  'U': 'https://investors.unity.com/',
  'DASH': 'https://ir.doordash.com/',
  'MRNA': 'https://investors.modernatx.com/',
  'ZS': 'https://ir.zscaler.com/',
  'OKTA': 'https://investor.okta.com/',
  'TEAM': 'https://investors.atlassian.com/',
  'MDB': 'https://investors.mongodb.com/',
  'ESTC': 'https://ir.elastic.co/',
  'FSLY': 'https://investors.fastly.com/',
  'TWLO': 'https://investors.twilio.com/',
  'DBX': 'https://investors.dropbox.com/',
  'VEEV': 'https://ir.veeva.com/',
  'WDAY': 'https://investor.workday.com/',
  'NOW': 'https://investors.servicenow.com/',
  'PANW': 'https://investors.paloaltonetworks.com/',
  'FTNT': 'https://investor.fortinet.com/',
  'SPLK': 'https://investors.splunk.com/',
  'TTD': 'https://investors.thetradedesk.com/',
  'HUBS': 'https://ir.hubspot.com/',
  'ZI': 'https://investor.zoominfo.com/',
  'BILL': 'https://investor.bill.com/',
  'CPNG': 'https://ir.aboutcoupang.com/',
  'SE': 'https://investor.sea.com/',
  'MELI': 'https://investor.mercadolibre.com/',
  'PDD': 'https://investor.pddholdings.com/',
  'BABA': 'https://www.alibabagroup.com/en-US/investor-relations',
  'JD': 'https://ir.jd.com/',
  'BIDU': 'https://ir.baidu.com/',
  'NIO': 'https://ir.nio.com/',
  'LI': 'https://ir.lixiang.com/',
  'XPEV': 'https://ir.xiaopeng.com/',
  
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
  
  // Try to generate a URL based on Yahoo Finance pattern as fallback
  // This won't always work but provides a reasonable fallback
  return `https://finance.yahoo.com/quote/${symbol}`
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