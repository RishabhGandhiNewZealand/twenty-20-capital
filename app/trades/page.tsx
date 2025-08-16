"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { TradeRecord } from "@/types/portfolio"

// Force dynamic rendering to prevent SSR issues with authentication
export const dynamic = 'force-dynamic'
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
  TrendingDown
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

export default function TradesPage() {
  const router = useRouter()
  const user = useUser()
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

  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      router.push('/sign-in')
    }
  }, [user, router])

  // Fetch trades
  const fetchTrades = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/trades', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/sign-in')
          return
        }
        throw new Error('Failed to fetch trades')
      }
      
      const data = await response.json()
      setTrades(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trades')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (user) {
      fetchTrades()
    }
  }, [user, fetchTrades])

  // Group trades by company
  const groupedTrades = useMemo(() => {
    const filtered = trades.filter(trade => 
      searchQuery === "" || 
      trade.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    const groups: GroupedTrades = {}
    
    filtered.forEach(trade => {
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
      
      // Update aggregates
      if (trade.type === 'Buy' || trade.type === 'Reinvestment') {
        groups[key].totalShares += trade.qty
        groups[key].totalValue += trade.value
      } else if (trade.type === 'Sell') {
        groups[key].totalShares -= trade.qty
        groups[key].totalValue -= trade.value
      }
      
      // Update dates
      if (trade.date < groups[key].firstDate) {
        groups[key].firstDate = trade.date
      }
      if (trade.date > groups[key].lastDate) {
        groups[key].lastDate = trade.date
      }
    })
    
    // Calculate average prices and sort trades within groups
    Object.values(groups).forEach(group => {
      group.avgPrice = group.totalValue / group.totalShares || 0
      group.trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    })
    
    return groups
  }, [trades, searchQuery])

  // Toggle company expansion
  const toggleCompany = (company: string) => {
    const newExpanded = new Set(expandedCompanies)
    if (newExpanded.has(company)) {
      newExpanded.delete(company)
    } else {
      newExpanded.add(company)
    }
    setExpandedCompanies(newExpanded)
  }

  // Check if there are any staged changes
  const hasChanges = stagedChanges.new.length > 0 || 
                     stagedChanges.updated.length > 0 || 
                     stagedChanges.deleted.size > 0

  // Handle add new trade
  const handleAddTrade = () => {
    setEditingTrade(null)
    setShowTradeForm(true)
  }

  // Handle edit trade
  const handleEditTrade = (trade: TradeRecord) => {
    setEditingTrade(trade)
    setShowTradeForm(true)
  }

  // Handle save trade from form
  const handleSaveTrade = (trade: TradeRecord) => {
    if (editingTrade?.id) {
      // Update existing trade
      const updatedTrades = trades.map(t => 
        t.id === trade.id ? trade : t
      )
      setTrades(updatedTrades)
      
      // Add to staged updates
      setStagedChanges(prev => ({
        ...prev,
        updated: [...prev.updated.filter(t => t.id !== trade.id), trade]
      }))
    } else {
      // Add new trade (with temporary ID)
      const newTrade = { ...trade, id: -Date.now() } // Negative ID for new trades
      setTrades([newTrade, ...trades])
      
      // Add to staged new trades
      setStagedChanges(prev => ({
        ...prev,
        new: [...prev.new, newTrade]
      }))
    }
    
    setShowTradeForm(false)
    setEditingTrade(null)
  }

  // Handle delete trade
  const handleDeleteTrade = (trade: TradeRecord) => {
    setTradeToDelete(trade)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    if (!tradeToDelete) return
    
    if (tradeToDelete.id && tradeToDelete.id > 0) {
      // Mark existing trade as deleted
      const updatedTrades = trades.map(t => 
        t.id === tradeToDelete.id 
          ? { ...t, deleted_flag: true }
          : t
      )
      setTrades(updatedTrades)
      
      // Add to staged deletions
      setStagedChanges(prev => ({
        ...prev,
        deleted: new Set([...prev.deleted, tradeToDelete.id!])
      }))
    } else {
      // Remove new trade that hasn't been saved yet
      setTrades(trades.filter(t => t.id !== tradeToDelete.id))
      setStagedChanges(prev => ({
        ...prev,
        new: prev.new.filter(t => t.id !== tradeToDelete.id)
      }))
    }
    
    setShowDeleteConfirm(false)
    setTradeToDelete(null)
  }

  // Handle restore deleted trade
  const handleRestoreTrade = (trade: TradeRecord) => {
    const updatedTrades = trades.map(t => 
      t.id === trade.id 
        ? { ...t, deleted_flag: false }
        : t
    )
    setTrades(updatedTrades)
    
    // Remove from staged deletions or add to updates
    if (stagedChanges.deleted.has(trade.id!)) {
      setStagedChanges(prev => {
        const newDeleted = new Set(prev.deleted)
        newDeleted.delete(trade.id!)
        return { ...prev, deleted: newDeleted }
      })
    } else {
      setStagedChanges(prev => ({
        ...prev,
        updated: [...prev.updated.filter(t => t.id !== trade.id), { ...trade, deleted_flag: false }]
      }))
    }
  }

  // Handle save all changes
  const handleSaveChanges = () => {
    setShowSaveConfirm(true)
  }

  const confirmSaveChanges = async () => {
    try {
      setSaving(true)
      setShowSaveConfirm(false)
      
      // Prepare batch changes - combine all trades into a single array
      const allTrades = [
        ...stagedChanges.new.map(t => {
          const { id, ...tradeData } = t
          return tradeData // New trades without ID
        }),
        ...stagedChanges.updated,
        ...Array.from(stagedChanges.deleted).map(id => ({
          id,
          deleted_flag: true
        } as TradeRecord))
      ]
      
      const batchData = {
        trades: allTrades
      }
      
      const response = await fetch('/api/trades/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(batchData)
      })
      
      const result = await response.json()
      
      if (!response.ok || result.error) {
        throw new Error(result.details || result.error || 'Failed to save changes')
      }
      
      // Clear staged changes
      setStagedChanges({
        new: [],
        updated: [],
        deleted: new Set()
      })
      
      // Refresh trades
      await fetchTrades()
      
      // Show success message
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  // Handle discard changes
  const handleDiscardChanges = () => {
    setStagedChanges({
      new: [],
      updated: [],
      deleted: new Set()
    })
    fetchTrades()
  }

  if (!user) {
    return null // Will redirect to login
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading trades...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Trade Management</h1>
        <p className="text-muted-foreground">Manage your portfolio trades with full CRUD operations</p>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="flex items-center gap-2 pt-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {hasChanges && (
        <Card className="mb-6 border-warning bg-warning/5">
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              <p className="text-sm">
                You have unsaved changes: {stagedChanges.new.length} new, {stagedChanges.updated.length} updated, {stagedChanges.deleted.size} deleted
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDiscardChanges}
              >
                <X className="h-4 w-4 mr-1" />
                Discard
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveChanges}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-1" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex-1">
              <CardTitle>All Trades ({trades.length})</CardTitle>
              <div className="mt-3 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by company name or symbol..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={handleAddTrade} className="self-start">
              <Plus className="h-4 w-4 mr-2" />
              Add New Trade
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(groupedTrades).map(([companyKey, group]) => {
              const [code, ...nameParts] = companyKey.split('-')
              const name = nameParts.join('-')
              const isExpanded = expandedCompanies.has(companyKey)
              const hasDeletedTrades = group.trades.some(t => t.deleted_flag)
              
              return (
                <div key={companyKey} className="border rounded-lg overflow-hidden">
                  {/* Company Header */}
                  <div
                    className={`p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors ${
                      hasDeletedTrades ? 'opacity-75' : ''
                    }`}
                    onClick={() => toggleCompany(companyKey)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <span className="font-semibold text-lg">{code}</span>
                          <span className="ml-2 text-muted-foreground">{name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-right">
                          <div className="text-muted-foreground">Trades</div>
                          <div className="font-medium">{group.trades.length}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-muted-foreground">Net Shares</div>
                          <div className={`font-medium ${
                            group.totalShares > 0 ? 'text-green-600' : 
                            group.totalShares < 0 ? 'text-red-600' : 
                            'text-gray-500'
                          }`}>
                            {group.totalShares.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-muted-foreground">Total Value</div>
                          <div className="font-medium">
                            {formatCurrencyWithDecimals(Math.abs(group.totalValue), 'NZD', 2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Trades List */}
                  {isExpanded && (
                    <div className="divide-y">
                      {group.trades.map((trade) => (
                        <div
                          key={trade.id || `new-${trade.code}-${trade.date}`}
                          className={`p-3 ${
                            trade.deleted_flag ? 'bg-destructive/5 opacity-60' : ''
                          } ${
                            trade.id && trade.id < 0 ? 'bg-primary/5' : ''
                          } hover:bg-muted/10 transition-colors`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                {trade.type === 'Buy' ? (
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                ) : trade.type === 'Sell' ? (
                                  <TrendingDown className="h-4 w-4 text-red-600" />
                                ) : (
                                  <div className="h-4 w-4" />
                                )}
                                <span className={`font-medium ${
                                  trade.type === 'Buy' ? 'text-green-600' : 
                                  trade.type === 'Sell' ? 'text-red-600' : 
                                  'text-blue-600'
                                }`}>
                                  {trade.type}
                                </span>
                                {trade.id && trade.id < 0 && (
                                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">NEW</span>
                                )}
                                {trade.deleted_flag && (
                                  <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">DEL</span>
                                )}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Date: </span>
                                <span className="font-medium">{formatDate(trade.date)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Qty: </span>
                                <span className="font-medium">{trade.qty}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Price: </span>
                                <span className="font-medium">
                                  {formatCurrencyWithDecimals(trade.price, trade.instrumentCurrency, 2)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Value: </span>
                                <span className="font-medium">
                                  {formatCurrencyWithDecimals(trade.value, 'NZD', 2)}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-1 ml-4">
                              {trade.deleted_flag ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRestoreTrade(trade)}
                                  title="Restore"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditTrade(trade)}
                                    title="Edit"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteTrade(trade)}
                                    className="text-destructive hover:bg-destructive/10"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Trade Form Modal */}
      {showTradeForm && (
        <TradeFormModal
          trade={editingTrade}
          onSave={handleSaveTrade}
          onClose={() => {
            setShowTradeForm(false)
            setEditingTrade(null)
          }}
        />
      )}

      {/* Save Confirmation Dialog */}
      <ConfirmationDialog
        open={showSaveConfirm}
        onOpenChange={setShowSaveConfirm}
        title="Save Changes"
        description={`Are you sure you want to save all staged changes? This will add ${stagedChanges.new.length} new trades, update ${stagedChanges.updated.length} trades, and delete ${stagedChanges.deleted.size} trades.`}
        onConfirm={confirmSaveChanges}
        confirmText="Save All Changes"
        confirmVariant="default"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Trade"
        description={`Are you sure you want to delete this trade? ${tradeToDelete?.code} - ${tradeToDelete?.name} (${formatDate(tradeToDelete?.date || '')})`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        confirmVariant="destructive"
      />
    </div>
  )
}