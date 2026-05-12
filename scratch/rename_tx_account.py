import sys
import os

filepath = r'c:\Users\iraaf\Downloads\arunalu-system-main\arunalu-system-main\transactions.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the search logic for the unified account
# Old: includes('(Rs. 300)')
# New: equals('මාසික සාමාජික මුදල් ලැබීම්') or includes('මාසික සාමාජික')

content = content.replace("a.accountName.includes('(Rs. 300)')", "a.accountName === 'මාසික සාමාජික මුදල් ලැබීම්'")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
