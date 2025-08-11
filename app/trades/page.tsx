"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAnonymization } from "@/contexts/AnonymizationContext"
import { TradeRecord } from "@/types/portfolio"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Edit, 
  Trash2, 
  Plus, 
  Save, 
  RotateCcw,
  AlertCircle,
  Check,
  X
} from "lucide-react"
import { formatDate, formatCurrencyWithDecimals } from "@/lib/format-utils"
import TradeFormModal from "@/components/trade-form-modal"
import ConfirmationDialog from "@/components/confirmation-dialog"

interface StagedChanges {
  new: TradeRecord[]
  updated: TradeRecord[]
  deleted: Set<number>
}

export default function TradesPage() {
  const router = useRouter()
  const { isAnonymized } = useAnonymization()
  const [trades, setTrades] = useState<TradeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
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

  // Check if user is admin (full view mode)
  useEffect(() => {
    if (isAnonymized) {
      router.push('/portfolio')
    }
  }, [isAnonymized, router])

  // Fetch trades
  const fetchTrades = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/trades', {
        headers: {
          'x-admin-auth': 'true'
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
  }, [])

  useEffect(() => {
    if (!isAnonymized) {
      fetchTrades()
    }
  }, [isAnonymized, fetchTrades])

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
      
      // Prepare batch changes
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
          'x-admin-auth': 'true'
        },
        body: JSON.stringify(batchData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to save changes')
      }
      
      const result = await response.json()
      
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

  if (isAnonymized) {
    return null // Will redirect
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Trades ({trades.length})</CardTitle>
          <Button onClick={handleAddTrade}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Trade
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {trades.map((trade) => (
              <div
                key={trade.id || `new-${trade.code}-${trade.date}`}
                className={`p-4 border rounded-lg ${
                  trade.deleted_flag ? 'bg-destructive/5 opacity-60' : ''
                } ${
                  trade.id && trade.id < 0 ? 'bg-primary/5 border-primary/20' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="font-semibold text-lg">{trade.code}</span>
                      <span className="text-muted-foreground">{trade.name}</span>
                      {trade.id && trade.id < 0 && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">NEW</span>
                      )}
                      {trade.deleted_flag && (
                        <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">DELETED</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Date:</span>
                        <span className="ml-2 font-medium">{formatDate(trade.date)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <span className={`ml-2 font-medium ${
                          trade.type === 'Buy' ? 'text-green-600' : 
                          trade.type === 'Sell' ? 'text-red-600' : 
                          'text-blue-600'
                        }`}>
                          {trade.type}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Qty:</span>
                        <span className="ml-2 font-medium">{trade.qty}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Price:</span>
                        <span className="ml-2 font-medium">
                          {formatCurrencyWithDecimals(trade.price, trade.instrumentCurrency, 2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Value:</span>
                        <span className="ml-2 font-medium">
                          {formatCurrencyWithDecimals(trade.value, 'NZD', 2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Market:</span>
                        <span className="ml-2 font-medium">{trade.marketCode}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {trade.deleted_flag ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreTrade(trade)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTrade(trade)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTrade(trade)}
                          className="text-destructive hover:bg-destructive/10"
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