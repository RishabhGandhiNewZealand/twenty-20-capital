"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAnonymization } from "@/contexts/AnonymizationContext"
import { TradeRecord } from "@/types/portfolio"
import { Loader2, Plus, Save, AlertCircle } from "lucide-react"
import { TradesList } from "@/components/trades-list"
import { TradeFormModal } from "@/components/trade-form-modal"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { formatDate } from "@/lib/format-utils"

interface StagedChange {
  type: 'add' | 'edit' | 'delete'
  originalRecord?: TradeRecord & { id?: number }
  newRecord?: TradeRecord
  tempId?: string
}

export default function TradesPage() {
  const router = useRouter()
  const { isAnonymized } = useAnonymization()
  const [trades, setTrades] = useState<(TradeRecord & { id?: number })[]>([])
  const [stagedChanges, setStagedChanges] = useState<StagedChange[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTrade, setEditingTrade] = useState<(TradeRecord & { id?: number }) | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [tradeToDelete, setTradeToDelete] = useState<(TradeRecord & { id?: number }) | null>(null)
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false)

  // Check authentication on mount
  useEffect(() => {
    if (isAnonymized) {
      // User is not authenticated, redirect to home with error message
      router.push('/?error=unauthorized')
    }
  }, [isAnonymized, router])

  // Fetch trades data
  useEffect(() => {
    const fetchTrades = async () => {
      if (isAnonymized) return // Don't fetch if not authenticated
      
      try {
        setLoading(true)
        const response = await fetch('/api/trades')
        
        if (!response.ok) {
          throw new Error('Failed to fetch trades')
        }
        
        const data = await response.json()
        setTrades(data.trades || [])
      } catch (err) {
        console.error('Error fetching trades:', err)
        setError('Failed to load trades data')
      } finally {
        setLoading(false)
      }
    }

    fetchTrades()
  }, [isAnonymized])

  // Apply staged changes to the displayed trades
  const getDisplayedTrades = useCallback(() => {
    let displayedTrades = [...trades]
    
    // Apply staged changes
    stagedChanges.forEach(change => {
      if (change.type === 'add' && change.newRecord) {
        displayedTrades.push({
          ...change.newRecord,
          id: change.tempId ? -parseInt(change.tempId) : undefined
        })
      } else if (change.type === 'edit' && change.originalRecord && change.newRecord) {
        const index = displayedTrades.findIndex(t => 
          (t.id && t.id === change.originalRecord?.id) ||
          (change.tempId && t.id === -parseInt(change.tempId))
        )
        if (index !== -1) {
          displayedTrades[index] = {
            ...change.newRecord,
            id: change.originalRecord.id || (change.tempId ? -parseInt(change.tempId) : undefined)
          }
        }
      }
      // Note: We don't filter out deleted trades - they remain visible with a "deleted" status
    })
    
    // Sort by date descending (most recent first)
    return displayedTrades.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [trades, stagedChanges])

  const handleAddTrade = () => {
    setEditingTrade(null)
    setIsFormOpen(true)
  }

  const handleEditTrade = (trade: TradeRecord & { id?: number }) => {
    setEditingTrade(trade)
    setIsFormOpen(true)
  }

  const handleDeleteTrade = (trade: TradeRecord & { id?: number }) => {
    setTradeToDelete(trade)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (!tradeToDelete) return
    
    // Check if this is a previously staged add that we're now deleting
    const existingAddIndex = stagedChanges.findIndex(
      change => change.type === 'add' && 
      change.tempId && 
      tradeToDelete.id === -parseInt(change.tempId)
    )
    
    if (existingAddIndex !== -1) {
      // Remove the add from staged changes (this is a new trade that was never saved)
      setStagedChanges(prev => prev.filter((_, index) => index !== existingAddIndex))
    } else {
      // Check if this trade was previously edited or deleted
      const existingChangeIndex = stagedChanges.findIndex(
        change => (change.type === 'edit' || change.type === 'delete') && 
        change.originalRecord?.id === tradeToDelete.id
      )
      
      if (existingChangeIndex !== -1) {
        // Replace any existing change with a delete
        setStagedChanges(prev => {
          const updated = [...prev]
          updated[existingChangeIndex] = {
            type: 'delete',
            originalRecord: trades.find(t => t.id === tradeToDelete.id)
          }
          return updated
        })
      } else {
        // Add delete to staged changes
        setStagedChanges(prev => [...prev, {
          type: 'delete',
          originalRecord: tradeToDelete
        }])
      }
    }
    
    setDeleteConfirmOpen(false)
    setTradeToDelete(null)
  }

  const handleFormSubmit = (tradeData: TradeRecord) => {
    if (editingTrade) {
      // Editing existing trade
      if (editingTrade.id && editingTrade.id < 0) {
        // Editing a staged add
        const tempId = Math.abs(editingTrade.id).toString()
        const changeIndex = stagedChanges.findIndex(
          change => change.type === 'add' && change.tempId === tempId
        )
        if (changeIndex !== -1) {
          setStagedChanges(prev => {
            const updated = [...prev]
            updated[changeIndex] = {
              ...updated[changeIndex],
              newRecord: tradeData
            }
            return updated
          })
        }
      } else {
        // Editing an existing database trade
        const existingChangeIndex = stagedChanges.findIndex(
          change => change.type === 'edit' && 
          change.originalRecord?.id === editingTrade.id
        )
        
        if (existingChangeIndex !== -1) {
          // Update existing edit
          setStagedChanges(prev => {
            const updated = [...prev]
            updated[existingChangeIndex] = {
              ...updated[existingChangeIndex],
              newRecord: tradeData
            }
            return updated
          })
        } else {
          // Add new edit
          setStagedChanges(prev => [...prev, {
            type: 'edit',
            originalRecord: editingTrade,
            newRecord: tradeData
          }])
        }
      }
    } else {
      // Adding new trade
      const tempId = Date.now().toString()
      setStagedChanges(prev => [...prev, {
        type: 'add',
        newRecord: tradeData,
        tempId
      }])
    }
    
    setIsFormOpen(false)
    setEditingTrade(null)
  }

  const handleSaveChanges = async () => {
    if (stagedChanges.length === 0) return
    
    setSaveConfirmOpen(true)
  }

  const confirmSaveChanges = async () => {
    setSaveConfirmOpen(false)
    setSaving(true)
    setError(null)
    
    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ changes: stagedChanges })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save changes')
      }
      
      const result = await response.json()
      
      // Clear staged changes
      setStagedChanges([])
      
      // Refresh trades data
      setTrades(result.trades || [])
      
      // Invalidate portfolio cache
      await fetch('/api/cache/invalidate-portfolio', {
        method: 'POST'
      })
      
    } catch (err) {
      console.error('Error saving changes:', err)
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = stagedChanges.length > 0

  // Show access denied if not authenticated
  if (isAnonymized) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              You must be logged in as an admin to access this page.
            </p>
            <Button onClick={() => router.push('/')} variant="outline">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </div>
    )
  }

  const displayedTrades = getDisplayedTrades()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Trade Management</h1>
        <p className="text-gray-600">Manage portfolio trade records</p>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Trade Records</CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleAddTrade} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add New Trade
              </Button>
              {hasChanges && (
                <Button 
                  onClick={handleSaveChanges} 
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes ({stagedChanges.length})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {displayedTrades.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No trade records found.</p>
              <p className="mt-2">Click "Add New Trade" to create your first trade.</p>
            </div>
          ) : (
            <TradesList
              trades={displayedTrades}
              stagedChanges={stagedChanges}
              onEdit={handleEditTrade}
              onDelete={handleDeleteTrade}
            />
          )}
        </CardContent>
      </Card>

      <TradeFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        trade={editingTrade}
        onSubmit={handleFormSubmit}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Trade"
        description={`Are you sure you want to delete this trade? ${tradeToDelete ? `(${tradeToDelete.name} - ${formatDate(tradeToDelete.date)})` : ''}`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        confirmVariant="destructive"
      />

      <ConfirmationDialog
        open={saveConfirmOpen}
        onOpenChange={setSaveConfirmOpen}
        title="Save Changes"
        description={`You are about to save ${stagedChanges.length} change${stagedChanges.length !== 1 ? 's' : ''} to the database. This action cannot be undone. Are you sure you want to continue?`}
        onConfirm={confirmSaveChanges}
        confirmText="Save Changes"
        confirmVariant="default"
      />
    </div>
  )
}