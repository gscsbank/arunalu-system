import sys
import os

filepath = r'c:\Users\iraaf\Downloads\arunalu-system-main\arunalu-system-main\transactions.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: getMemberDues accounts
old_block1 = """    const monthly100Acc = accounts.find(a => a.accountName === 'දායක අරමුදල් ලැබීම්' || a.accountName.includes('Monthly Contribution (Rs. 100)'));
    const monthly200Acc = accounts.find(a => a.accountName === 'සාමාජික අරමුදල් ලැබීම්' || a.accountName.includes('Monthly Membership (Rs. 200)'));
    const funeralAcc = accounts.find(a => a.accountName === 'සුභ සාධක අරමුදල් ලැබීම්' || a.accountName.includes('Funeral Contribution (Rs. 200)'));"""

new_block1 = """    const monthly100Acc = accounts.find(a => a.accountName === 'දායක අරමුදල් ලැබීම්' || a.accountName.includes('(Rs. 100)'));
    const monthly200Acc = accounts.find(a => a.accountName === 'සාමාජික අරමුදල් ලැබීම්' || a.accountName.includes('(Rs. 200)'));
    const monthlyUnifiedAcc = accounts.find(a => a.accountName.includes('(Rs. 300)'));
    const funeralAcc = accounts.find(a => a.accountName === 'සුභ සාධක අරමුදල් ලැබීම්' || a.accountName.includes('Funeral Contribution (Rs. 200)'));"""

if old_block1 in content:
    content = content.replace(old_block1, new_block1)
    print("Fixed block 1")
else:
    print("Could not find block 1")

# Fix 2: autoFillDues accounts
old_block2 = """    const monthly100Acc = accounts.find(a => a.accountName === 'දායක අරමුදල් ලැබීම්' || a.accountName.includes('Monthly Contribution (Rs. 100)'));
    const monthly200Acc = accounts.find(a => a.accountName === 'සාමාජික අරමුදල් ලැබීම්' || a.accountName.includes('Monthly Membership (Rs. 200)'));
    const funeralAcc = accounts.find(a => a.accountName === 'සුභ සාධක අරමුදල් ලැබීම්' || a.accountName.includes('Funeral Contribution (Rs. 200)'));"""

new_block2 = """    const monthlyUnifiedAcc = accounts.find(a => a.accountName.includes('(Rs. 300)'));
    const funeralAcc = accounts.find(a => a.accountName === 'සුභ සාධක අරමුදල් ලැබීම්' || a.accountName.includes('Funeral Contribution (Rs. 200)'));"""

# Since old_block2 is same as old_block1, and it's already replaced once, we need to find it again or just do a global replace if safe.
# Actually, the first occurrence was in getMemberDues, second in autoFillDues.
# If I use replace(..., 1), it replaces the first one.

# Let's try to find the exact line for autoFillDues
if old_block1 in content: # It's still there because it appears twice
    content = content.replace(old_block1, new_block2)
    print("Fixed block 2")
else:
    print("Could not find block 2")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
