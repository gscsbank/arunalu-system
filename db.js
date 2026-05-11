// Database Schema - Dexie.js Initialization
const db = new Dexie("ArunaluWelfareDB");

db.version(1).stores({
    members: '++id, memberNo, nic, name, phone, joinedDate',
    accounts: '++id, accountName, accountType, category', // Income, Expense, Asset, Liability
    transactions: '++id, date, type, reference, description', // Receipts, Payments, Journals
    entries: '++id, transactionId, accountId, debit, credit', // Double entry details
    fixedAssets: '++id, assetName, purchaseDate, cost',
    budget: '++id, accountId, period, amount'
});

db.version(2).stores({
    transactions: '++id, date, type, reference, memberId, description'
});

db.version(8).stores({
    members: '++id, memberNo, nic, name, shopName, phone, joinedDate, unit',
    accounts: '++id, accountName, accountType, category, unit',
    transactions: '++id, date, type, reference, memberId, userId, unit, description',
    entries: '++id, transactionId, accountId, debit, credit',
    fixedAssets: '++id, assetName, purchaseDate, cost',
    budget: '++id, accountId, period, amount',
    funerals: '++id, memberId, date, description',
    settings: '++id, type, amount, effectiveDate',
    users: '++id, username, password, role, name'
});

// Utility to initialize default accounts if they don't exist
async function initDefaultAccounts() {
    const requiredAccounts = [
        { accountName: 'අරුණළු මුදල් පොත', accountType: 'Asset', category: 'Current Asset', unit: 'Main' },
        { accountName: 'සණස බාහිර තැන්පතු ගිණුම', accountType: 'Asset', category: 'Current Asset', unit: 'Main' },
        { accountName: 'SAP මුදල් පොත', accountType: 'Asset', category: 'Current Asset', unit: 'SAP' },
        { accountName: 'සිතුමිණ තැන්පත් ගිණුම', accountType: 'Asset', category: 'Current Asset', unit: 'SAP' },
        { accountName: 'ඇතුලත්වීමේ ගාස්තු ලැබීම්', accountType: 'Income', category: 'Revenue', unit: 'Main' },
        { accountName: 'දායක අරමුදල් ලැබීම්', accountType: 'Income', category: 'Revenue', oldName: 'Monthly Contribution (Rs. 100)' },
        { accountName: 'සාමාජික අරමුදල් ලැබීම්', accountType: 'Income', category: 'Revenue', oldName: 'Monthly Membership (Rs. 200)' },
        { accountName: 'සුභ සාධක අරමුදල් ලැබීම්', accountType: 'Income', category: 'Revenue', oldName: 'Funeral Contribution (Rs. 200)' },
        { accountName: 'හිඟ මුදල් ලැබීම්', accountType: 'Income', category: 'Revenue', unit: 'Main' }
    ];

    for (let acc of requiredAccounts) {
        // Migration: Check if old name exists and rename it
        if (acc.oldName) {
            const oldAcc = await db.accounts.where('accountName').equalsIgnoreCase(acc.oldName).first();
            if (oldAcc) {
                await db.accounts.update(oldAcc.id, { accountName: acc.accountName });
                console.log(`Renamed account: ${acc.oldName} -> ${acc.accountName}`);
                continue;
            }
        }

        const existing = await db.accounts.where('accountName').equalsIgnoreCase(acc.accountName).first();
        if (!existing) {
            await db.accounts.add({ accountName: acc.accountName, accountType: acc.accountType, category: acc.category, unit: acc.unit || 'Main' });
        } else if (!existing.unit) {
            await db.accounts.update(existing.id, { unit: acc.unit || 'Main' });
        }
    }
    
    // Cleanup: Remove unwanted accounts if they exist and have no transactions
    const unwanted = ['හිඟ මුදල් පියවීම්', 'Monthly Subscription', 'Meeting Expenses', 'Welfare Payments'];
    for (const name of unwanted) {
        const acc = await db.accounts.where('accountName').equalsIgnoreCase(name).first();
        if (acc) {
            const hasEntries = await db.entries.where('accountId').equals(acc.id).count();
            if (hasEntries === 0) {
                await db.accounts.delete(acc.id);
                console.log(`Cleaned up unwanted account: ${name}`);
            }
        }
    }

    console.log("Required accounts verified/initialized.");
    
    // Set specific opening balance for Sanasa External Deposit Account as requested
    const targetAcc = await db.accounts.where('accountName').equalsIgnoreCase('සණස බාහිර තැන්පතු ගිණුම').first();
    if (targetAcc) {
        const entryCount = await db.entries.where('accountId').equals(targetAcc.id).count();
        if (entryCount === 0) {
            let eqAcc = await db.accounts.where('accountName').equalsIgnoreCase('Opening Balance Equity').first();
            if (!eqAcc) {
                const eqId = await db.accounts.add({ accountName: 'Opening Balance Equity', accountType: 'Equity', category: 'System Settings' });
                eqAcc = { id: eqId };
            }

            const txId = await db.transactions.add({
                date: '2026-01-01',
                type: 'Transfer',
                reference: 'OP-BAL',
                description: `Opening Balance for ${targetAcc.accountName}`,
                status: 'Completed',
                userId: 1
            });

            await db.entries.bulkAdd([
                { transactionId: txId, accountId: targetAcc.id, debit: 145391.00, credit: 0 },
                { transactionId: txId, accountId: eqAcc.id, debit: 0, credit: 145391.00 }
            ]);
            console.log("Opening balance set for සණස බාහිර තැන්පතු ගිණුම");
        }
    }
}

// Subscribe to readiness
db.on('ready', async () => {
    await initDefaultAccounts();
});

db.open().catch(err => {
    console.error("Failed to open db", err.stack || err);
});
