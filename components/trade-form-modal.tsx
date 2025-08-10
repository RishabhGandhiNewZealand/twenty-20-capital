"use client"

import { useState, useEffect } from "react"
import { TradeRecord } from "@/types/portfolio"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface TradeFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trade: (TradeRecord & { id?: number }) | null
  onSubmit: (trade: TradeRecord) => void
}

export function TradeFormModal({ open, onOpenChange, trade, onSubmit }: TradeFormModalProps) {
  const [formData, setFormData] = useState<TradeRecord>({
    code: "",
    marketCode: "",
    name: "",
    date: "",
    type: "Buy",
    qty: 0,
    price: 0,
    instrumentCurrency: "USD",
    brokerage: 0,
    brokerageCurrency: "USD",
    exchRate: 1,
    value: 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof TradeRecord, string>>>({})

  useEffect(() => {
    if (trade) {
      setFormData(trade)
    } else {
      // Reset form for new trade
      setFormData({
        code: "",
        marketCode: "NASDAQ",
        name: "",
        date: new Date().toISOString().split('T')[0],
        type: "Buy",
        qty: 0,
        price: 0,
        instrumentCurrency: "USD",
        brokerage: 0,
        brokerageCurrency: "USD",
        exchRate: 1,
        value: 0,
      })
    }
    setErrors({})
  }, [trade, open])

  // Calculate value when qty, price, brokerage, or exchRate changes
  useEffect(() => {
    const qty = parseFloat(formData.qty.toString()) || 0
    const price = parseFloat(formData.price.toString()) || 0
    const brokerage = parseFloat(formData.brokerage.toString()) || 0
    const exchRate = parseFloat(formData.exchRate.toString()) || 1
    
    let value = 0
    if (formData.type === 'Buy' || formData.type === 'Reinvestment') {
      // For buys, value = (qty * price + brokerage) * exchRate
      value = (qty * price + brokerage) * exchRate
    } else {
      // For sells, value = (qty * price - brokerage) * exchRate
      value = (qty * price - brokerage) * exchRate
    }
    
    setFormData(prev => ({ ...prev, value: parseFloat(value.toFixed(8)) }))
  }, [formData.qty, formData.price, formData.brokerage, formData.exchRate, formData.type])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TradeRecord, string>> = {}
    
    if (!formData.code.trim()) {
      newErrors.code = "Symbol is required"
    }
    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }
    if (!formData.date) {
      newErrors.date = "Date is required"
    }
    if (formData.qty <= 0) {
      newErrors.qty = "Quantity must be greater than 0"
    }
    if (formData.price <= 0) {
      newErrors.price = "Price must be greater than 0"
    }
    if (formData.exchRate <= 0) {
      newErrors.exchRate = "Exchange rate must be greater than 0"
    }
    if (formData.brokerage < 0) {
      newErrors.brokerage = "Brokerage cannot be negative"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      onSubmit(formData)
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting trade:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof TradeRecord, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{trade ? "Edit Trade" : "Add New Trade"}</DialogTitle>
            <DialogDescription>
              {trade ? "Update the trade details below." : "Enter the details for the new trade."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Symbol *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
                  placeholder="e.g., AAPL"
                  className={errors.code ? "border-red-500" : ""}
                />
                {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="marketCode">Market</Label>
                <Select
                  value={formData.marketCode}
                  onValueChange={(value) => handleInputChange("marketCode", value)}
                >
                  <SelectTrigger id="marketCode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NASDAQ">NASDAQ</SelectItem>
                    <SelectItem value="NYSE">NYSE</SelectItem>
                    <SelectItem value="ASX">ASX</SelectItem>
                    <SelectItem value="NZX">NZX</SelectItem>
                    <SelectItem value="LSE">LSE</SelectItem>
                    <SelectItem value="TSX">TSX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Apple Inc."
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className={errors.date ? "border-red-500" : ""}
                />
                {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'Buy' | 'Sell' | 'Reinvestment') => handleInputChange("type", value)}
                >
                  <SelectTrigger id="type">
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
              <div className="grid gap-2">
                <Label htmlFor="qty">Quantity *</Label>
                <Input
                  id="qty"
                  type="number"
                  step="0.00000001"
                  value={formData.qty}
                  onChange={(e) => handleInputChange("qty", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={errors.qty ? "border-red-500" : ""}
                />
                {errors.qty && <p className="text-sm text-red-500">{errors.qty}</p>}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="price">Price per Share *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.00000001"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={errors.price ? "border-red-500" : ""}
                />
                {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="instrumentCurrency">Instrument Currency</Label>
                <Select
                  value={formData.instrumentCurrency}
                  onValueChange={(value) => handleInputChange("instrumentCurrency", value)}
                >
                  <SelectTrigger id="instrumentCurrency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="NZD">NZD</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="exchRate">Exchange Rate to NZD *</Label>
                <Input
                  id="exchRate"
                  type="number"
                  step="0.00000001"
                  value={formData.exchRate}
                  onChange={(e) => handleInputChange("exchRate", parseFloat(e.target.value) || 1)}
                  placeholder="1.00"
                  className={errors.exchRate ? "border-red-500" : ""}
                />
                {errors.exchRate && <p className="text-sm text-red-500">{errors.exchRate}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="brokerage">Brokerage Fee</Label>
                <Input
                  id="brokerage"
                  type="number"
                  step="0.00000001"
                  value={formData.brokerage}
                  onChange={(e) => handleInputChange("brokerage", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={errors.brokerage ? "border-red-500" : ""}
                />
                {errors.brokerage && <p className="text-sm text-red-500">{errors.brokerage}</p>}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="brokerageCurrency">Brokerage Currency</Label>
                <Select
                  value={formData.brokerageCurrency}
                  onValueChange={(value) => handleInputChange("brokerageCurrency", value)}
                >
                  <SelectTrigger id="brokerageCurrency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="NZD">NZD</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="value">Total Value (NZD)</Label>
              <Input
                id="value"
                type="number"
                step="0.00000001"
                value={formData.value}
                disabled
                className="bg-gray-50"
              />
              <p className="text-sm text-gray-500">Automatically calculated based on quantity, price, brokerage, and exchange rate</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                trade ? "Update Trade" : "Add Trade"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}