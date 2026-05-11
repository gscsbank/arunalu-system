# System Requirements & Technical Specifications: Arunalu Accounting System

මෙම පද්ධතිය "අරුණලු සුභසාධක සමිතිය" සඳහා විශේෂයෙන් නිර්මාණය කර ඇති අතර, වඩාත් ආකර්ෂණීය සහ පහසු UI එකකින් යුක්තව නිපදවිය යුතුය.

## 1. තාක්ෂණික ස්ථරය (Technical Stack)
- **Frontend:** HTML5, Tailwind CSS (UI Styling සඳහා).
- **Interactions:** Vanilla JavaScript (ES6+).
- **Database:** Dexie.js (Browser-based IndexedDB wrapper - Offline දත්ත ගබඩා කිරීම සඳහා).
- **Reporting:** Print-friendly CSS (@media print) A4 ප්‍රමාණයට ගැලපෙන ලෙස.
- **Branding:** "Developed by Iraasoft Solution".

---

## 2. දත්ත සමුදාය සැලසුම (Database Schema - Dexie.js)

```javascript
const db = new Dexie("ArunaluWelfareDB");
db.version(1).stores({
    members: '++id, memberNo, nic, name, phone, joinedDate',
    accounts: '++id, accountName, accountType, category', // Income, Expense, Asset, Liability
    transactions: '++id, date, type, reference, description', // Receipts, Payments, Journals
    entries: '++id, transactionId, accountId, debit, credit', // Double entry details
    fixedAssets: '++id, assetName, purchaseDate, cost',
    budget: '++id, accountId, period, amount'
});