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

interface TradeFormModalProps {
  trade: TradeRecord | null
  onSubmit: (trade: TradeRecord) => void
  onClose: () => void
}

export default function TradeFormModal({ trade, onSubmit, onClose }: TradeFormModalProps) {
  const [formData, setFormData] = useState<TradeRecord>({
    id: trade?.id,
    code: trade?.code || "",
    marketCode: trade?.marketCode || "NYSE",
    name: trade?.name || "",
    date: trade?.date || new Date().toISOString().split('T')[0],
    type: trade?.type || "Buy",
    qty: trade?.qty || 0,
    price: trade?.price || 0,
    instrumentCurrency: trade?.instrumentCurrency || "USD",
    brokerage: trade?.brokerage || 0,
    brokerageCurrency: trade?.brokerageCurrency || "USD",
    exchRate: trade?.exchRate || 1,
    value: trade?.value || 0,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof TradeRecord, string>>>({})

  // Calculate value when qty or price changes
  useEffect(() => {
    // Exchange rate is NZD to USD (e.g., 0.59 means 1 NZD = 0.59 USD)
    // To convert USD to NZD, we divide by the exchange rate
    const baseValue = formData.qty * formData.price
    const valueInNZD = formData.instrumentCurrency === 'NZD' 
      ? baseValue 
      : baseValue / formData.exchRate
    const brokerageInNZD = formData.brokerageCurrency === 'NZD'
      ? formData.brokerage
      : formData.brokerage / formData.exchRate
    const calculatedValue = valueInNZD + brokerageInNZD
    setFormData(prev => ({ ...prev, value: parseFloat(calculatedValue.toFixed(2)) }))
  }, [formData.qty, formData.price, formData.exchRate, formData.brokerage, formData.instrumentCurrency, formData.brokerageCurrency])

  const handleInputChange = (field: keyof TradeRecord, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof TradeRecord, string>> = {}

    if (!formData.code) newErrors.code = "Stock code is required"
    if (!formData.name) newErrors.name = "Company name is required"
    if (!formData.date) newErrors.date = "Date is required"
    if (formData.qty <= 0) newErrors.qty = "Quantity must be greater than 0"
    if (formData.price <= 0) newErrors.price = "Price must be greater than 0"
    if (formData.exchRate <= 0) newErrors.exchRate = "Exchange rate must be greater than 0"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{trade ? "Edit Trade" : "Add New Trade"}</DialogTitle>
          <DialogDescription>
            {trade ? "Update the trade details below" : "Enter the details for the new trade"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Stock Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
                placeholder="e.g., AAPL"
              />
              {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="marketCode">Market Code</Label>
              <Select
                value={formData.marketCode}
                onValueChange={(value) => handleInputChange("marketCode", value)}
              >
                <SelectTrigger id="marketCode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NYSE">NYSE</SelectItem>
                  <SelectItem value="NASDAQ">NASDAQ</SelectItem>
                  <SelectItem value="NZX">NZX</SelectItem>
                  <SelectItem value="ASX">ASX</SelectItem>
                  <SelectItem value="LSE">LSE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="e.g., Apple Inc."
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
              />
              {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange("type", value as "Buy" | "Sell" | "Reinvestment")}
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
            <div className="space-y-2">
              <Label htmlFor="qty">Quantity *</Label>
              <Input
                id="qty"
                type="number"
                step="0.00000001"
                value={formData.qty}
                onChange={(e) => handleInputChange("qty", parseFloat(e.target.value) || 0)}
              />
              {errors.qty && <p className="text-sm text-destructive">{errors.qty}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price per Share *</Label>
              <Input
                id="price"
                type="number"
                step="0.00000001"
                value={formData.price}
                onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
              />
              {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
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
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brokerage">Brokerage Fee</Label>
              <Input
                id="brokerage"
                type="number"
                step="0.01"
                value={formData.brokerage}
                onChange={(e) => handleInputChange("brokerage", parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
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
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exchRate">Exchange Rate (NZD to {formData.instrumentCurrency}) *</Label>
              <Input
                id="exchRate"
                type="number"
                step="0.00000001"
                value={formData.exchRate}
                onChange={(e) => handleInputChange("exchRate", parseFloat(e.target.value) || 1)}
              />
              <p className="text-sm text-muted-foreground">
                1 NZD = {formData.exchRate} {formData.instrumentCurrency}
              </p>
              {errors.exchRate && <p className="text-sm text-destructive">{errors.exchRate}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Total Value (NZD)</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                readOnly
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground">Automatically calculated</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {trade ? "Update Trade" : "Add Trade"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}