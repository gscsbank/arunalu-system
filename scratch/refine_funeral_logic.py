import sys
import os
import re

filepath = r'c:\Users\iraaf\Downloads\arunalu-system-main\arunalu-system-main\transactions.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update getMemberDues signature
content = content.replace("window.getMemberDues = async (memberId) => {", "window.getMemberDues = async (memberId, asOfDate = null) => {")

# 2. Update monthly dues 'now' calculation
content = content.replace("const now = new Date();", "const now = asOfDate ? new Date(asOfDate) : new Date();")

# 3. Update funeral dues calculation
funeral_old = """        const allFunerals = await db.funerals.toArray();
        const eligibleFunerals = allFunerals.filter(f => {
            const fDate = new Date(f.date);
            // Rule: Not for own home, and only funerals after 6 months of joining
            return f.memberId !== memberId && fDate > gracePeriodEnd;
        });"""

funeral_new = """        const allFunerals = await db.funerals.toArray();
        const calculationDate = asOfDate ? new Date(asOfDate) : new Date();
        
        // Paid Until filtering: If paid until YYYY-MM, funerals in that month and before are paid
        let paidUntilDate = null;
        if (member.openingPaidUntil) {
            // End of month for openingPaidUntil
            const [py, pm] = member.openingPaidUntil.split('-').map(Number);
            paidUntilDate = new Date(py, pm, 0, 23, 59, 59); // Last day of month
        }

        const eligibleFunerals = allFunerals.filter(f => {
            const fDate = new Date(f.date);
            // Rule 1: Date must be on or before the receipt date (calculation date)
            if (fDate > calculationDate) return false;
            
            // Rule 2: Date must be after the member's "Paid Until" date
            if (paidUntilDate && fDate <= paidUntilDate) return false;

            // Existing Rule: Not for own home, and only funerals after 6 months of joining
            return f.memberId !== memberId && fDate > gracePeriodEnd;
        });"""

if funeral_old in content:
    content = content.replace(funeral_old, funeral_new)
    print("Updated funeral logic")
else:
    print("Could not find funeral logic")

# 4. Update handleTxMemberSelection to pass txDate
# We need to find where it calls getMemberDues(matched.id)
content = content.replace("const dues = await window.getMemberDues(matched.id);", "const txDate = document.getElementById('txDate')?.value; const dues = await window.getMemberDues(matched.id, txDate);")

# 5. Update autoFillDues to pass txDate
content = content.replace("const dues = await window.getMemberDues(memberId);", "const txDate = document.getElementById('txDate')?.value; const dues = await window.getMemberDues(memberId, txDate);")

# 6. Update Modal HTML to add onchange to txDate
content = content.replace('id="txDate" required', 'id="txDate" required onchange="const input = document.getElementById(\'txPayerInput\'); if(input && input.value) window.handleTxMemberSelection(input.value)"')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
