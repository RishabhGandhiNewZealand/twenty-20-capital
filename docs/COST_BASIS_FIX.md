# Cost Basis Calculation Fix

## Issue Summary

When adding new capital ($500) to the portfolio that coincided with a sell and reinvestment, the cost basis did not increase by $500 as expected.

## Root Cause

The previous logic in the portfolio calculations made an incorrect assumption:
- When a **Sell** occurred, the proceeds were tracked in a `soldCapitalAvailable` variable
- When a subsequent **Buy** occurred, the code checked if `soldCapitalAvailable >= buyAmount`
- If true, it assumed the entire buy was a reinvestment of sold capital (not new capital)
- This caused the cost basis to NOT increase, even when new capital was actually added

### The Problem Scenario

1. User sells Position A for $1,000
2. User adds $500 new capital and buys Position B for $1,500 total
3. Old logic saw: "We have $1,000 sold capital, and buying $1,500, so $1,000 is reinvestment and only $500 is new"
4. But actually: The entire $1,500 should increase cost basis because it's marked as a "Buy" transaction

## The Fix

The system already has three transaction types to handle this:
- **"Buy"** = New capital addition (should ALWAYS increase cost basis)
- **"Sell"** = Selling shares (reduces holdings, doesn't affect future cost basis)
- **"Reinvestment"** = Dividend/distribution reinvestment (increases shares but NOT cost basis)

### Changes Made

#### 1. `/workspace/lib/portfolioCalculations.ts`
- **Lines 111-114**: Removed `runningSoldCapital` variable (no longer needed)
- **Lines 129-147**: Simplified the logic to trust the transaction type:
  - **Buy transactions**: Always increase cost basis by the full amount
  - Buy equivalent S&P 500 shares with the full buy amount
- **Lines 148-152**: Simplified sell logic - no longer tracks "available capital" for future buys
- **Lines 153-155**: Reinvestment logic unchanged (doesn't affect cost basis)

#### 2. `/workspace/app/api/portfolio-current/route.ts`
- **Lines 107-109**: Removed `soldCapitalAvailable` variable (no longer needed)
- **Lines 139-153**: Applied the same fix:
  - **Buy transactions**: Always add full amount to cost basis and buy equivalent S&P 500 shares
  - Removed the complex logic that tried to determine if a buy was using "sold capital"
- **Lines 154-167**: Simplified sell logic - no longer modifies the `soldCapitalAvailable` variable

## How to Use Going Forward

When entering trades:
1. **Use "Buy"** when adding NEW capital to your portfolio (including when you're also reinvesting sold proceeds - just add the new capital amount as the buy amount)
2. **Use "Reinvestment"** for dividend/distribution reinvestments that don't involve new capital
3. **Use "Sell"** when selling positions

If you previously entered a transaction as "Buy" that should have been split between new capital and reinvested proceeds, you have two options:
1. **Recommended**: Keep it as one "Buy" transaction representing the total new capital added
2. **Alternative**: Split it into two transactions:
   - One "Reinvestment" for the amount that came from sold proceeds (doesn't affect cost basis)
   - One "Buy" for the actual new capital ($500 in your case)

## Testing the Fix

After this fix, your portfolio performance graph should correctly show:
1. Cost basis increases by the full amount when you add a "Buy" transaction
2. The $500 new capital you added will now be reflected in the cost basis line
3. S&P 500 comparison will also correctly reflect equivalent new capital investment

To see the updated calculations, the cache needs to be cleared or will automatically refresh after 20 minutes.