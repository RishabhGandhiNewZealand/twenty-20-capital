"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
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
import { useUser } from "@stackframe/stack"

function getUserId(u: any): string {
  return (u?.id || u?.userId || "").toString()
}

function getUserEmail(u: any): string {
  return (
    u?.primaryEmail ||
    u?.email ||
    u?.primaryEmailAddress?.emailAddress ||
    u?.primaryEmailAddress?.email ||
    ""
  ).toString()
}

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
  const userId = useMemo(() => getUserId(user), [user])
  const userEmail = useMemo(() => getUserEmail(user), [user])
  const isAdmin = useMemo(() => {
    const adminEmail = (process.env.ADMIN_EMAIL || "").toString()
    return adminEmail && userEmail && userEmail.toLowerCase() === adminEmail.toLowerCase()
  }, [userEmail])

  const [trades, setTrades] = useState<TradeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set())
  
  const [stagedChanges, setStagedChanges] = useState<StagedChanges>({
    new: [],
    updated: [],
    deleted: new Set()
  })
  
  const [showTradeForm, setShowTradeForm] = useState(false)
  const [editingTrade, setEditingTrade] = useState<TradeRecord | null>(null)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [tradeToDelete, setTradeToDelete] = useState<TradeRecord | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const fetchTrades = useCallback(async () => {
    try {
      if (!userId) return
      setLoading(true)
      const response = await fetch('/api/trades', {
        headers: {
          'x-user-id': userId,
          'x-user-email': userEmail,
          'x-is-admin': isAdmin ? 'true' : 'false'
        }
      })
      if (!response.ok) throw new Error('Failed to fetch trades')
      const data = await response.json()
      setTrades(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trades')
    } finally {
      setLoading(false)
    }
  }, [userId, userEmail, isAdmin])

  useEffect(() => {
    fetchTrades()
  }, [fetchTrades])

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
      
      if (trade.type === 'Buy' || trade.type === 'Reinvestment') {
        const qty = isNaN(trade.qty) ? 0 : trade.qty
        const val = isNaN(trade.value) ? 0 : trade.value
        groups[key].totalShares += qty
        groups[key].totalValue += val
      } else if (trade.type === 'Sell') {
        // Sell trades may be stored with negative quantities in the database
        // Use Math.abs() to ensure we subtract the correct positive amount
        const qty = isNaN(trade.qty) ? 0 : Math.abs(trade.qty)
        const val = isNaN(trade.value) ? 0 : Math.abs(trade.value)
        groups[key].totalShares -= qty
        groups[key].totalValue -= val
      }
      
      if (trade.date < groups[key].firstDate) groups[key].firstDate = trade.date
      if (trade.date > groups[key].lastDate) groups[key].lastDate = trade.date
    })
    
    Object.values(groups).forEach(group => {
      group.avgPrice = group.totalShares > 0 ? (group.totalValue / group.totalShares) : 0
    })
    
    return groups
  }, [trades, searchQuery])

  const toggleCompany = (company: string) => {
    const newExpanded = new Set(expandedCompanies)
    if (newExpanded.has(company)) newExpanded.delete(company)
    else newExpanded.add(company)
    setExpandedCompanies(newExpanded)
  }

  const hasChanges = stagedChanges.new.length > 0 || 
                     stagedChanges.updated.length > 0 || 
                     stagedChanges.deleted.size > 0

  const handleAddTrade = () => {
    setEditingTrade(null)
    setShowTradeForm(true)
  }

  const handleEditTrade = (trade: TradeRecord) => {
    setEditingTrade(trade)
    setShowTradeForm(true)
  }

  const handleSaveTrade = (trade: TradeRecord) => {
    if (editingTrade?.id) {
      const updatedTrades = trades.map(t => 
        t.id === trade.id ? trade : t
      )
      setTrades(updatedTrades)
      setStagedChanges(prev => ({
        ...prev,
        updated: [...prev.updated.filter(t => t.id !== trade.id), trade]
      }))
    } else {
      const newTrade = { ...trade, id: -Date.now() }
      setTrades([newTrade, ...trades])
      setStagedChanges(prev => ({
        ...prev,
        new: [...prev.new, newTrade]
      }))
    }
    
    setShowTradeForm(false)
    setEditingTrade(null)
  }

  const handleDeleteTrade = (trade: TradeRecord) => {
    setTradeToDelete(trade)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    if (!tradeToDelete) return
    
    if (tradeToDelete.id && tradeToDelete.id > 0) {
      const updatedTrades = trades.map(t => 
        t.id === tradeToDelete.id 
          ? { ...t, deleted_flag: true }
          : t
      )
      setTrades(updatedTrades)
      setStagedChanges(prev => ({
        ...prev,
        deleted: new Set([...prev.deleted, tradeToDelete.id!])
      }))
    } else {
      setTrades(trades.filter(t => t.id !== tradeToDelete.id))
      setStagedChanges(prev => ({
        ...prev,
        new: prev.new.filter(t => t.id !== tradeToDelete.id)
      }))
    }
    
    setShowDeleteConfirm(false)
    setTradeToDelete(null)
  }

  const handleRestoreTrade = (trade: TradeRecord) => {
    const updatedTrades = trades.map(t => 
      t.id === trade.id 
        ? { ...t, deleted_flag: false }
        : t
    )
    setTrades(updatedTrades)
    
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

  const handleSaveChanges = () => {
    setShowSaveConfirm(true)
  }

  const confirmSaveChanges = async () => {
    try {
      setSaving(true)
      setShowSaveConfirm(false)
      
      const batchData = {
        new: stagedChanges.new.map(t => {
          const { id, ...tradeData } = t
          return tradeData
        }),
        updated: stagedChanges.updated,
        deleted: Array.from(stagedChanges.deleted)
      }
      
      const response = await fetch('/api/trades/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-user-email': userEmail,
          'x-is-admin': isAdmin ? 'true' : 'false'
        },
        body: JSON.stringify(batchData)
      })
      
      const result = await response.json()
      
      if (!response.ok || result.error) {
        throw new Error(result.details || result.error || 'Failed to save changes')
      }
      
      setStagedChanges({
        new: [],
        updated: [],
        deleted: new Set()
      })
      
      await fetchTrades()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleDiscardChanges = () => {
    setStagedChanges({
      new: [],
      updated: [],
      deleted: new Set()
    })
    fetchTrades()
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
                            {Number.isFinite(group.totalShares) ? group.totalShares.toFixed(2) : '0.00'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-muted-foreground">Total Value</div>
                          <div className="font-medium">
                            {formatCurrencyWithDecimals(Math.abs(isNaN(group.totalValue) ? 0 : group.totalValue), 'NZD', 2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
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
                                <span className="font-medium">{isNaN(trade.qty) ? 0 : trade.qty}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Price: </span>
                                <span className="font-medium">
                                  {formatCurrencyWithDecimals(isNaN(trade.price) ? 0 : trade.price, trade.instrumentCurrency, 2)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Value: </span>
                                <span className="font-medium">
                                  {formatCurrencyWithDecimals(isNaN(trade.value) ? 0 : trade.value, 'NZD', 2)}
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

      <ConfirmationDialog
        open={showSaveConfirm}
        onOpenChange={setShowSaveConfirm}
        title="Save Changes"
        description={`Are you sure you want to save all staged changes? This will add ${stagedChanges.new.length} new trades, update ${stagedChanges.updated.length} trades, and delete ${stagedChanges.deleted.size} trades.`}
        onConfirm={confirmSaveChanges}
        confirmText="Save All Changes"
        confirmVariant="default"
      />

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