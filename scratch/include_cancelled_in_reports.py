import sys
import os

filepath = r'c:\Users\iraaf\Downloads\arunalu-system-main\arunalu-system-main\reports.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Step 1: Include cancelled transactions in the base filtered list for reports
old_filter = """    const validTxsEnd = allTxsEnd.filter(t => {
        if (t.status === 'Cancelled') return false;
        const txUnit = t.unit || 'Main';"""

new_filter = """    const validTxsEnd = allTxsEnd.filter(t => {
        const txUnit = t.unit || 'Main';"""

if old_filter in content:
    content = content.replace(old_filter, new_filter)
    print("Updated base transaction filtering to include cancelled transactions")
else:
    print("Could not find base transaction filtering")

# Step 2: Update Receipt Book report to show cancelled status and reason
old_rb_row = """            rowsHtml += `
                <tr class="border-b border-gray-200 align-top">
                    <td class="py-3 px-2 text-[10px] font-bold">${tx.date}</td>
                    <td class="py-3 px-2 text-[11px] font-black text-brand-700">${tx.reference || '-'}</td>
                    <td class="py-3 px-2 text-[10px] font-bold">${memberName}</td>
                    <td class="py-3 px-2">${breakdown}</td>
                    <td class="py-3 px-2 text-right font-black text-[11px]">${formatCurrency(totalAmount)}</td>
                </tr>
            `;"""

new_rb_row = """            const isCan = tx.status === 'Cancelled';
            const canBadge = isCan ? `<br><span class="text-[9px] text-red-600 font-bold italic">CANCELLED: ${tx.cancelReason || '-'}</span>` : '';
            
            rowsHtml += `
                <tr class="border-b border-gray-200 align-top ${isCan ? 'bg-red-50/30' : ''}">
                    <td class="py-3 px-2 text-[10px] font-bold">${tx.date}</td>
                    <td class="py-3 px-2 text-[11px] font-black ${isCan ? 'text-red-600' : 'text-brand-700'}">${tx.reference || '-'}${canBadge}</td>
                    <td class="py-3 px-2 text-[10px] font-bold">${memberName}</td>
                    <td class="py-3 px-2">${breakdown}</td>
                    <td class="py-3 px-2 text-right font-black text-[11px] ${isCan ? 'text-red-400' : ''}">${formatCurrency(totalAmount)}</td>
                </tr>
            `;"""

if old_rb_row in content:
    content = content.replace(old_rb_row, new_rb_row)
    print("Updated Receipt Book report rows")
else:
    print("Could not find Receipt Book report rows")

# Step 3: Ensure GL report also uses the red badge for cancelled entries (it already has it, but checking)
# Already checked line 599, it looks fine.

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
