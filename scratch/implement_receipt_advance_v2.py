import sys
import os

filepath = r'c:\Users\iraaf\Downloads\arunalu-system-main\arunalu-system-main\transactions.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Update viewTransaction arrearsSummary to include advance
old_view_summary = """    let arrearsSummary = '';
    if (tx.memberId) {
        const dues = await window.getMemberDues(tx.memberId);
        const totalArrears = dues.entranceDue + dues.monthlyDue + dues.funeralDue;
        if (totalArrears > 0) {
            arrearsSummary = `
                <div class="col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-4 flex justify-between items-center mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-lg">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                        </div>
                        <div>
                            <span class="block text-amber-800 font-bold text-sm">Current Outstanding Arrears</span>
                            <span class="text-amber-600 text-xs">Remaining balance as of today.</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="text-xl font-black text-amber-900">Rs. ${totalArrears.toFixed(2)}</span>
                    </div>
                </div>
            `;
        }
    }"""

new_view_summary = """    let arrearsSummary = '';
    if (tx.memberId) {
        const dues = await window.getMemberDues(tx.memberId);
        const totalArrears = dues.entranceDue + dues.monthlyDue + dues.funeralDue;
        if (totalArrears > 0) {
            arrearsSummary = `
                <div class="col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-4 flex justify-between items-center mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-lg">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                        </div>
                        <div>
                            <span class="block text-amber-800 font-bold text-sm">Current Outstanding Arrears</span>
                            <span class="text-amber-600 text-xs">Remaining balance as of today.</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="text-xl font-black text-amber-900">Rs. ${totalArrears.toFixed(2)}</span>
                    </div>
                </div>
            `;
        } else if (dues.monthlyAdvance > 0) {
            arrearsSummary = `
                <div class="col-span-2 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex justify-between items-center mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg">
                            <i class="fa-solid fa-circle-check"></i>
                        </div>
                        <div>
                            <span class="block text-emerald-800 font-bold text-sm">Advance Balance (ඉදිරි ගෙවීම්)</span>
                            <span class="text-emerald-600 text-xs">This member has credit in their account.</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="text-xl font-black text-emerald-900">Rs. ${dues.monthlyAdvance.toFixed(2)}</span>
                    </div>
                </div>
            `;
        }
    }"""

if old_view_summary in content:
    content = content.replace(old_view_summary, new_view_summary)
    print("Updated viewTransaction logic")
else:
    print("Could not find viewTransaction arrears logic")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
