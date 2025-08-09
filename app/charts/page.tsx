"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Sample company data - to be replaced with actual data later
const sampleCompanies = [
  { value: "apple", label: "Apple Inc. (AAPL)", symbol: "AAPL" },
  { value: "microsoft", label: "Microsoft Corporation (MSFT)", symbol: "MSFT" },
  { value: "google", label: "Alphabet Inc. (GOOGL)", symbol: "GOOGL" },
  { value: "amazon", label: "Amazon.com Inc. (AMZN)", symbol: "AMZN" },
  { value: "tesla", label: "Tesla Inc. (TSLA)", symbol: "TSLA" },
  { value: "meta", label: "Meta Platforms Inc. (META)", symbol: "META" },
  { value: "nvidia", label: "NVIDIA Corporation (NVDA)", symbol: "NVDA" },
  { value: "berkshire", label: "Berkshire Hathaway Inc. (BRK.B)", symbol: "BRK.B" },
]

export default function ChartsPage() {
  const [open, setOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState("")

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Charts</h1>
        <p className="text-muted-foreground">
          Analyze portfolio statistics and research individual companies
        </p>
      </div>

      <Tabs defaultValue="portfolio" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="portfolio" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Portfolio Stats
          </TabsTrigger>
          <TabsTrigger value="research" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Company Research
          </TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-4">
          {/* Portfolio Stats view - kept blank as requested */}
          <Card>
            <CardContent className="pt-6">
              <div className="h-96 flex items-center justify-center text-muted-foreground">
                {/* This section is intentionally left blank for future portfolio stats */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="research" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Research</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="max-w-md">
                  <label className="text-sm font-medium mb-2 block">
                    Select a company to research
                  </label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                      >
                        {selectedCompany
                          ? sampleCompanies.find((company) => company.value === selectedCompany)?.label
                          : "Search companies..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search companies..." />
                        <CommandList>
                          <CommandEmpty>No company found.</CommandEmpty>
                          <CommandGroup>
                            {sampleCompanies.map((company) => (
                              <CommandItem
                                key={company.value}
                                value={company.value}
                                onSelect={(currentValue) => {
                                  setSelectedCompany(currentValue === selectedCompany ? "" : currentValue)
                                  setOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedCompany === company.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {company.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {selectedCompany && (
                  <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Selected: {sampleCompanies.find((c) => c.value === selectedCompany)?.label}
                    </p>
                    {/* Future company research content will go here */}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}