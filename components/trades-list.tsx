"use client"

import { TradeRecord } from "@/types/portfolio"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2, Check, AlertCircle } from "lucide-react"
import { formatDate, formatCurrencyWithDecimals } from "@/lib/format-utils"
import { cn } from "@/lib/utils"

interface StagedChange {
  type: 'add' | 'edit' | 'delete'
  originalRecord?: TradeRecord & { id?: number }
  newRecord?: TradeRecord
  tempId?: string
}

interface TradesListProps {
  trades: (TradeRecord & { id?: number })[]
  stagedChanges: StagedChange[]
  onEdit: (trade: TradeRecord & { id?: number }) => void
  onDelete: (trade: TradeRecord & { id?: number }) => void
}

export function TradesList({ trades, stagedChanges, onEdit, onDelete }: TradesListProps) {
  const getTradeStatus = (trade: TradeRecord & { id?: number }) => {
    // Check if this trade has staged changes
    if (trade.id && trade.id < 0) {
      // This is a staged add (negative IDs are temporary)
      return 'added'
    }
    
    const change = stagedChanges.find(c => {
      if (c.type === 'edit' && c.originalRecord?.id === trade.id) return true
      if (c.type === 'delete' && c.originalRecord?.id === trade.id) return true
      return false
    })
    
    return change?.type
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Buy':
        return 'text-green-600'
      case 'Sell':
        return 'text-red-600'
      case 'Reinvestment':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'added':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
            <Check className="h-3 w-3" />
            New
          </span>
        )
      case 'edit':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
            <Edit2 className="h-3 w-3" />
            Modified
          </span>
        )
      case 'delete':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
            <Trash2 className="h-3 w-3" />
            Deleted
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="max-h-[600px] overflow-y-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trades.map((trade, index) => {
              const status = getTradeStatus(trade)
              const isDeleted = status === 'delete'
              
              return (
                <tr 
                  key={trade.id || `temp-${index}`}
                  className={cn(
                    "hover:bg-gray-50 transition-colors",
                    isDeleted && "opacity-50"
                  )}
                >
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatDate(trade.date)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {trade.code}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {trade.name}
                  </td>
                  <td className={cn("px-4 py-3 text-sm font-medium", getTypeColor(trade.type))}>
                    {trade.type}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {trade.qty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {formatCurrencyWithDecimals(trade.price, trade.instrumentCurrency)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {formatCurrencyWithDecimals(trade.value, 'NZD')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getStatusBadge(status)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(trade)}
                        disabled={isDeleted}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(trade)}
                        disabled={isDeleted}
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {trades.length > 10 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Showing {trades.length} trade{trades.length !== 1 ? 's' : ''} (sorted by date, newest first)
        </div>
      )}
    </div>
  )
}