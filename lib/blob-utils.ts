import { list, head } from '@vercel/blob'
import { logger } from './logger'
import { TRADE_DATA_BLOB_PATHNAME } from './constants'

/**
 * Downloads the trade data CSV from Vercel Blob storage using the SDK
 * This uses the BLOB_READ_WRITE_TOKEN environment variable automatically
 */
export async function downloadTradeDataFromBlob(): Promise<string> {
  try {
    // First, check if the blob exists by getting its metadata
    const blobMetadata = await head(TRADE_DATA_BLOB_PATHNAME)
    
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