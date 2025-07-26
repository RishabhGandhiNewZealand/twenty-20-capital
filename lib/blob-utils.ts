import { list, head } from '@vercel/blob'
import { logger } from './logger'
import { TRADE_DATA_BLOB_URL } from './constants'

/**
 * Extracts the pathname from a Vercel Blob URL
**/
function extractPathnameFromBlobUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    // Remove leading slash from pathname
    return urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname
  } catch (error) {
    throw new Error(`Invalid blob URL: ${url}`)
  }
}

/**
 * Downloads the trade data CSV from Vercel Blob storage using the SDK
 * This uses the BLOB_READ_WRITE_TOKEN environment variable automatically
 */
export async function downloadTradeDataFromBlob(): Promise<string> {
  try {
    if (!TRADE_DATA_BLOB_URL) {
      throw new Error('TRADE_DATA_BLOB_URL environment variable is not configured')
    }

    // Extract pathname from the full URL
    const pathname = extractPathnameFromBlobUrl(TRADE_DATA_BLOB_URL)
    
    // First, check if the blob exists by getting its metadata
    const blobMetadata = await head(pathname)
    
    if (!blobMetadata) {
      throw new Error('Trade data blob not found')
    }
    
    logger.debug('Found trade data blob', { 
      pathname: blobMetadata.pathname,
      size: blobMetadata.size,
      uploadedAt: blobMetadata.uploadedAt 
    })
    
    // Download the blob content using the download URL
    const response = await fetch(blobMetadata.downloadUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to download blob: ${response.statusText}`)
    }
    
    const csvContent = await response.text()
    return csvContent
  } catch (error) {
    logger.error('Error downloading trade data from blob:', error)
    throw new Error('Failed to download trade data from blob storage')
  }
}

/**
 * Lists all blobs in the TradeData folder
 * Useful for debugging or showing available trade history files
 */
export async function listTradeDataBlobs() {
  try {
    const { blobs } = await list({
      prefix: 'TradeData/',
      limit: 100
    })
    
    return blobs
  } catch (error) {
    logger.error('Error listing trade data blobs:', error)
    return []
  }
}
