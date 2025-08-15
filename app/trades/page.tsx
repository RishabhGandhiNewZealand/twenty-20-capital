"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@stackframe/stack"
import { useAnonymization } from "@/contexts/AnonymizationContext"
import { TradeRecord } from "@/types/portfolio"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Edit, 
  Trash2, 
  Plus, 
  Save, 
  RotateCcw,
  AlertCircle,
  Check,
  X,
  Search,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  User
} from "lucide-react"
import { formatDate, formatCurrencyWithDecimals } from "@/lib/format-utils"
import TradeFormModal from "@/components/trade-form-modal"
import ConfirmationDialog from "@/components/confirmation-dialog"

interface StagedChanges {
  new: TradeRecord[]
  updated: TradeRecord[]
  deleted: Set<number>
}

interface GroupedTrades {
  [company: string]: {
    trades: TradeRecord[]
    totalShares: number
    totalValue: number
    avgPrice: number
    firstDate: string
    lastDate: string
  }
}

// Helper function to get email from Stack user
function getRawEmail(u: any): string {
  return (
    u?.primaryEmail ||
    u?.email ||
    u?.primaryEmailAddress?.emailAddress ||
    u?.primaryEmailAddress?.email ||
    ""
  )
  .toString()
}

export default function TradesPage() {
  const router = useRouter()
  const user = useUser()
  const { isAnonymized } = useAnonymization()
  const [trades, setTrades] = useState<TradeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set())
  
  // Staging state
  const [stagedChanges, setStagedChanges] = useState<StagedChanges>({
    new: [],
    updated: [],
    deleted: new Set()
  })
  
  // Modal states
  const [showTradeForm, setShowTradeForm] = useState(false)
  const [editingTrade, setEditingTrade] = useState<TradeRecord | null>(null)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [tradeToDelete, setTradeToDelete] = useState<TradeRecord | null>(null)

  // Check if user is admin
  const isAdmin = useMemo(() => {
    if (!user) return false
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
    const userEmail = getRawEmail(user)
    return adminEmail && userEmail === adminEmail
  }, [user])

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  // Fetch trades
  const fetchTrades = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const response = await fetch('/api/trades', {
        headers: {
          'x-user-id': user.id || '',
          'x-user-email': getRawEmail(user),
          'x-is-admin': isAdmin.toString()
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch trades')
      }
      
      const data = await response.json()
      setTrades(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trades')
    } finally {
      setLoading(false)
    }
  }, [user, isAdmin])

  useEffect(() => {
    fetchTrades()
  }, [fetchTrades])

  // Group trades by company
  const groupedTrades = useMemo(() => {
    const groups: GroupedTrades = {}
    
    // Filter trades based on search and exclude soft-deleted
    const filteredTrades = trades.filter(trade => {
      const isDeleted = trade.deleted_flag || stagedChanges.deleted.has(trade.id!)
      const matchesSearch = !searchQuery || 
        trade.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trade.code.toLowerCase().includes(searchQuery.toLowerCase())
      
      return !isDeleted && matchesSearch
    })
    
    // Include staged new trades
    const allTrades = [...filteredTrades, ...stagedChanges.new.filter(trade => 
      !searchQuery || 
      trade.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.code.toLowerCase().includes(searchQuery.toLowerCase())
    )]
    
    allTrades.forEach(trade => {
      const key = `${trade.code}-${trade.name}`
      if (!groups[key]) {
        groups[key] = {
          trades: [],
          totalShares: 0,
          totalValue: 0,
          avgPrice: 0,
          firstDate: trade.date,
          lastDate: trade.date
        }
      }
      
      groups[key].trades.push(trade)
      
      // Update stats
      if (trade.type === 'Buy' || trade.type === 'Reinvestment') {
        groups[key].totalShares += trade.qty
        groups[key].totalValue += trade.value
      } else if (trade.type === 'Sell') {
        groups[key].totalShares -= trade.qty
        groups[key].totalValue -= trade.value
      }
      
      // Update date range
      if (trade.date < groups[key].firstDate) groups[key].firstDate = trade.date
      if (trade.date > groups[key].lastDate) groups[key].lastDate = trade.date
    })
    
    // Calculate average price and sort trades
    Object.values(groups).forEach(group => {
      group.avgPrice = group.totalShares > 0 ? group.totalValue / group.totalShares : 0
      group.trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    })
    
    return groups
  }, [trades, searchQuery, stagedChanges])

  // Check if there are unsaved changes
  const hasUnsavedChanges = stagedChanges.new.length > 0 || 
    stagedChanges.updated.length > 0 || 
    stagedChanges.deleted.size > 0

  // Handle trade form submission
  const handleTradeSubmit = (trade: TradeRecord) => {
    if (editingTrade) {
      // Update existing trade
      if (editingTrade.id) {
        setStagedChanges(prev => ({
          ...prev,
          updated: [...prev.updated.filter(t => t.id !== editingTrade.id), trade]
        }))
        setTrades(prev => prev.map(t => t.id === editingTrade.id ? trade : t))
      } else {
        // Update staged new trade
        setStagedChanges(prev => ({
          ...prev,
          new: prev.new.map(t => t === editingTrade ? trade : t)
        }))
      }
    } else {
      // Add new trade
      const tempId = `temp-${Date.now()}`
      const newTrade = { ...trade, id: tempId as any }
      setStagedChanges(prev => ({
        ...prev,
        new: [...prev.new, newTrade]
      }))
    }
    
    setShowTradeForm(false)
    setEditingTrade(null)
  }

  // Handle delete
  const handleDelete = (trade: TradeRecord) => {
    setTradeToDelete(trade)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    if (tradeToDelete) {
      if (tradeToDelete.id && typeof tradeToDelete.id === 'number') {
        // Mark existing trade for deletion
        setStagedChanges(prev => ({
          ...prev,
          deleted: new Set([...prev.deleted, tradeToDelete.id as number])
        }))
      } else {
        // Remove staged new trade
        setStagedChanges(prev => ({
          ...prev,
          new: prev.new.filter(t => t !== tradeToDelete)
        }))
      }
    }
    setShowDeleteConfirm(false)
    setTradeToDelete(null)
  }

  // Handle restore
  const handleRestore = (tradeId: number) => {
    setStagedChanges(prev => ({
      ...prev,
      deleted: new Set([...prev.deleted].filter(id => id !== tradeId))
    }))
  }

  // Save all changes
  const saveChanges = async () => {
    if (!user) return
    
    try {
      setSaving(true)
      setError(null)
      
      const response = await fetch('/api/trades/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id || '',
          'x-user-email': getRawEmail(user),
          'x-is-admin': isAdmin.toString()
        },
        body: JSON.stringify({
          new: stagedChanges.new,
          updated: stagedChanges.updated,
          deleted: Array.from(stagedChanges.deleted)
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to save changes')
      }
      
      // Clear staged changes and refresh
      setStagedChanges({ new: [], updated: [], deleted: new Set() })
      await fetchTrades()
      setShowSaveConfirm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  // Discard all changes
  const discardChanges = () => {
    setStagedChanges({ new: [], updated: [], deleted: new Set() })
    fetchTrades()
  }

  // Toggle company expansion
  const toggleCompany = (company: string) => {
    setExpandedCompanies(prev => {
      const next = new Set(prev)
      if (next.has(company)) {
        next.delete(company)
      } else {
        next.add(company)
      }
      return next
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Please log in to view your trades</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading trades...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              {isAdmin ? 'Portfolio Trades' : 'My Trades'}
            </h1>
            {isAdmin && (
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                <User className="h-4 w-4" />
                Portfolio Admin
              </div>
            )}
          </div>
          <p className="text-gray-600">
            {isAdmin 
              ? 'Manage portfolio trades and transactions'
              : 'Manage your personal trades and transactions'
            }
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Unsaved changes indicator */}
        {hasUnsavedChanges && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-yellow-700">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">You have unsaved changes</span>
                <span className="text-sm">
                  ({stagedChanges.new.length} new, {stagedChanges.updated.length} updated, {stagedChanges.deleted.size} deleted)
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={discardChanges}
                  disabled={saving}
                >
                  <X className="h-4 w-4 mr-1" />
                  Discard
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowSaveConfirm(true)}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save All
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by company name or ticker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button onClick={() => {
            setEditingTrade(null)
            setShowTradeForm(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Trade
          </Button>
        </div>

        {/* Trades list grouped by company */}
        <div className="space-y-4">
          {Object.entries(groupedTrades).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                {searchQuery ? 'No trades found matching your search' : 'No trades yet. Add your first trade to get started.'}
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedTrades)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([company, group]) => {
                const isExpanded = expandedCompanies.has(company)
                const [code, name] = company.split('-')
                const isPositive = group.totalValue >= 0
                
                return (
                  <Card key={company} className="overflow-hidden">
                    <CardHeader 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleCompany(company)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <CardTitle className="text-lg">{code}</CardTitle>
                            <p className="text-sm text-gray-600">{name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            {isPositive ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                            <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              {group.totalShares.toFixed(2)} shares
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {group.trades.length} trade{group.trades.length !== 1 ? 's' : ''} • 
                            {formatDate(group.firstDate)} - {formatDate(group.lastDate)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent className="pt-0">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b text-sm text-gray-600">
                                <th className="text-left py-2">Date</th>
                                <th className="text-left py-2">Type</th>
                                <th className="text-right py-2">Quantity</th>
                                <th className="text-right py-2">Price</th>
                                <th className="text-right py-2">Value</th>
                                <th className="text-right py-2">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.trades.map((trade, index) => {
                                const isDeleted = trade.id && typeof trade.id === 'number' && stagedChanges.deleted.has(trade.id)
                                const isNew = !trade.id || typeof trade.id === 'string'
                                const isUpdated = stagedChanges.updated.some(t => t.id === trade.id)
                                
                                return (
                                  <tr 
                                    key={trade.id || index} 
                                    className={`border-b last:border-0 ${
                                      isDeleted ? 'opacity-50 bg-red-50' : 
                                      isNew ? 'bg-green-50' : 
                                      isUpdated ? 'bg-yellow-50' : ''
                                    }`}
                                  >
                                    <td className="py-2">{formatDate(trade.date)}</td>
                                    <td className="py-2">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        trade.type === 'Buy' ? 'bg-blue-100 text-blue-700' :
                                        trade.type === 'Sell' ? 'bg-red-100 text-red-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {trade.type}
                                      </span>
                                    </td>
                                    <td className="text-right py-2">{trade.qty.toFixed(2)}</td>
                                    <td className="text-right py-2">
                                      {formatCurrencyWithDecimals(trade.price, trade.instrumentCurrency)}
                                    </td>
                                    <td className="text-right py-2">
                                      {formatCurrencyWithDecimals(trade.value, trade.instrumentCurrency)}
                                    </td>
                                    <td className="text-right py-2">
                                      <div className="flex justify-end gap-1">
                                        {isDeleted ? (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRestore(trade.id as number)}
                                          >
                                            <RotateCcw className="h-4 w-4" />
                                          </Button>
                                        ) : (
                                          <>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                setEditingTrade(trade)
                                                setShowTradeForm(true)
                                              }}
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleDelete(trade)}
                                            >
                                              <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                          </>
                                        )}
                                        {(isNew || isUpdated) && (
                                          <span className="ml-2">
                                            {isNew && <span className="text-xs text-green-600">NEW</span>}
                                            {isUpdated && <span className="text-xs text-yellow-600">EDITED</span>}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })
          )}
        </div>
      </div>

      {/* Trade Form Modal */}
      {showTradeForm && (
        <TradeFormModal
          trade={editingTrade}
          onSubmit={handleTradeSubmit}
          onClose={() => {
            setShowTradeForm(false)
            setEditingTrade(null)
          }}
        />
      )}

      {/* Save Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showSaveConfirm}
        title="Save Changes"
        message={`Are you sure you want to save all changes? This will create ${stagedChanges.new.length} new trades, update ${stagedChanges.updated.length} trades, and delete ${stagedChanges.deleted.size} trades.`}
        confirmLabel="Save All"
        cancelLabel="Cancel"
        onConfirm={saveChanges}
        onCancel={() => setShowSaveConfirm(false)}
        isLoading={saving}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Trade"
        message={`Are you sure you want to delete this trade? This action will be permanent once you save changes.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />
    </div>
  )
}