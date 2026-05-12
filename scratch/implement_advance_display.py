import sys
import os

filepath = r'c:\Users\iraaf\Downloads\arunalu-system-main\arunalu-system-main\transactions.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Update getMemberDues to calculate advance
old_calc = """            monthlyDue = Math.max(0, totalMonthlyExpected - monthlyPaid - (member.openingAdvMonthly || 0) - (member.openingAdvMembership || 0) - (member.openingAdvContribution || 0));
            // Re-calculate actual months behind based on remaining balance
            monthsBehind = Math.floor(monthlyDue / 300);"""

new_calc = """            const monthlyBal = totalMonthlyExpected - monthlyPaid - (member.openingAdvMonthly || 0) - (member.openingAdvMembership || 0) - (member.openingAdvContribution || 0);
            monthlyDue = Math.max(0, monthlyBal);
            monthlyAdvance = Math.max(0, -monthlyBal);
            // Re-calculate actual months behind based on remaining balance
            monthsBehind = Math.floor(monthlyDue / 300);"""

if old_calc in content:
    content = content.replace(old_calc, new_calc)
    print("Updated monthly due calculation logic")
else:
    print("Could not find monthly due calculation logic")

# Update return object of getMemberDues
content = content.replace("funeralCount: validFuneralCount,", "funeralCount: validFuneralCount, monthlyAdvance,")

# Initialize monthlyAdvance variable at start of getMemberDues
content = content.replace("let monthsBehind = 0;", "let monthsBehind = 0; let monthlyAdvance = 0;")

# Update handleTxMemberSelection UI
old_ui = '<span>මාසික ගාස්තු ලැබීම්:</span><span class="text-right font-semibold">Rs. ${dues.monthlyDue.toFixed(2)}</span>'
new_ui = '<span>මාසික ගාස්තු ලැබීම්:</span><span class="text-right font-semibold">${dues.monthlyAdvance > 0 ? `<span class="text-green-600">Advance: Rs. ${dues.monthlyAdvance.toFixed(2)}</span>` : `Rs. ${dues.monthlyDue.toFixed(2)}`}</span>'

if old_ui in content:
    content = content.replace(old_ui, new_ui)
    print("Updated transaction modal UI")
else:
    print("Could not find transaction modal UI")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
