'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Trash2, Edit, RotateCcw, Plus, Save, X } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface Trade {
  id?: number
  tempId?: string
  code: string
  marketCode: string
  name: string
  date: string
  type: 'Buy' | 'Sell' | 'Reinvestment'
  qty: number
  price: number
  instrumentCurrency: string
  brokerage: number
  brokerageCurrency: string
  exchRate: number
  value: number
  deletedFlag?: boolean
  deletedAt?: string | null
  createdAt?: string
  updatedAt?: string
  // Local state for staging
  isNew?: boolean
  isModified?: boolean
  isDeleted?: boolean
  isRestored?: boolean
  originalData?: Trade
}

export default function TradesPage() {
  const { isAuthenticated, isAdmin, password } = useAuth()
  const router = useRouter()
  
  const [trades, setTrades] = useState<Trade[]>([])
  const [stagedChanges, setStagedChanges] = useState<Map<string, Trade>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Check authentication and redirect if not admin
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      router.push('/')
    }
  }, [isAuthenticated, isAdmin, router])

  // Fetch trades on mount
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchTrades()
    }
  }, [isAuthenticated, isAdmin])

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(stagedChanges.size > 0)
  }, [stagedChanges])

  const fetchTrades = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/trades', {
        headers: {
          'Authorization': `Bearer ${password}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch trades')
      }

      const data = await response.json()
      setTrades(data.trades)
    } catch (error) {
      console.error('Error fetching trades:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTradeKey = (trade: Trade): string => {
    return trade.id ? `id-${trade.id}` : `temp-${trade.tempId}`
  }

  const handleAddTrade = () => {
    const newTrade: Trade = {
      tempId: `new-${Date.now()}`,
      code: '',
      marketCode: '',
      name: '',
      date: new Date().toISOString().split('T')[0],
      type: 'Buy',
      qty: 0,
      price: 0,
      instrumentCurrency: 'USD',
      brokerage: 0,
      brokerageCurrency: 'USD',
      exchRate: 1,
      value: 0,
      isNew: true,
    }
    setEditingTrade(newTrade)
    setIsAddDialogOpen(true)
  }

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade({ ...trade, originalData: trade })
    setIsEditDialogOpen(true)
  }

  const handleSaveTrade = (trade: Trade) => {
    const key = getTradeKey(trade)
    
    if (trade.isNew) {
      // Add new trade to list and staged changes
      const updatedTrades = [...trades, trade]
      setTrades(updatedTrades)
      stagedChanges.set(key, trade)
    } else {
      // Update existing trade
      const updatedTrades = trades.map(t => 
        getTradeKey(t) === key ? { ...trade, isModified: true } : t
      )
      setTrades(updatedTrades)
      stagedChanges.set(key, { ...trade, isModified: true })
    }
    
    setStagedChanges(new Map(stagedChanges))
    setIsAddDialogOpen(false)
    setIsEditDialogOpen(false)
    setEditingTrade(null)
  }

  const handleDeleteTrade = (trade: Trade) => {
    const key = getTradeKey(trade)
    
    if (trade.isNew) {
      // Remove new trade that hasn't been saved
      const updatedTrades = trades.filter(t => getTradeKey(t) !== key)
      setTrades(updatedTrades)
      stagedChanges.delete(key)
    } else {
      // Mark existing trade for deletion
      const updatedTrades = trades.map(t => 
        getTradeKey(t) === key ? { ...t, isDeleted: true, deletedFlag: true } : t
      )
      setTrades(updatedTrades)
      stagedChanges.set(key, { ...trade, isDeleted: true })
    }
    
    setStagedChanges(new Map(stagedChanges))
  }

  const handleRestoreTrade = (trade: Trade) => {
    const key = getTradeKey(trade)
    
    const updatedTrades = trades.map(t => 
      getTradeKey(t) === key ? { ...t, isDeleted: false, isRestored: true, deletedFlag: false } : t
    )
    setTrades(updatedTrades)
    
    if (trade.deletedFlag && !trade.isNew) {
      // If it was already soft-deleted in DB, mark for restoration
      stagedChanges.set(key, { ...trade, isRestored: true })
    } else {
      // If it was only locally deleted, remove from staged changes
      stagedChanges.delete(key)
    }
    
    setStagedChanges(new Map(stagedChanges))
  }

  const handleSaveAll = async () => {
    if (stagedChanges.size === 0) return

    setSaving(true)
    try {
      const operations = Array.from(stagedChanges.values()).map(trade => {
        if (trade.isNew) {
          return { operation: 'create' as const, trade }
        } else if (trade.isDeleted) {
          return { operation: 'delete' as const, trade }
        } else if (trade.isRestored) {
          return { operation: 'restore' as const, trade }
        } else if (trade.isModified) {
          return { operation: 'update' as const, trade }
        }
        return null
      }).filter(Boolean)

      const response = await fetch('/api/trades/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`,
        },
        body: JSON.stringify({ operations }),
      })

      if (!response.ok) {
        throw new Error('Failed to save changes')
      }

      const result = await response.json()
      
      // Clear staged changes and refresh trades
      setStagedChanges(new Map())
      await fetchTrades()
      
    } catch (error) {
      console.error('Error saving changes:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelChanges = () => {
    setStagedChanges(new Map())
    fetchTrades()
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p>You must be logged in as an administrator to access this page.</p>
            <Button onClick={() => router.push('/')} className="mt-4">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p>Loading trades...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">Trade Management</CardTitle>
          <div className="flex gap-2">
            {hasUnsavedChanges && (
              <>
                <Badge variant="outline" className="bg-yellow-50">
                  {stagedChanges.size} unsaved {stagedChanges.size === 1 ? 'change' : 'changes'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelChanges}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel Changes
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="default" size="sm" disabled={saving}>
                      <Save className="h-4 w-4 mr-1" />
                      Save All Changes
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Save</AlertDialogTitle>
                      <AlertDialogDescription>
                        You have {stagedChanges.size} unsaved {stagedChanges.size === 1 ? 'change' : 'changes'}. 
                        Are you sure you want to save all changes to the database?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSaveAll}>
                        Save Changes
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            <Button onClick={handleAddTrade}>
              <Plus className="h-4 w-4 mr-1" />
              Add New Trade
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {trades.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No trades found. Click "Add New Trade" to create your first trade.
              </div>
            ) : (
              trades.map((trade) => {
                const key = getTradeKey(trade)
                const isStaged = stagedChanges.has(key)
                const isDeleted = trade.isDeleted || trade.deletedFlag
                
                return (
                  <div
                    key={key}
                    className={cn(
                      "p-4 border rounded-lg transition-all",
                      isDeleted && "opacity-50 bg-gray-50",
                      isStaged && !isDeleted && "border-yellow-400 bg-yellow-50/50",
                      trade.isNew && "border-green-400 bg-green-50/50"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">{trade.code}</span>
                          <Badge variant={trade.type === 'Buy' ? 'default' : trade.type === 'Sell' ? 'destructive' : 'secondary'}>
                            {trade.type}
                          </Badge>
                          {trade.isNew && <Badge variant="outline" className="bg-green-50">New</Badge>}
                          {trade.isModified && <Badge variant="outline" className="bg-yellow-50">Modified</Badge>}
                          {isDeleted && <Badge variant="outline" className="bg-red-50">Deleted</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div>Date: {format(new Date(trade.date), 'MMM dd, yyyy')}</div>
                          <div>Qty: {trade.qty}</div>
                          <div>Price: {trade.instrumentCurrency} {trade.price.toFixed(2)}</div>
                          <div>Value: {trade.value.toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!isDeleted ? (
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
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreTrade(trade)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Trade Dialog */}
      <TradeFormDialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false)
            setIsEditDialogOpen(false)
            setEditingTrade(null)
          }
        }}
        trade={editingTrade}
        onSave={handleSaveTrade}
        title={isAddDialogOpen ? 'Add New Trade' : 'Edit Trade'}
      />
    </div>
  )
}

// Trade Form Dialog Component
function TradeFormDialog({
  open,
  onOpenChange,
  trade,
  onSave,
  title,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  trade: Trade | null
  onSave: (trade: Trade) => void
  title: string
}) {
  const [formData, setFormData] = useState<Trade>(
    trade || {
      code: '',
      marketCode: '',
      name: '',
      date: new Date().toISOString().split('T')[0],
      type: 'Buy',
      qty: 0,
      price: 0,
      instrumentCurrency: 'USD',
      brokerage: 0,
      brokerageCurrency: 'USD',
      exchRate: 1,
      value: 0,
    }
  )

  useEffect(() => {
    if (trade) {
      setFormData(trade)
    }
  }, [trade])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Calculate value if not set
    const calculatedValue = formData.qty * formData.price + formData.brokerage
    onSave({
      ...formData,
      value: formData.value || calculatedValue,
    })
  }

  const updateField = (field: keyof Trade, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Fill in the trade details below. All fields are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Stock Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => updateField('code', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="marketCode">Market Code</Label>
                <Input
                  id="marketCode"
                  value={formData.marketCode}
                  onChange={(e) => updateField('marketCode', e.target.value)}
                  placeholder="e.g., NYSE, NASDAQ"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Trade Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Trade Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => updateField('type', value as 'Buy' | 'Sell' | 'Reinvestment')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Buy">Buy</SelectItem>
                    <SelectItem value="Sell">Sell</SelectItem>
                    <SelectItem value="Reinvestment">Reinvestment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="qty">Quantity</Label>
                <Input
                  id="qty"
                  type="number"
                  step="0.00000001"
                  value={formData.qty}
                  onChange={(e) => updateField('qty', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Price per Share</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.00000001"
                  value={formData.price}
                  onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="instrumentCurrency">Instrument Currency</Label>
                <Select
                  value={formData.instrumentCurrency}
                  onValueChange={(value) => updateField('instrumentCurrency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="NZD">NZD</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="exchRate">Exchange Rate</Label>
                <Input
                  id="exchRate"
                  type="number"
                  step="0.00000001"
                  value={formData.exchRate}
                  onChange={(e) => updateField('exchRate', parseFloat(e.target.value) || 1)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brokerage">Brokerage Fee</Label>
                <Input
                  id="brokerage"
                  type="number"
                  step="0.00000001"
                  value={formData.brokerage}
                  onChange={(e) => updateField('brokerage', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="brokerageCurrency">Brokerage Currency</Label>
                <Select
                  value={formData.brokerageCurrency}
                  onValueChange={(value) => updateField('brokerageCurrency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="NZD">NZD</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="value">Total Value</Label>
              <Input
                id="value"
                type="number"
                step="0.00000001"
                value={formData.value}
                onChange={(e) => updateField('value', parseFloat(e.target.value) || 0)}
                placeholder="Auto-calculated if left empty"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Trade</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}