// Accounts Module Logic
async function renderAccounts() {
    return `
        <div class="glass-panel p-6 rounded-2xl h-full flex flex-col">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h3 class="text-xl font-bold text-gray-800">Chart of Accounts</h3>
                    <p class="text-sm text-gray-500">Manage all accounting ledger accounts</p>
                </div>
                <button onclick="openAccountModal()" class="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-brand-500/30">
                    <i class="fa-solid fa-plus"></i> Add Account
                </button>
            </div>
            
            <div class="mb-6 grid grid-cols-4 gap-4">
                <div class="bg-white/50 border border-gray-100 rounded-xl p-4 flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-lg"><i class="fa-solid fa-arrow-up"></i></div>
                    <div><div class="text-sm text-gray-500">Income</div><div class="font-bold text-lg" id="count-income">0</div></div>
                </div>
                <div class="bg-white/50 border border-gray-100 rounded-xl p-4 flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-lg"><i class="fa-solid fa-arrow-down"></i></div>
                    <div><div class="text-sm text-gray-500">Expense</div><div class="font-bold text-lg" id="count-expense">0</div></div>
                </div>
                <div class="bg-white/50 border border-gray-100 rounded-xl p-4 flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg"><i class="fa-solid fa-building"></i></div>
                    <div><div class="text-sm text-gray-500">Asset</div><div class="font-bold text-lg" id="count-asset">0</div></div>
                </div>
                <div class="bg-white/50 border border-gray-100 rounded-xl p-4 flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-lg"><i class="fa-solid fa-hand-holding-dollar"></i></div>
                    <div><div class="text-sm text-gray-500">Liability</div><div class="font-bold text-lg" id="count-liability">0</div></div>
                </div>
            </div>

            <!-- Table -->
            <div class="flex-1 overflow-auto rounded-xl border border-gray-100 bg-white/50 custom-scrollbar">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-gray-50/80 sticky top-0 backdrop-blur-md z-10">
                        <tr>
                            <th class="px-6 py-4 font-semibold text-gray-600 text-sm border-b border-gray-100">ගිණුමේ නම (Account Name)</th>
                            <th class="px-6 py-4 font-semibold text-gray-600 text-sm border-b border-gray-100">වර්ගය (Type)</th>
                            <th class="px-6 py-4 font-semibold text-gray-600 text-sm border-b border-gray-100 text-right">ශේෂය (Balance) (Rs)</th>
                            <th class="px-6 py-4 font-semibold text-gray-600 text-sm border-b border-gray-100 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="accountsTableBody" class="divide-y divide-gray-100">
                        <!-- Populated by JS -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function mountAccounts() {
    loadAccountsTable();
}

async function loadAccountsTable() {
    const tbody = document.getElementById('accountsTableBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-gray-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading...</td></tr>`;

    const accounts = await db.accounts.toArray();
    const entries = await db.entries.toArray();

    // Update summary counts
    document.getElementById('count-income').textContent = accounts.filter(a => a.accountType === 'Income').length;
    document.getElementById('count-expense').textContent = accounts.filter(a => a.accountType === 'Expense').length;
    document.getElementById('count-asset').textContent = accounts.filter(a => a.accountType === 'Asset').length;
    document.getElementById('count-liability').textContent = accounts.filter(a => ['Liability', 'Equity'].includes(a.accountType)).length;

    // Grouping
    const groups = [
        {
            name: 'මුදල් සහ බැංකු ගිණුම් (Cash & Bank)',
            list: accounts.filter(a => a.accountType === 'Asset' && (a.accountName.toLowerCase().includes('cash') || a.accountName.toLowerCase().includes('bank') || a.accountName.includes('මුදල් පොත') || a.accountName.includes('තැන්පතු') || a.category?.toLowerCase().includes('bank'))),
            color: 'blue'
        },
        {
            name: 'ආදායම් ගිණුම් (Income Accounts)',
            list: accounts.filter(a => a.accountType === 'Income'),
            color: 'green'
        },
        {
            name: 'වියදම් ගිණුම් (Expense Accounts)',
            list: accounts.filter(a => a.accountType === 'Expense'),
            color: 'red'
        },
        {
            name: 'වෙනත් (Other Accounts)',
            list: accounts.filter(a => 
                a.accountType !== 'Income' && 
                a.accountType !== 'Expense' && 
                !(a.accountType === 'Asset' && (a.accountName.toLowerCase().includes('cash') || a.accountName.toLowerCase().includes('bank') || a.accountName.includes('මුදල් පොත') || a.accountName.includes('තැන්පතු') || a.category?.toLowerCase().includes('bank')))
            ),
            color: 'gray'
        }
    ];

    // Format Currency Helper
    const formatCurrency = (amount) => amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const getTypeColor = (type) => {
        switch (type) {
            case 'Income': return 'bg-green-100 text-green-700';
            case 'Expense': return 'bg-red-100 text-red-700';
            case 'Asset': return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    let html = '';
    groups.forEach(group => {
        if (group.list.length > 0) {
            html += `<tr class="bg-gray-50/50"><td colspan="4" class="px-6 py-2 text-xs font-black uppercase tracking-widest text-${group.color}-600 border-y border-gray-100">${group.name}</td></tr>`;
            
            group.list.forEach(a => {
                // Calculate balance
                const accEntries = entries.filter(e => e.accountId === a.id);
                const debit = accEntries.reduce((sum, e) => sum + (parseFloat(e.debit) || 0), 0);
                const credit = accEntries.reduce((sum, e) => sum + (parseFloat(e.credit) || 0), 0);
                
                let balance = 0;
                if (a.accountType === 'Asset' || a.accountType === 'Expense') {
                    balance = debit - credit;
                } else {
                    balance = credit - debit;
                }

                html += `
                    <tr class="hover:bg-brand-50/30 transition-colors group">
                        <td class="px-6 py-4">
                            <div class="text-sm font-bold text-gray-800">${a.accountName}</div>
                            <div class="text-[10px] text-gray-400 uppercase tracking-tighter">${a.category || '-'}</div>
                        </td>
                        <td class="px-6 py-4 text-sm">
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getTypeColor(a.accountType)}">
                                ${a.accountType}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm text-right font-black ${balance < 0 ? 'text-red-600' : 'text-gray-900'}">
                            ${formatCurrency(balance)}
                        </td>
                        <td class="px-6 py-4 text-sm text-right space-x-1">
                            <button onclick="editAccount(${a.id})" class="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100">
                                <i class="fa-solid fa-pen text-xs"></i>
                            </button>
                            <button onclick="deleteAccount(${a.id})" class="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100">
                                <i class="fa-solid fa-trash text-xs"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
    });

    tbody.innerHTML = html || `<tr><td colspan="4" class="text-center py-12 text-gray-400 font-medium italic">ගිණුම් කිසිවක් හමු නොවීය.</td></tr>`;
}

window.openAccountModal = async (id = null) => {
    let account = { accountName: '', accountType: 'Asset', category: '' };
    let isEdit = false;

    if (id) {
        const found = await db.accounts.get(id);
        if (found) {
            account = found;
            isEdit = true;
        }
    }

    const html = `
        <h3 class="text-xl font-bold text-gray-800 mb-6">${isEdit ? 'Edit Account' : 'Add New Account'}</h3>
        <form id="accountForm" class="space-y-4" onsubmit="window.saveAccount(event, ${id})">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Account Name <span class="text-red-500">*</span></label>
                <input type="text" id="accName" required value="${account.accountName}" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" placeholder="e.g. Welfare Fund">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Account Type <span class="text-red-500">*</span></label>
                    <select id="accType" required class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all bg-white">
                        <option value="Asset" ${account.accountType === 'Asset' ? 'selected' : ''}>Asset</option>
                        <option value="Liability" ${account.accountType === 'Liability' ? 'selected' : ''}>Liability</option>
                        <option value="Equity" ${account.accountType === 'Equity' ? 'selected' : ''}>Equity / Capital</option>
                        <option value="Income" ${account.accountType === 'Income' ? 'selected' : ''}>Income / Revenue</option>
                        <option value="Expense" ${account.accountType === 'Expense' ? 'selected' : ''}>Expense</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input type="text" id="accCat" value="${account.category || ''}" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" placeholder="Optional category">
                </div>
            </div>
            
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label class="block text-sm font-medium text-gray-700 mb-1">Opening Balance (Rs) <span class="text-xs text-brand-600 ml-1 font-normal">(For New Accounts)</span></label>
                <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rs.</span>
                    <input type="number" step="0.01" id="accOpeningBal" ${isEdit ? 'disabled placeholder="Cannot edit after creation"' : 'value="0.00"'} class="w-full pl-12 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all ${isEdit ? 'bg-gray-200 cursor-not-allowed opacity-70 text-gray-500' : 'bg-white'}">
                </div>
                <p class="text-xs text-gray-500 mt-2"><i class="fa-solid fa-circle-info mr-1"></i> An Opening Balance Equity journal entry will be automatically generated to balance the ledger.</p>
            </div>
            
            <div class="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onclick="window.utils.closeModal()" class="px-5 py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors">Cancel</button>
                <button type="submit" class="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-brand-500/30">
                    <i class="fa-solid fa-save mr-2"></i> Save Account
                </button>
            </div>
        </form>
    `;

    window.utils.showModal(html);
};

window.saveAccount = async (e, id) => {
    e.preventDefault();

    try {
        const payload = {
            accountName: document.getElementById('accName').value,
            accountType: document.getElementById('accType').value,
            category: document.getElementById('accCat').value
        };
        const opBal = parseFloat(document.getElementById('accOpeningBal').value) || 0;

        if (id) {
            await db.accounts.update(id, payload);
            window.utils.showToast('Account updated successfully');
        } else {
            // Check if account already exists
            const existing = await db.accounts.where('accountName').equalsIgnoreCase(payload.accountName).first();
            if (existing) {
                window.utils.showToast('Account name already exists!', 'error');
                return;
            }
            const newAccId = await db.accounts.add(payload);

            // Handle Opening Balance automation safely using Double-Entry
            if (opBal > 0) {
                const isDebitBal = payload.accountType === 'Asset' || payload.accountType === 'Expense';

                let eqAcc = await db.accounts.where('accountName').equalsIgnoreCase('Opening Balance Equity').first();
                if (!eqAcc) {
                    const eqId = await db.accounts.add({ accountName: 'Opening Balance Equity', accountType: 'Equity', category: 'System Settings' });
                    eqAcc = { id: eqId };
                }

                const txId = await db.transactions.add({
                    date: new Date().toISOString().split('T')[0],
                    type: 'Transfer',
                    reference: 'OP-BAL',
                    description: `Opening Balance injection for ${payload.accountName}`,
                    amount: opBal,
                    status: 'Completed'
                });

                await db.entries.bulkAdd([
                    {
                        transactionId: txId,
                        accountId: newAccId,
                        debit: isDebitBal ? opBal : 0,
                        credit: isDebitBal ? 0 : opBal
                    },
                    {
                        transactionId: txId,
                        accountId: eqAcc.id,
                        debit: isDebitBal ? 0 : opBal,
                        credit: isDebitBal ? opBal : 0
                    }
                ]);
            }

            window.utils.showToast('Account added successfully');
        }

        window.utils.closeModal();
        loadAccountsTable();
    } catch (err) {
        console.error(err);
        window.utils.showToast('Error saving account', 'error');
    }
};

window.editAccount = (id) => {
    window.openAccountModal(id);
};

window.deleteAccount = async (id) => {
    // Basic dependency check mapping table entries
    const usedInEntries = await db.entries.where('accountId').equals(id).count();
    if (usedInEntries > 0) {
        window.utils.showToast('Cannot delete account as it has associated transactions.', 'error');
        return;
    }

    if (confirm('Are you sure you want to delete this account?')) {
        try {
            await db.accounts.delete(id);
            window.utils.showToast('Account deleted successfully');
            loadAccountsTable();
        } catch (err) {
            window.utils.showToast('Error deleting account', 'error');
        }
    }
};
