import sys
import os

filepath = r'c:\Users\iraaf\Downloads\arunalu-system-main\arunalu-system-main\transactions.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Remove the if (monthsBehind > 0) block to allow advance calculation
old_block = """        if (monthsBehind > 0) {
            const totalMonthlyExpected = monthsBehind * 300;
            let monthlyPaid = 0;
            if (monthly100Acc || monthly200Acc || monthlyUnifiedAcc) {
                const mEntries = await db.entries.where('accountId').anyOf(monthlyAccIds).toArray();
                for (let e of mEntries) {
                    const tx = await db.transactions.get(e.transactionId);
                    // Rule: Only count payments made after or on the current joinDate
                    if (tx && tx.memberId === memberId && tx.status !== 'Cancelled' && tx.date >= joinDateStr) {
                        monthlyPaid += (parseFloat(e.credit) || 0);
                    }
                }
            }
            const monthlyBal = totalMonthlyExpected - monthlyPaid - (member.openingAdvMonthly || 0) - (member.openingAdvMembership || 0) - (member.openingAdvContribution || 0);
            monthlyDue = Math.max(0, monthlyBal);
            monthlyAdvance = Math.max(0, -monthlyBal);
            // Re-calculate actual months behind based on remaining balance
            monthsBehind = Math.floor(monthlyDue / 300);
        }"""

new_block = """        const totalMonthlyExpected = monthsBehind * 300;
        let monthlyPaid = 0;
        if (monthlyAccIds.length > 0) {
            const mEntries = await db.entries.where('accountId').anyOf(monthlyAccIds).toArray();
            for (let e of mEntries) {
                const tx = await db.transactions.get(e.transactionId);
                // Rule: Only count payments made after or on the current joinDate
                if (tx && tx.memberId === memberId && tx.status !== 'Cancelled' && tx.date >= joinDateStr) {
                    monthlyPaid += (parseFloat(e.credit) || 0);
                }
            }
        }
        const monthlyBal = totalMonthlyExpected - monthlyPaid - (member.openingAdvMonthly || 0) - (member.openingAdvMembership || 0) - (member.openingAdvContribution || 0);
        monthlyDue = Math.max(0, monthlyBal);
        monthlyAdvance = Math.max(0, -monthlyBal);
        // Re-calculate actual months behind based on remaining balance
        monthsBehind = Math.floor(monthlyDue / 300);"""

if old_block in content:
    content = content.replace(old_block, new_block)
    print("Fixed getMemberDues logic (removed monthsBehind > 0 guard)")
else:
    # Try with small variation in whitespace
    print("Could not find the block, checking for variation...")
    if "if (monthsBehind > 0)" in content:
        print("Found the if statement, but block match failed. Manual fix needed.")

# Also ensure return object is correct
if "monthlyAdvance," not in content:
    content = content.replace("funeralCount: validFuneralCount,", "funeralCount: validFuneralCount, monthlyAdvance,")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
