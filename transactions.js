// Transactions Module Logic
async function renderTransactions() {
    return `
        <div class="glass-panel p-6 rounded-2xl h-full flex flex-col">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h3 class="text-xl font-bold text-gray-800">Transactions Ledger</h3>
                    <p class="text-sm text-gray-500">Record receipts, payments, and journal entries</p>
                </div>
                <div class="flex flex-wrap gap-2 w-full md:w-auto">
                    <button onclick="openTransactionModal('Receipt')" class="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 text-sm">
                        <i class="fa-solid fa-arrow-down"></i> Receipt
                    </button>
                    <button onclick="openTransactionModal('Payment')" class="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 text-sm">
                        <i class="fa-solid fa-arrow-up"></i> Payment
                    </button>
                    <button onclick="openTransferModal()" class="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 border border-blue-500 text-sm">
                        <i class="fa-solid fa-exchange-alt"></i> Transfer
                    </button>
                    <button onclick="window.openAdvanceLoanModal()" class="flex-1 md:flex-none bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 border border-amber-500 text-sm" title="ස්ථාවර තැන්පතු අත්තිකාරම් ණය පියවීම සහ අලුත් කිරීම">
                        <i class="fa-solid fa-hand-holding-dollar"></i> අත්තිකාරම් ණය
                    </button>
                    ${window.currentUnit === 'Main' ? `
                    <button onclick="window.openFuneralModal()" class="flex-1 md:flex-none bg-gray-800 hover:bg-black text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-gray-500/30 text-sm">
                        <i class="fa-solid fa-cross"></i> Deaths
                    </button>
                    ` : ''}
                </div>
            </div>
            
            <!-- Quick Filters -->
            <div class="mb-6 flex flex-wrap gap-2 items-center">
                <input type="date" id="txStartDate" class="flex-1 md:flex-none px-4 py-2 rounded-xl border border-gray-200 focus:border-brand-500 bg-white/50 text-sm">
                <input type="date" id="txEndDate" class="flex-1 md:flex-none px-4 py-2 rounded-xl border border-gray-200 focus:border-brand-500 bg-white/50 text-sm">
                <select id="txTypeFilter" onchange="loadTransactionsTable()" class="flex-1 md:flex-none px-4 py-2 rounded-xl border border-gray-200 focus:border-brand-500 bg-white/50 text-sm outline-none">
                    <option value="All">All Types</option>
                    <option value="Receipt">Receipts</option>
                    <option value="Payment">Payments</option>
                    <option value="Transfer">Transfers</option>
                </select>
                <button onclick="loadTransactionsTable()" class="w-full md:w-auto bg-brand-50 text-brand-600 px-6 py-2 rounded-xl border border-brand-100 hover:bg-brand-100 font-bold text-sm">Filter</button>
            </div>

            <!-- Table -->
            <div class="flex-1 overflow-auto rounded-xl border border-gray-100 bg-white/50 custom-scrollbar">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-gray-50/80 sticky top-0 backdrop-blur-md z-10">
                        <tr>
                            <th class="px-6 py-4 font-semibold text-gray-600 text-sm border-b border-gray-100">Date</th>
                            <th class="px-6 py-4 font-semibold text-gray-600 text-sm border-b border-gray-100">Type</th>
                            <th class="px-6 py-4 font-semibold text-gray-600 text-sm border-b border-gray-100">Member</th>
                            <th class="px-6 py-4 font-semibold text-gray-600 text-sm border-b border-gray-100">Reference</th>
                            <th class="px-6 py-4 font-semibold text-gray-600 text-sm border-b border-gray-100">Description</th>
                            <th class="px-6 py-4 font-semibold text-gray-600 text-sm border-b border-gray-100 text-right">Amount</th>
                            <th class="px-6 py-4 font-semibold text-gray-600 text-sm border-b border-gray-100 text-center">User</th>
                            <th class="px-6 py-4 font-semibold text-gray-600 text-sm border-b border-gray-100 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="transactionsTableBody" class="divide-y divide-gray-100">
                        <!-- Populated by JS -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function mountTransactions() {
    loadTransactionsTable();
}

async function loadTransactionsTable() {
    const tbody = document.getElementById('transactionsTableBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-gray-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading...</td></tr>`;

    const startDate = document.getElementById('txStartDate')?.value;
    const endDate = document.getElementById('txEndDate')?.value;

    let query = db.transactions;
    if (startDate && endDate) {
        query = query.where('date').between(startDate, endDate, true, true);
    }

    let transactions = await query.toArray();
    // Filter by Current Unit
    transactions = transactions.filter(t => (t.unit || 'Main') === window.currentUnit).reverse();

    // Filter by Transaction Type if selected
    const typeFilter = document.getElementById('txTypeFilter')?.value || 'All';
    if (typeFilter !== 'All') {
        transactions = transactions.filter(t => t.type === typeFilter);
    }

    if (transactions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-gray-400">No transactions found.</td></tr>`;
        return;
    }

    // Pre-fetch all members for fast lookup
    const membersMap = {};
    const members = await db.members.toArray();
    members.forEach(m => membersMap[m.id] = m);

    // Pre-fetch all users for fast lookup
    const usersMap = {};
    const users = await db.users.toArray();
    users.forEach(u => usersMap[u.id] = u);

    let rows = [];
    for (let tx of transactions) {
        const entryDebits = await db.entries.where('transactionId').equals(tx.id).toArray();
        const totalAmount = entryDebits.reduce((acc, curr) => acc + (parseFloat(curr.debit) || 0), 0);

        let memberLabel = '-';
        if (tx.memberId && membersMap[tx.memberId]) {
            memberLabel = `<span class="px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-semibold cursor-pointer hover:bg-blue-100" onclick="if(window.viewMemberProfile) window.viewMemberProfile(${tx.memberId})">${membersMap[tx.memberId].memberNo || ''} ${membersMap[tx.memberId].name}</span>`;
        } else if (tx.otherName) {
            memberLabel = `<span class="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold">${tx.otherName} (Other)</span>`;
        }

        let statusStyle = tx.status === 'Cancelled' ? 'opacity-50 bg-red-50/20' : 'hover:bg-brand-50/50';
        let txDesc = tx.description || '-';
        if (tx.status === 'Cancelled') {
            txDesc = `<span class="text-red-500 font-medium">[CANCELLED]</span> ${tx.cancelReason ? `<span>- ${tx.cancelReason}</span>` : ''}`;
        }

        let amountDisplay = tx.status === 'Cancelled' ? '<span class="line-through text-gray-400">' + totalAmount.toFixed(2) + '</span>' : totalAmount.toFixed(2);

        rows.push(`
            <tr class="transition-colors ${statusStyle}">
                <td class="px-6 py-4 text-sm text-gray-600">${window.utils.formatDate(tx.date)}</td>
                <td class="px-6 py-4 text-sm">
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${tx.type === 'Receipt' ? 'bg-green-100 text-green-700' : tx.type === 'Payment' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}">
                        ${tx.type}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm">${memberLabel}</td>
                <td class="px-6 py-4 text-sm font-medium text-gray-800">${tx.reference || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-600">${txDesc}</td>
                <td class="px-6 py-4 text-sm font-bold text-gray-800 text-right">${amountDisplay}</td>
                <td class="px-6 py-4 text-center">
                    <div class="flex flex-col items-center">
                        <span class="text-[10px] text-gray-400 uppercase font-bold">${usersMap[tx.userId]?.name || 'Admin'}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="window.viewTransaction(${tx.id})" class="text-blue-600 hover:text-blue-800 w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors tooltip" title="View">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button onclick="window.printTransaction(${tx.id})" class="text-brand-600 hover:brand-800 w-8 h-8 rounded-lg bg-brand-50 hover:bg-brand-100 flex items-center justify-center transition-colors tooltip" title="Print Bill">
                            <i class="fa-solid fa-print"></i>
                        </button>
                        ${tx.status !== 'Cancelled' ? `
                        <button onclick="window.cancelTransaction(${tx.id})" class="text-red-500 hover:text-red-700 w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors tooltip" title="Cancel">
                            <i class="fa-solid fa-ban"></i>
                        </button>` : ''}
                    </div>
                </td>
            </tr>
        `);
    }

    tbody.innerHTML = rows.join('');
}

// Ensure options reference is globally accessible for dynamic injection
window.txGlobalAccountOptions = '';

window.getNextReferenceNumber = async (prefix) => {
    try {
        const txs = await db.transactions.toArray();
        let max = 0;
        txs.forEach(t => {
            if (t.reference && t.reference.startsWith(prefix)) {
                const numPart = t.reference.substring(prefix.length);
                const num = parseInt(numPart);
                if (!isNaN(num) && num > max) max = num;
            }
        });
        return prefix + String(max + 1).padStart(6, '0');
    } catch (err) {
        console.error(err);
        return prefix + '000001';
    }
};

window.addTxLineRow = (preSelectedAccountId = null) => {
    const container = document.getElementById('txLinesContainer');
    if (!container) return;

    const row = document.createElement('div');
    row.className = "flex items-center gap-3 mb-3 bg-gray-50/50 p-3 rounded-xl border border-gray-200 relative pr-12 animate-fade-in";
    row.innerHTML = `
        <div class="flex-1">
            <select name="lineAccountId[]" required class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all bg-white text-sm">
                <option value="" disabled selected>Select Account</option>
                ${window.txGlobalAccountOptions}
            </select>
        </div>
        <div class="w-1/3">
            <input type="number" name="lineAmount[]" required step="0.01" min="0.01" placeholder="0.00" oninput="window.calculateTxTotal()" class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-sm text-right">
        </div>
        <button type="button" onclick="this.parentElement.remove(); window.calculateTxTotal();" class="absolute right-2 text-red-400 hover:text-red-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors tooltip" title="Remove Line">
            <i class="fa-solid fa-trash"></i>
        </button>
    `;
    container.appendChild(row);

    if (preSelectedAccountId) {
        const select = row.querySelector('select');
        if (select) select.value = preSelectedAccountId;
    }
};

window.calculateTxTotal = () => {
    const amounts = Array.from(document.getElementsByName('lineAmount[]')).map(e => parseFloat(e.value) || 0);
    const total = amounts.reduce((a, b) => a + b, 0);
    const totalEl = document.getElementById('txTotalDisplay');
    if (totalEl) totalEl.textContent = total.toFixed(2);
};

window.handleCbAccountChange = async (accountId, type) => {
    const isMain = window.currentUnit === 'Main';
    const refInput = document.getElementById('txRef');
    if (!refInput) return;

    if (isMain && (type === 'Receipt' || type === 'Payment')) {
        const prefix = type === 'Receipt' ? 'AR' : 'PV';
        const id = parseInt(accountId);
        if (isNaN(id)) {
            if (new RegExp('^' + prefix + '\\d+$').test(refInput.value)) {
                refInput.value = '';
            }
            refInput.readOnly = false;
            refInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
            refInput.classList.add('bg-white', 'cursor-text');
            refInput.placeholder = 'Enter Reference Number';
            return;
        }

        const account = await db.accounts.get(id);
        if (account && account.accountName === 'අරුණළු මුදල් පොත') {
            const nextRef = await window.getNextReferenceNumber(prefix);
            refInput.value = nextRef;
            refInput.readOnly = true;
            refInput.classList.remove('bg-white', 'cursor-text');
            refInput.classList.add('bg-gray-100', 'cursor-not-allowed');
            refInput.placeholder = '';
        } else {
            if (new RegExp('^' + prefix + '\\d+$').test(refInput.value)) {
                refInput.value = '';
            }
            refInput.readOnly = false;
            refInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
            refInput.classList.add('bg-white', 'cursor-text');
            refInput.placeholder = 'Enter Reference Number';
        }
    }
};

window.openTransactionModal = async (type) => {
    // type is 'Receipt' or 'Payment'
    const accounts = (await db.accounts.toArray()).filter(a => (a.unit || 'Main') === window.currentUnit);
    const members = await db.members.toArray();

    const cashBankAccounts = accounts.filter(a =>
        (a.accountName && (a.accountName.toLowerCase().includes('cash') || a.accountName.toLowerCase().includes('bank') || a.accountName.includes('මුදල් පොත') || a.accountName.includes('තැන්පතු'))) ||
        a.category === 'Current Asset' ||
        a.accountType === 'Asset'
    );
    const cbOptions = cashBankAccounts.map(a => `<option value="${a.id}">${a.accountName}</option>`).join('');

    window.txGlobalAccountOptions = accounts.map(a => `<option value="${a.id}">${a.accountName} (${a.accountType})</option>`).join('');

    const memOptions = members.map(m => `<option value="${m.memberNo} - ${m.name}"></option>`).join('');

    const title = type === 'Receipt' ? 'New Receipt (Money In)' : 'New Payment (Money Out)';
    const btnColor = type === 'Receipt' ? 'green' : 'red';
    const splitTitle = type === 'Receipt' ? 'Received From (Accounts)' : 'Paid For (Accounts)';

    const html = `
        <h3 class="text-xl font-bold text-gray-800 mb-6">${title}</h3>
        <form id="txForm" data-type="${type}" class="space-y-5 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar" onsubmit="window.saveTransaction(event, '${type}')">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date <span class="text-red-500">*</span></label>
                    <input type="date" id="txDate" required onchange="const input = document.getElementById('txPayerInput'); if(input && input.value) window.handleTxMemberSelection(input.value, '${type}')" value="${new Date().toISOString().split('T')[0]}" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Reference No</label>
                    <input type="text" id="txRef" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 outline-none transition-all font-bold text-brand-600 bg-white cursor-text" placeholder="e.g. AR000001">
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Payer / Member</label>
                    <input list="membersList" id="txPayerInput" onchange="window.handleTxMemberSelection(this.value, '${type}')" oninput="window.handleTxMemberSelection(this.value, '${type}')" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all bg-white" placeholder="Search member..." autocomplete="off">
                    <input type="hidden" id="txMemberId">
                    <datalist id="membersList">
                        ${memOptions}
                    </datalist>
                    <div id="duesSummaryContainer" class="mt-2 hidden animate-fade-in"></div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">${type === 'Receipt' ? 'Deposit To' : 'Pay From'} (Asset) <span class="text-red-500">*</span></label>
                    <select id="cbAccount" required onchange="window.handleCbAccountChange(this.value, '${type}')" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all bg-white">
                        <option value="" disabled selected>Select Account</option>
                        ${cbOptions}
                    </select>
                </div>
            </div>

            <div class="border-t border-gray-100 pt-4">
                <div class="flex justify-between items-center mb-3">
                    <label class="block text-sm font-semibold text-gray-800">${splitTitle} <span class="text-red-500">*</span></label>
                    <button type="button" onclick="window.addTxLineRow()" class="text-xs text-brand-600 font-medium hover:text-brand-700 bg-brand-50 hover:bg-brand-100 flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors border border-brand-100">
                        <i class="fa-solid fa-plus"></i> Add Line
                    </button>
                </div>
                
                <div id="txLinesContainer">
                    <!-- Dynamic splits go here -->
                </div>
                
                <div class="flex justify-end pr-14 mt-2">
                    <div class="text-gray-600 font-medium mr-4">Total Amount:</div>
                    <div class="text-xl font-bold text-gray-800">Rs. <span id="txTotalDisplay">0.00</span></div>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description / Narration <span class="text-gray-400 font-normal ml-1">(Optional)</span></label>
                <textarea id="txDesc" rows="2" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all resize-none" placeholder="Provide transaction details..."></textarea>
            </div>
            
            <div class="pt-4 border-t border-gray-100 flex flex-wrap justify-end gap-2 sticky bottom-0 bg-white/95 backdrop-blur-md pb-2 mt-4">
                <button type="button" onclick="window.utils.closeModal()" class="flex-1 md:flex-none px-4 py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors text-sm">Cancel</button>
                <button type="button" onclick="window.saveTransaction(event, '${type}', true)" class="flex-1 md:flex-none bg-gray-800 hover:bg-black text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-gray-500/30 text-sm">
                    <i class="fa-solid fa-print"></i> Save & Print
                </button>
                <button type="submit" class="w-full md:w-auto bg-${btnColor}-600 hover:bg-${btnColor}-700 text-white px-6 py-2.5 rounded-lg font-bold transition-colors shadow-lg shadow-${btnColor}-500/30 text-sm">
                    <i class="fa-solid fa-save mr-2"></i> Save Only
                </button>
            </div>
        </form>
    `;

    window.utils.showModal(html);

    // Inject at least one line immediately and auto-fill reference
    requestAnimationFrame(async () => {
        const prefix = type === 'Receipt' ? 'AR' : 'PV';
        const isMain = window.currentUnit === 'Main';
        const refInput = document.getElementById('txRef');
        
        if (refInput) {
            refInput.value = '';
            refInput.placeholder = "Enter Reference Number";
            refInput.readOnly = false;
            refInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
            refInput.classList.add('bg-white', 'cursor-text');
        }

        if (type === 'Receipt') {
            const isSAP = window.currentUnit === 'SAP';
            const welfarAcc = accounts.find(a => a.accountName && a.accountName.includes(isSAP ? 'SAP මුදල් පොත' : 'සුභ සාධක අරමුදල්'));
            const monthlyAcc = accounts.find(a => a.accountName && a.accountName.includes(isSAP ? 'සිතුමිණ තැන්පත් ගිණුම' : 'මාසික සාමාජික මුදල්'));

            if (welfarAcc || monthlyAcc) {
                if (isSAP) {
                    if (welfarAcc) window.addTxLineRow(welfarAcc.id);
                } else {
                    if (welfarAcc) window.addTxLineRow(welfarAcc.id);
                    if (monthlyAcc) window.addTxLineRow(monthlyAcc.id);
                }
            } else {
                window.addTxLineRow();
            }
        } else {
            window.addTxLineRow();
        }
    });
};

window.saveTransaction = async (e, type, printAfter = false) => {
    e.preventDefault();

    try {
        const date = document.getElementById('txDate').value;
        const ref = document.getElementById('txRef').value;
        const payerInput = document.getElementById('txPayerInput').value.trim();
        const cbAccId = parseInt(document.getElementById('cbAccount').value);
        const desc = document.getElementById('txDesc').value;

        let memberId = null;
        let otherName = null;

        const hiddenMemberId = document.getElementById('txMemberId')?.value;
        if (hiddenMemberId) {
            memberId = parseInt(hiddenMemberId);
        } else if (payerInput) {
            const members = await db.members.toArray();
            const lowerPayer = payerInput.toLowerCase();
            const matchedMember = members.find(m => 
                (`${m.memberNo} - ${m.name}`).toLowerCase() === lowerPayer || 
                String(m.memberNo).toLowerCase() === lowerPayer || 
                m.name.toLowerCase() === lowerPayer
            );
            if (matchedMember) {
                memberId = matchedMember.id;
            } else {
                otherName = payerInput;
            }
        }

        // Process dynamic line items
        const lineAccountIds = Array.from(document.getElementsByName('lineAccountId[]')).map(el => parseInt(el.value));
        const lineAmounts = Array.from(document.getElementsByName('lineAmount[]')).map(el => parseFloat(el.value));

        let validLines = [];
        let totalAmount = 0;

        for (let i = 0; i < lineAccountIds.length; i++) {
            if (!isNaN(lineAccountIds[i]) && !isNaN(lineAmounts[i]) && lineAmounts[i] > 0) {
                validLines.push({ accountId: lineAccountIds[i], amount: lineAmounts[i] });
                totalAmount += lineAmounts[i];
            }
        }

        if (!cbAccId || validLines.length === 0 || totalAmount <= 0) {
            window.utils.showToast('Please verify your accounts and enter valid amounts greater than 0', 'error');
            return;
        }

        // Add Transaction record
        const txId = await db.transactions.add({
            date: date,
            type: type,
            reference: ref,
            memberId: memberId,
            otherName: otherName,
            description: desc,
            userId: window.auth.session ? window.auth.session.id : null,
            unit: window.currentUnit,
            status: 'Active'
        });

        const entries = [];

        if (type === 'Receipt') {
            // Debit the Cash/Bank Asset for the TOTAL amount
            entries.push({ transactionId: txId, accountId: cbAccId, debit: totalAmount, credit: 0 });
            // Credit the individual Income/Liability accounts
            validLines.forEach(line => {
                entries.push({ transactionId: txId, accountId: line.accountId, debit: 0, credit: line.amount });
            });
        } else {
            // Credit the Cash/Bank Asset for the TOTAL amount
            entries.push({ transactionId: txId, accountId: cbAccId, debit: 0, credit: totalAmount });
            // Debit the individual Expense/Asset accounts
            validLines.forEach(line => {
                entries.push({ transactionId: txId, accountId: line.accountId, debit: line.amount, credit: 0 });
            });
        }

        await db.entries.bulkAdd(entries);

        window.utils.showToast(`${type} saved successfully!`);
        window.utils.closeModal();
        loadTransactionsTable();
        if (window.refreshCurrentView) window.refreshCurrentView();

        if (printAfter) {
            setTimeout(() => {
                window.printTransaction(txId);
            }, 500);
        }
    } catch (err) {
        console.error(err);
        window.utils.showToast('Error saving transaction', 'error');
    }
};

window.openTransferModal = async () => {
    const accounts = (await db.accounts.toArray()).filter(a => (a.unit || 'Main') === window.currentUnit);
    const cashBankAccounts = accounts.filter(a => (a.accountName && (a.accountName.toLowerCase().includes('cash') || a.accountName.toLowerCase().includes('bank') || a.accountName.includes('මුදල් පොත') || a.accountName.includes('තැන්පතු'))) || a.category === 'Current Asset');

    let cbOptions = '<option value="" disabled selected>Select Account</option>';
    cbOptions += cashBankAccounts.map(a => `<option value="${a.id}">${a.accountName}</option>`).join('');

    const html = `
        <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <i class="fa-solid fa-exchange-alt text-blue-600"></i> Inter-Account Transfer
        </h3>
        <form id="txTransferForm" class="space-y-5" onsubmit="window.saveTransfer(event)">
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date <span class="text-red-500">*</span></label>
                    <input type="date" id="tDate" required value="${new Date().toISOString().split('T')[0]}" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Reference No</label>
                    <input type="text" id="tRef" readonly class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 outline-none transition-all font-bold text-blue-600 bg-gray-100 cursor-not-allowed" placeholder="e.g. TRF-001">
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 bg-gray-50 border border-gray-100 p-4 rounded-xl relative">
                <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm z-10 text-brand-600">
                    <i class="fa-solid fa-arrow-right"></i>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Transfer From (Deduct) <span class="text-red-500">*</span></label>
                    <select id="tFrom" required class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all bg-white relative z-0">
                        ${cbOptions}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Transfer To (Add) <span class="text-red-500">*</span></label>
                    <select id="tTo" required class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all bg-white pl-6">
                        ${cbOptions}
                    </select>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Transfer Amount (Rs.) <span class="text-red-500">*</span></label>
                <input type="number" id="tAmount" required step="0.01" min="0.01" placeholder="0.00" class="w-full text-lg px-4 py-3 rounded-xl border border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all bg-green-50/30 text-right font-bold text-gray-800">
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description / Narration</label>
                <textarea id="tDesc" rows="2" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all resize-none" placeholder="e.g. Moved excess cash to bank..."></textarea>
            </div>
            
            <div class="pt-4 border-t border-gray-100 flex justify-end gap-3 pb-2 mt-4">
                <button type="button" onclick="window.utils.closeModal()" class="px-5 py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors border border-gray-200">Cancel</button>
                <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/30">
                    <i class="fa-solid fa-paper-plane mr-2"></i> Submit Transfer
                </button>
            </div>
        </form>
    `;

    window.utils.showModal(html);

    // Auto-fill reference
    requestAnimationFrame(async () => {
        const nextRef = await window.getNextReferenceNumber('TRF');
        const refInput = document.getElementById('tRef');
        if (refInput) refInput.value = nextRef;
    });
};

window.saveTransfer = async (e) => {
    e.preventDefault();
    try {
        const fromAccId = parseInt(document.getElementById('tFrom').value);
        const toAccId = parseInt(document.getElementById('tTo').value);
        const amount = parseFloat(document.getElementById('tAmount').value);

        if (fromAccId === toAccId) {
            window.utils.showToast("Cannot transfer to the same account", "error");
            return;
        }

        const date = document.getElementById('tDate').value;
        const ref = document.getElementById('tRef').value;
        const desc = document.getElementById('tDesc').value;

        const txId = await db.transactions.add({
            date: date,
            type: 'Transfer',
            reference: ref,
            memberId: null,
            otherName: null,
            description: desc || 'Inter-Account Transfer',
            unit: window.currentUnit,
            userId: window.auth.session ? window.auth.session.id : null,
            status: 'Active'
        });

        await db.entries.bulkAdd([
            { transactionId: txId, accountId: toAccId, debit: amount, credit: 0 },
            { transactionId: txId, accountId: fromAccId, debit: 0, credit: amount }
        ]);

        window.utils.showToast("Transfer completed securely");
        window.utils.closeModal();
        loadTransactionsTable();
        if (window.refreshCurrentView) window.refreshCurrentView();
    } catch (err) {
        console.error(err);
        window.utils.showToast("Error processing transfer", "error");
    }
};

window.printTransaction = async (id) => {
    const tx = await db.transactions.get(id);
    if (!tx) return;

    const creatorUser = tx.userId ? await db.users.get(tx.userId) : null;
    const creatorUserName = creatorUser ? creatorUser.name : 'Admin';

    const entries = await db.entries.where('transactionId').equals(id).toArray();
    let total = 0;
    let linesHtml = '';

    const accounts = await db.accounts.toArray();
    const accMap = {};
    accounts.forEach(a => accMap[a.id] = a);

    if (tx.type === 'Receipt') {
        const creditEntries = entries.filter(e => e.credit > 0);
        total = creditEntries.reduce((a, e) => a + e.credit, 0);
        linesHtml = creditEntries.map(e => `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 2px 0;">
                <div style="padding-right: 10px;">${accMap[e.accountId]?.accountName || 'Unknown'}</div>
                <div style="font-weight: bold; white-space: nowrap;">${e.credit.toFixed(2)}</div>
            </div>
        `).join('');
    } else if (tx.type === 'Transfer') {
        const debitEntry = entries.find(e => e.debit > 0);
        const creditEntry = entries.find(e => e.credit > 0);
        total = debitEntry?.debit || 0;
        linesHtml = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 2px 0;">
                <div style="padding-right: 10px;">Transfer To: ${accMap[debitEntry?.accountId]?.accountName || 'Unknown'}</div>
                <div style="font-weight: bold; white-space: nowrap;">${total.toFixed(2)}</div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 2px 0; color: #666; font-size: 0.9em;">
                <div style="padding-right: 10px;">(From: ${accMap[creditEntry?.accountId]?.accountName || 'Unknown'})</div>
                <div></div>
            </div>
        `;
    } else {
        const debitEntries = entries.filter(e => e.debit > 0);
        total = debitEntries.reduce((a, e) => a + e.debit, 0);
        linesHtml = debitEntries.map(e => `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 2px 0;">
                <div style="padding-right: 10px;">${accMap[e.accountId]?.accountName || 'Unknown'}</div>
                <div style="font-weight: bold; white-space: nowrap;">${e.debit.toFixed(2)}</div>
            </div>
        `).join('');
    }

    let memberLabel = tx.otherName || '-';
    if (tx.memberId) {
        const member = await db.members.get(tx.memberId);
        if (member) memberLabel = `${member.memberNo || ''} - ${member.name}`;
    }

    const printArea = document.getElementById('printArea');
    const title = tx.type === 'Receipt' ? 'RECEIPT' : tx.type === 'Payment' ? 'PAYMENT VOUCHER' : 'TRANSFER VOUCHER';

    let arrearsHtml = '';
    if (tx.memberId && tx.type === 'Receipt' && (tx.unit || 'Main') === 'Main') {
        const dues = await window.getMemberDues(tx.memberId, tx.date);
        const totalArrears = dues.entranceDue + dues.monthlyDue + dues.funeralDue + dues.arrearsDue;
        if (totalArrears > 0) {
            arrearsHtml = `
                <div style="border: 1px solid black; padding: 4px; margin-top: 8px; text-align: center; border-style: double;">
                    <div style="font-size: 9px; font-weight: 800; text-transform: uppercase;">පසුගිය හිඟ ශේෂය (Total Arrears)</div>
                    <div style="font-size: 11px; font-weight: 900;">Rs. ${totalArrears.toFixed(2)}</div>
                </div>
            `;
        } else if (dues.monthlyAdvance > 0) {
            arrearsHtml = `
                <div style="border: 1px solid black; padding: 4px; margin-top: 8px; text-align: center; border-style: double;">
                    <div style="font-size: 9px; font-weight: 800; text-transform: uppercase;">ඉදිරි ගෙවීම් ශේෂය (Advance Balance)</div>
                    <div style="font-size: 11px; font-weight: 900; color: #15803d;">Rs. ${dues.monthlyAdvance.toFixed(2)}</div>
                </div>
            `;
        }
    }

    if (tx.type === 'Payment') {
        // A5 Formal Layout for Payments - Doubled for A4 (Original + Office Copy)
        const voucherHtml = (label) => {
            const isOriginal = label.includes('Original');
            
            let sigAreaHtml = '';
            if (isOriginal) {
                // Original Copy: Received by (Name/Sig) and Treasurer
                sigAreaHtml = `
                    <div style="display: flex; justify-content: space-between; margin-top: 10mm; align-items: flex-end;">
                        <div style="width: 55%; text-align: left;">
                            <div style="margin-bottom: 5mm;">..................................................................</div>
                            <div style="font-size: 10px; font-weight: 800;">මුදල් භාරගත් බවට නම සහ අත්සන (Received by Name & Signature)</div>
                        </div>
                        <div style="width: 40%; text-align: right;">
                            <div style="margin-bottom: 5mm;">................................................</div>
                            <div style="font-size: 10px; font-weight: 800;">භාණ්ඩාගාරික (Treasurer)</div>
                        </div>
                    </div>
                `;
            } else {
                // Office Copy: 4 Signatures in a 2x2 Table for better print compatibility
                sigAreaHtml = `
                    <table style="width: 100%; margin-top: 10mm; border: none; border-collapse: collapse;">
                        <tr>
                            <td style="width: 50%; padding-bottom: 8mm; vertical-align: bottom; text-align: left;">
                                <div style="margin-bottom: 4mm;">................................................</div>
                                <div style="font-size: 9px; font-weight: 800;">මුදල් භාරදුන් බවට භාණ්ඩාගාරික (Handed over by Treasurer)</div>
                            </td>
                            <td style="width: 50%; padding-bottom: 8mm; vertical-align: bottom; text-align: right;">
                                <div style="margin-bottom: 4mm;">................................................</div>
                                <div style="font-size: 9px; font-weight: 800;">මුදල් භාරගත් බවට නම සහ අත්සන (Received by Name & Signature)</div>
                            </td>
                        </tr>
                        <tr>
                            <td style="width: 50%; vertical-align: bottom; text-align: left;">
                                <div style="margin-bottom: 4mm;">................................................</div>
                                <div style="font-size: 9px; font-weight: 800;">පරීක්ෂා කළේ: විගණන නිලධාරී (Checked by Auditor)</div>
                            </td>
                            <td style="width: 50%; vertical-align: bottom; text-align: right;">
                                <div style="margin-bottom: 4mm;">................................................</div>
                                <div style="font-size: 9px; font-weight: 800;">අනුමත කළේ: සභාපති (Approved by Chairman)</div>
                            </td>
                        </tr>
                    </table>
                `;
            }

            return `
            <div style="width: 210mm; height: 148.5mm; padding: 8mm; ${!isOriginal ? 'padding-left: 20mm;' : ''} font-family: 'Inter', 'Iskoola Pota', sans-serif; color: black; background: white; border-bottom: 2px dashed #000; box-sizing: border-box; position: relative; overflow: hidden; border: 1.5px solid #000;">
                <!-- Label Badge -->
                <div style="position: absolute; right: 8mm; top: 8mm; font-size: 8px; font-weight: 900; color: #333; text-transform: uppercase; border: 1px solid #000; padding: 1mm 2mm; background: #eee;">${label}</div>
                
                <!-- Header -->
                <div style="display: flex; gap: 10mm; margin-bottom: 3mm;">
                    <div style="flex: 1;">
                        <h1 style="font-size: 16px; font-weight: 900; margin: 0; color: #000;">${(tx.unit || 'Main') === 'SAP' ? 'SAP CENTER - ARUNALU' : 'Arunalu Welfare Society'}</h1>
                        <p style="font-size: 10px; font-weight: bold; margin: 1px 0;">Galapitiyagama, Nikaweratiya</p>
                        <p style="font-size: 10px; font-weight: 900; color: #000; text-transform: uppercase;">${(tx.unit || 'Main') === 'SAP' ? 'SAP CENTER PROJECT - WELFARE BRANCH' : 'Galapitiyagama Sanasa Society - Welfare Branch'}</p>
                    </div>
                </div>

                <!-- Title & Metadata Boxes -->
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 3mm;">
                    <div style="font-size: 14px; font-weight: 900; text-decoration: underline; text-transform: uppercase;">මුදල් ගෙවීමේ වවුචරය (PAYMENT VOUCHER)</div>
                    <div style="display: flex; gap: 3mm; align-items: flex-end;">
                        <div style="display: flex; flex-direction: column; gap: 1mm;">
                            <div style="display: flex; align-items: center; border: 1px solid #000; padding: 0.5mm 2mm;">
                                <span style="font-size: 9px; font-weight: 800; margin-right: 2mm;">වවුචර අංකය:</span>
                                <span style="font-size: 11px; font-weight: 900;">${tx.reference || '-'}</span>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; border: 1px solid #000; padding: 0.5mm 2mm; height: fit-content;">
                            <span style="font-size: 9px; font-weight: 800; margin-right: 2mm;">දිනය:</span>
                            <span style="font-size: 11px; font-weight: 900;">${window.utils.formatDate(tx.date)}</span>
                        </div>
                        <!-- QR Code via API (More reliable for print) -->
                        <div style="margin-left: 1mm;">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`AWS | ${tx.reference} | ${memberLabel.split(' - ')[1] || memberLabel} | Rs.${total.toFixed(2)} | ${window.utils.formatDate(tx.date)} | ${entries.filter(e => e.debit > 0).map(e => accMap[e.accountId]?.accountName || '').join(', ')}`)}" style="width: 18mm; height: 18mm; border: 1px solid #eee;" />
                        </div>
                    </div>
                </div>

                <!-- Payee Info -->
                <div style="margin-bottom: 3mm; border-bottom: 1px dotted #000; padding-bottom: 0.5mm;">
                    <span style="font-size: 10px; font-weight: 800;">සාමාජික අංකය සහ නම (Member No & Name):</span>
                    <span style="font-size: 12px; font-weight: 900; margin-left: 2mm;">${memberLabel}</span>
                </div>

                <!-- Main Table -->
                <table style="width: 100%; border: 1.5px solid #000; border-collapse: collapse; margin-bottom: 4mm;">
                    <thead>
                        <tr style="border-bottom: 1.5px solid #000; background: #f9f9f9;">
                            <th style="text-align: center; padding: 1.5mm; font-size: 10px; font-weight: 900; border-right: 1.5px solid #000;">ගෙවීම් පිළිබඳ විස්තරය (Description of Payment)</th>
                            <th style="text-align: center; padding: 1.5mm; font-size: 10px; font-weight: 900; width: 40mm;">මුදල (Amount Rs.)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="height: 20mm; vertical-align: top;">
                            <td style="padding: 2mm; font-size: 11px; border-right: 1.5px solid #000; line-height: 1.4;">
                                ${entries.filter(e => e.debit > 0).map(e => `• ${accMap[e.accountId]?.accountName || 'Unknown'}`).join('<br>')}
                                ${tx.description ? `<br><div style="margin-top: 1.5mm; font-style: italic; font-size: 10px;">Note: ${tx.description}</div>` : ''}
                            </td>
                            <td style="padding: 2mm; font-size: 12px; font-weight: 900; text-align: right;">
                                ${entries.filter(e => e.debit > 0).map(e => `<div>${e.debit.toFixed(2)}</div>`).join('')}
                            </td>
                        </tr>
                        <tr style="border-top: 1.5px solid #000; font-weight: 900; background: #eee;">
                            <td style="text-align: right; padding: 2mm; font-size: 11px; border-right: 1.5px solid #000; text-transform: uppercase;">මුළු එකතුව (GRAND TOTAL)</td>
                            <td style="text-align: right; padding: 2mm; font-size: 13px;">${total.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>

                ${sigAreaHtml}

                <!-- Vertical Developer Branding -->
                <div style="position: absolute; right: 1mm; bottom: 60mm; transform: rotate(-90deg); transform-origin: right bottom; font-size: 7px; color: #999; white-space: nowrap; font-weight: bold; font-style: italic; letter-spacing: 0.5px; text-transform: uppercase; pointer-events: none;">
                    System - iraasoft solution 0752895951
                </div>
            </div>
            `;
        };

        printArea.innerHTML = `
            <style>
                @media print {
                    @page { size: A4 portrait; margin: 0; }
                    html, body { width: 210mm !important; height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; }
                    #printArea { width: 210mm !important; position: static !important; height: auto !important; overflow: visible !important; }
                }
            </style>
            <div style="width: 210mm; background: white;">
                ${voucherHtml('Original Copy - Member')}
                ${voucherHtml('Office Copy - Society')}
            </div>
        `;

    } else {
        // Standard Thermal Layout for Receipts/Transfers - Optimized for 48mm Bluetooth Printers
        let statusTagHtml = '';
        if (tx.memberId && tx.type === 'Receipt') {
            const dues = await window.getMemberDues(tx.memberId, tx.date);
            if (dues.isInvalid) {
                statusTagHtml = `<div style="text-align: center; border: 1px solid black; margin: 4px 0; font-size: 9px; font-weight: bold;">INVALID MEMBERSHIP</div>`;
            } else if (dues.isNewMember) {
                statusTagHtml = `<div style="text-align: center; border: 1px solid black; margin: 4px 0; font-size: 9px; font-weight: bold;">NEW MEMBER (GRACE)</div>`;
            }
        }

        printArea.innerHTML = `
            <style>
                @media print {
                    @page { size: 48mm auto; margin: 0; }
                    html, body { width: 48mm !important; height: auto !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; }
                    #printArea { width: 48mm !important; height: auto !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; position: static !important; }
                    .no-print { display: none !important; }
                }
            </style>
            <div style="width: 48mm; max-width: 48mm; margin: 0 auto; padding: 1mm; font-family: 'Inter', 'Iskoola Pota', sans-serif; font-size: 9.5px; line-height: 1.2; color: black; background: white; box-sizing: border-box;">
                
                <div style="text-align: center; margin-bottom: 6px;">
                    <h1 style="font-size: 12px; font-weight: 900; margin: 0; line-height: 1.1; text-transform: uppercase;">${(tx.unit || 'Main') === 'SAP' ? 'SAP CENTER - ARUNALU' : 'Arunalu Welfare Society'}</h1>
                    <div style="font-size: 8px; font-weight: bold; margin-top: 1px;">Galapitiyagama, Nikaweratiya</div>
                    <div style="font-size: 7px; font-weight: bold; color: #333; margin-bottom: 3px; text-transform: uppercase;">${(tx.unit || 'Main') === 'SAP' ? 'SAP CENTER PROJECT - WELFARE BRANCH' : 'Galapitiyagama Sanasa Society <br> Welfare Branch'}</div>
                    <div style="margin-top: 3px; font-weight: 900; text-decoration: underline; font-size: 13px; letter-spacing: 0.5px;">${title}</div>
                </div>
                
                ${statusTagHtml}

                <div style="display: flex; justify-content: space-between; margin-bottom: 1px; font-size: 9px;">
                    <span>Date:</span>
                    <span style="font-weight: 900;">${window.utils.formatDate(tx.date)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 1px; font-size: 9px;">
                    <span>Ref:</span>
                    <span style="font-weight: 900;">${tx.reference || '-'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 9px;">
                    <span>User:</span>
                    <span style="font-weight: 900;">${creatorUserName}</span>
                </div>

                <div style="border-top: 1px dashed black; border-bottom: 1px dashed black; padding: 3px 0; margin-bottom: 4px;">
                    <div style="margin-bottom: 1px; font-size: 8px;">${tx.type === 'Receipt' ? 'PAYER:' : 'PAYEE:'}</div>
                    <div style="font-weight: 900; font-size: 10.5px; line-height: 1.1;">${memberLabel}</div>
                </div>

                <div style="width: 100%; margin-bottom: 6px; font-size: 9.5px; border-bottom: 1px dashed #ccc; padding-bottom: 4px;">
                    ${linesHtml}
                </div>

                <div style="border-top: 1px solid black; padding: 4px 0; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 900; font-size: 11px;">TOTAL:</span>
                    <span style="font-weight: 900; font-size: 12px;">Rs. ${total.toFixed(2)}</span>
                </div>

                ${tx.description ? `
                <div style="margin-bottom: 8px; font-size: 9px;">
                    <span style="text-decoration: underline; display: inline-block; margin-bottom: 1px;">Memo:</span><br>
                    <span style="line-height: 1.1;">${tx.description}</span>
                </div>` : ''}

                <div style="margin-top: 45px; text-align: center; display: flex; justify-content: space-between; gap: 5px;">
                    <div style="border-top: 1px solid black; width: 48%; font-size: 8px; padding-top: 2px; font-weight: bold;">Member/Payer</div>
                    <div style="border-top: 1px solid black; width: 48%; font-size: 10px; padding-top: 4px; font-weight: bold;">${(tx.unit || 'Main') === 'SAP' ? 'Manager' : 'Treasurer'}</div>
                </div>

                ${arrearsHtml}

                <div style="text-align: center; margin-top: 16px; font-size: 10px; font-weight: bold; border-top: 1px dashed #ccc; padding-top: 6px;">
                    THANK YOU! - IRRASOFT SOLUTION
                </div>
                <div style="height: 150mm; display: flex; align-items: flex-end; justify-content: center; font-size: 4px; color: #eee; clear: both; box-sizing: border-box; padding-bottom: 2mm;">.</div>
            </div>
        `;
    }

    // Wait for all images (especially the QR code) to load before printing
    const images = printArea.getElementsByTagName('img');
    const imagePromises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve; // Continue even if one fails
        });
    });

    Promise.all(imagePromises).then(() => {
        setTimeout(() => {
            window.print();
        }, 300); // Small extra buffer for rendering
    });
};

window.viewTransaction = async (id) => {
    const tx = await db.transactions.get(id);
    if (!tx) return;

    const entries = await db.entries.where('transactionId').equals(id).toArray();
    const accounts = await db.accounts.toArray();
    const accMap = {};
    accounts.forEach(a => accMap[a.id] = a);

    let linesHtml = entries.map(e => `
        <tr class="border-b border-gray-100 last:border-0 hover:bg-gray-50">
            <td class="py-2.5 px-4 text-sm text-gray-700">${accMap[e.accountId]?.accountName || 'Unknown Accounts'}</td>
            <td class="py-2.5 px-4 text-right text-sm font-medium ${e.debit > 0 ? 'text-green-600' : 'text-gray-400'}">${e.debit > 0 ? e.debit.toFixed(2) : '-'}</td>
            <td class="py-2.5 px-4 text-right text-sm font-medium ${e.credit > 0 ? 'text-red-600' : 'text-gray-400'}">${e.credit > 0 ? e.credit.toFixed(2) : '-'}</td>
        </tr>
    `).join('');

    let memberLabel = tx.otherName || '-';
    if (tx.memberId) {
        const member = await db.members.get(tx.memberId);
        if (member) memberLabel = `${member.memberNo || ''} - ${member.name}`;
    }

    let arrearsSummary = '';
    if (tx.memberId && (tx.unit || 'Main') !== 'SAP' && window.currentUnit !== 'SAP') {
        const dues = await window.getMemberDues(tx.memberId, tx.date);
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
    }

    const html = `
        <div class="mb-6 flex justify-between items-start">
            <div>
                <h3 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <i class="fa-solid fa-file-lines text-brand-600"></i> Transaction Details
                </h3>
                <p class="text-sm text-gray-500 mt-1">Reference: ${tx.reference || 'N/A'}</p>
            </div>
            ${tx.status === 'Cancelled' ? '<span class="bg-red-100 text-red-700 font-bold px-3 py-1 rounded-lg text-sm border border-red-200">CANCELLED</span>' : '<span class="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-lg text-sm border border-green-200">ACTIVE</span>'}
        </div>

        ${arrearsSummary}

        <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div class="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <span class="block text-gray-500 mb-1">Date Logged</span>
                <span class="font-semibold text-gray-800">${window.utils.formatDate(tx.date)}</span>
            </div>
            <div class="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <span class="block text-gray-500 mb-1">Transaction Type</span>
                <span class="font-semibold text-gray-800">${tx.type}</span>
            </div>
            <div class="bg-gray-50 border border-gray-100 rounded-xl p-4 col-span-2">
                <span class="block text-gray-500 mb-1">Associated Member / Entity</span>
                <span class="font-semibold text-gray-800">${memberLabel}</span>
            </div>
            <div class="bg-gray-50 border border-gray-100 rounded-xl p-4 col-span-2">
                <span class="block text-gray-500 mb-1">Description</span>
                <span class="font-medium text-gray-800">${tx.description || '-'}</span>
            </div>
            ${tx.status === 'Cancelled' ? `
            <div class="bg-red-50 border border-red-100 rounded-xl p-4 col-span-2">
                <span class="block text-red-500 mb-1 font-semibold"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Cancellation Reason</span>
                <span class="font-bold text-red-700">${tx.cancelReason || 'No reason provided.'}</span>
            </div>
            ` : ''}
        </div>

        <div class="border border-gray-200 rounded-xl overflow-hidden mb-6">
            <table class="w-full text-left">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="py-2.5 px-4 font-semibold text-xs text-gray-600 uppercase tracking-wider">Account</th>
                        <th class="py-2.5 px-4 font-semibold text-xs text-gray-600 uppercase tracking-wider text-right">Debit (In)</th>
                        <th class="py-2.5 px-4 font-semibold text-xs text-gray-600 uppercase tracking-wider text-right">Credit (Out)</th>
                    </tr>
                </thead>
                <tbody>
                    ${linesHtml}
                </tbody>
            </table>
        </div>

        <div class="flex justify-end pr-1">
            <button onclick="window.utils.closeModal()" class="bg-gray-800 hover:bg-black text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-gray-500/30">
                Close Viewer
            </button>
        </div>
    `;
    window.utils.showModal(html);
};

window.cancelTransaction = async (id) => {
    const html = `
        <div class="text-center mb-6">
            <div class="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 text-2xl">
                <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-800">Cancel Transaction</h3>
            <p class="text-sm text-gray-500 mt-1">This action cannot be undone. All related financial impact will be fully voided while keeping an audit trail.</p>
        </div>
        <form onsubmit="window.submitCancellation(event, ${id})">
            <div class="mb-5 bg-red-50 border border-red-100 rounded-xl p-4">
                <label class="block text-sm font-semibold text-red-700 mb-2">Reason for Cancellation <span class="text-red-500">*</span></label>
                <textarea id="cancelReason" required rows="3" class="w-full px-4 py-3 rounded-lg border border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 outline-none transition-all resize-none shadow-sm" placeholder="To prevent fraud, you must state exactly why this transaction is being reversed..."></textarea>
            </div>
            <div class="flex justify-end gap-3">
                <button type="button" onclick="window.utils.closeModal()" class="px-5 py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors border border-gray-200">Keep Document</button>
                <button type="submit" class="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-red-500/30 flex items-center">
                    <i class="fa-solid fa-ban mr-2"></i> Confirm Cancel
                </button>
            </div>
        </form>
    `;
    window.utils.showModal(html);
};

window.submitCancellation = async (e, id) => {
    e.preventDefault();
    const reason = document.getElementById('cancelReason').value.trim();
    if (!reason || reason.length < 5) {
        window.utils.showToast("Please provide a more descriptive reason.", "error");
        return;
    }

    try {
        await db.transactions.update(id, {
            status: 'Cancelled',
            cancelReason: reason
        });

        // Find entries and zero them out to keep the audit trail fully intact
        const entries = await db.entries.where('transactionId').equals(id).toArray();
        for (let entry of entries) {
            await db.entries.update(entry.id, { debit: 0, credit: 0 });
        }

        window.utils.showToast("Transaction safely cancelled & audited.", "success");
        window.utils.closeModal();
        loadTransactionsTable();
        if (window.refreshCurrentView) window.refreshCurrentView();
    } catch (err) {
        console.error(err);
        window.utils.showToast("Error cancelling transaction.", "error");
    }
};
window.selectMemberInTx = async (memberId) => {
    const member = await db.members.get(memberId);
    if (!member) return;
    
    const input = document.getElementById('txPayerInput');
    if (input) {
        const val = `${member.memberNo} - ${member.name}`;
        input.value = val;
        window.handleTxMemberSelection(val);
    }
};

window.handleTxMemberSelection = async (value, type = null) => {
    const form = document.getElementById('txForm');
    const txType = type || form?.dataset.type || 'Receipt';
    
    const container = document.getElementById('duesSummaryContainer');
    if (!container || window.currentUnit === 'SAP' || txType === 'Payment') {
        if (container) container.classList.add('hidden');
        
        // Even if hiding dues, we still need to set the member ID for the transaction
        const members = await db.members.toArray();
        const lowerVal = value.trim().toLowerCase();
        const matched = members.find(m => {
            const mNo = String(m.memberNo || '').trim().toLowerCase();
            const mName = String(m.name || '').trim().toLowerCase();
            const combined = `${mNo} - ${mName}`;
            return combined === lowerVal || mNo === lowerVal || mName === lowerVal;
        });
        const hiddenIdInput = document.getElementById('txMemberId');
        if (hiddenIdInput) hiddenIdInput.value = matched ? matched.id : '';
        
        return;
    }

    const members = await db.members.toArray();
    const lowerVal = value.trim().toLowerCase();
    const matched = members.find(m => {
        const mNo = String(m.memberNo || '').trim().toLowerCase();
        const mName = String(m.name || '').trim().toLowerCase();
        const combined = `${mNo} - ${mName}`;
        return combined === lowerVal || mNo === lowerVal || mName === lowerVal;
    });

    const hiddenIdInput = document.getElementById('txMemberId');
    if (hiddenIdInput) hiddenIdInput.value = matched ? matched.id : '';

    if (!matched) {
        container.classList.add('hidden');
        return;
    }

    const txDate = document.getElementById('txDate')?.value; 
    const dues = await window.getMemberDues(matched.id, txDate);
    const totalDue = dues.entranceDue + dues.monthlyDue + dues.funeralDue + dues.arrearsDue;
    const entranceRate = await window.getEffectiveRate('ඇතුලත්වීමේ ගාස්තු ලැබීම්', txDate || new Date().toISOString().split('T')[0]);

    let warningHtml = '';
    // ... (rest of warning logic) ...
    if (dues.isInvalid) {
        warningHtml = `
            <div class="mb-3 bg-red-50 border border-red-200 rounded-xl p-4">
                <div class="flex items-center gap-3 text-red-700 mb-3">
                    <i class="fa-solid fa-circle-xmark text-xl animate-pulse"></i>
                    <div>
                        <div class="font-bold text-sm uppercase">සාමාජිකත්වය අහෝසි වී ඇත! (Membership Terminated)</div>
                        <div class="text-xs opacity-80">මාස 6කට වඩා හිඟ මුදල් පවතින බැවින් සාමාජිකත්වය අත්හිටුවා ඇත.</div>
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button type="button" onclick="window.renewMemberMembership(${matched.id})" class="bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 transition-colors text-[10px] uppercase tracking-wider shadow-md">
                        Renew as New Member (රු. ${entranceRate.toLocaleString()})
                    </button>
                    <button type="button" onclick="window.autoFillDues(${matched.id});" class="bg-amber-600 text-white py-2 rounded-lg font-bold hover:bg-amber-700 transition-colors text-[10px] uppercase tracking-wider shadow-md">
                        Pay Arrears (හිඟ මුදල් ගෙවන්න)
                    </button>
                </div>
                <div class="mt-2 text-[9px] text-center text-red-500 font-bold italic">
                    * හිඟ මුදල් පමණක් ගෙවා සාමාජිකත්වය රැක ගැනීමට සභාපතිතුමියගේ අනුමැතිය අවශ්‍ය වේ.
                </div>
            </div>
        `;
    } else if (dues.isNewMember && dues.entranceDue > 0) {
        warningHtml = `
            <div class="mb-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
                <div class="flex items-center gap-3 text-blue-700">
                    <i class="fa-solid fa-circle-info text-lg"></i>
                    <div>
                        <div class="font-bold text-[11px]">නව සාමාජික (New Member - Grace Period)</div>
                        <div class="text-[10px] opacity-80">ඇතුලත්වීමේ ගාස්තුව රු. ${entranceRate.toLocaleString()} මාස 6ක් තුල ගෙවා නිම කළ යුතුය. මරණාධාර ලබා ගැනීමට පෙර සම්පූර්ණ මුදල ගෙවිය යුතුය.</div>
                    </div>
                </div>
            </div>
        `;
    }

    if (totalDue > 0 || dues.isInvalid || dues.isNewMember) {
        container.innerHTML = `
            ${warningHtml}
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs">
                <div class="flex justify-between items-center mb-2">
                    <span class="font-bold text-amber-800"><i class="fa-solid fa-circle-exclamation mr-1"></i> Outstanding Dues</span>
                    <button type="button" onclick="window.autoFillDues(${matched.id})" class="bg-amber-600 text-white px-2 py-1 rounded hover:bg-amber-700 transition-colors font-bold">Auto-fill All</button>
                </div>
                <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-amber-700">
                    <span>ඇතුලත්වීමේ ගාස්තු ලැබීම්:</span><span class="text-right font-semibold">Rs. ${dues.entranceDue.toFixed(2)}</span>
                    <span>මාසික ගාස්තු ලැබීම්:</span><span class="text-right font-semibold">${dues.monthlyAdvance > 0 ? `<span class="text-green-600">Advance: Rs. ${dues.monthlyAdvance.toFixed(2)}</span>` : `Rs. ${dues.monthlyDue.toFixed(2)}`}</span>
                    <span>සුභ සාධක අරමුදල් ලැබීම් (${dues.funeralCount}):</span><span class="text-right font-semibold">Rs. ${dues.funeralDue.toFixed(2)}</span>
                    ${dues.arrearsDue > 0 ? `<span>පැරණි හිඟ මුදල්:</span><span class="text-right font-semibold text-red-600">Rs. ${dues.arrearsDue.toFixed(2)}</span>` : ''}
                </div>
            </div>
        `;
        container.classList.remove('hidden');
    } else {
        container.innerHTML = `<div class="text-xs text-green-600 font-medium"><i class="fa-solid fa-check-circle mr-1"></i> No outstanding dues found for this member.</div>`;
        container.classList.remove('hidden');
    }
};

window.renewMemberMembership = async (memberId) => {
    const today = new Date().toISOString().split('T')[0];
    const entranceRate = await window.getEffectiveRate('ඇතුලත්වීමේ ගාස්තු ලැබීම්', today);
    
    window.utils.showConfirm(
        "Renew Membership?", 
        `Are you sure you want to renew this membership? This will reset the join date to today and apply the Rs. ${entranceRate.toLocaleString()} new member fee.`,
        async () => {
            try {
                await db.members.update(memberId, {
                    joinedDate: today,
                    openingEntrancePaid: 0,
                    openingPaidUntil: ''
                });

                window.utils.showToast("Membership renewed as a New Member.");
                
                // Refresh the dues display
                const payerInput = document.getElementById('txPayerInput');
                if (payerInput) {
                    await window.handleTxMemberSelection(payerInput.value);
                    
                    // Specialized Auto-fill: Clear and add ONLY the entrance fee for renewal
                    const container = document.getElementById('txLinesContainer');
                    if (container) {
                        container.innerHTML = ''; // Clear everything
                        const accounts = await db.accounts.toArray();
                        const entranceAcc = accounts.find(a => a.accountName === 'ඇතුලත්වීමේ ගාස්තු ලැබීම්' || a.accountName.includes('Entrance Fee'));
                        if (entranceAcc) {
                            window.addTxLineWithAmount(entranceAcc.id, entranceRate);
                            window.calculateTxTotal();
                        }
                    }
                }
            } catch (err) {
                console.error(err);
                window.utils.showToast("Error renewing membership", "error");
            }
        },
        "Confirm Renew",
        "warning"
    );
};

window.getMemberDues = async (memberId, asOfDate = null) => {
    const member = await db.members.get(memberId);
    if (!member) return { entranceDue: 0, monthlyDue: 0, funeralDue: 0, funeralCount: 0, isInvalid: false, isNewMember: false, monthsBehind: 0 };

    const accounts = await db.accounts.toArray();
    const entranceAcc = accounts.find(a => a.accountName === 'ඇතුලත්වීමේ ගාස්තු ලැබීම්' || a.accountName.includes('Entrance Fee'));
    const monthlyAccs = accounts.filter(a => 
        a.accountName.includes('මාසික සාමාජික') || 
        a.accountName.includes('මාසික දායකත්ව') || 
        a.accountName.includes('දායක අරමුදල්') || 
        a.accountName.includes('සාමාජික අරමුදල්') ||
        a.accountName.includes('Monthly Contribution') || 
        a.accountName.includes('Monthly Membership')
    );
    const monthlyAccIds = monthlyAccs.map(a => a.id);
    const monthlyUnifiedAcc = monthlyAccs.find(a => a.accountName === 'මාසික සාමාජික මුදල් ලැබීම්' || a.accountName.includes('(Rs. 300)'));
    const funeralAcc = accounts.find(a => a.accountName === 'සුභ සාධක අරමුදල් ලැබීම්' || a.accountName.includes('Funeral Contribution (Rs. 200)'));

    const joinDateStr = member.joinedDate || '';
    const joinDate = new Date(joinDateStr);

    const entranceRate = await window.getEffectiveRate('ඇතුලත්වීමේ ගාස්තු ලැබීම්', joinDateStr || new Date().toISOString().split('T')[0]);
    let entrancePaid = 0;
    if (entranceAcc) {
        const entranceEntries = await db.entries.where('accountId').equals(entranceAcc.id).toArray();
        for (let e of entranceEntries) {
            const tx = await db.transactions.get(e.transactionId);
            // Rule: Only count payments made after or on the current joinDate
            if (tx && tx.memberId === memberId && tx.status !== 'Cancelled' && tx.date >= joinDateStr) {
                entrancePaid += (parseFloat(e.credit) || 0);
            }
        }
    }
    const entranceDue = Math.max(0, entranceRate - (entrancePaid + (member.openingEntrancePaid || 0)));

    // 2. Monthly Dues
    let monthlyDue = 0;
    let monthsBehind = 0; let monthlyAdvance = 0;
    if (joinDateStr !== '') {
        const lastPaidStr = member.openingPaidUntil; 
        let referenceDate = new Date(joinDateStr);

        if (lastPaidStr) {
            referenceDate = new Date(lastPaidStr + (lastPaidStr.length === 7 ? "-01" : ""));
        }

        const now = asOfDate ? new Date(asOfDate) : new Date();
        
        let totalMonthlyExpected = 0;
        let cursor = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);
        
        while (cursor.getFullYear() < now.getFullYear() || (cursor.getFullYear() === now.getFullYear() && cursor.getMonth() <= now.getMonth())) {
            const dateStr = cursor.toISOString().split('T')[0];
            const rate = await window.getEffectiveRate('මාසික සාමාජික මුදල් ලැබීම්', dateStr);
            totalMonthlyExpected += rate;
            cursor.setMonth(cursor.getMonth() + 1);
        }

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
        
        // Re-calculate actual months behind for status flags
        monthsBehind = (now.getFullYear() - referenceDate.getFullYear()) * 12 + (now.getMonth() - referenceDate.getMonth());
    }

    // 3. Funeral Dues
    let funeralDue = 0;
    let validFuneralCount = 0;
    if (joinDateStr !== '' && funeralAcc) {
        const gracePeriodEnd = new Date(joinDate);
        gracePeriodEnd.setMonth(gracePeriodEnd.getMonth() + 6);

        const allFunerals = await db.funerals.toArray();
        const calculationDate = asOfDate ? new Date(asOfDate) : new Date();
        
        // Paid Until filtering: If paid until YYYY-MM, funerals in that month and before are paid
        let paidUntilDate = null;
        if (member.openingPaidUntil) {
            if (member.openingPaidUntil.length === 7) {
                // Legacy month format
                const [py, pm] = member.openingPaidUntil.split('-').map(Number);
                paidUntilDate = new Date(py, pm, 0, 23, 59, 59);
            } else {
                // New date format
                paidUntilDate = new Date(member.openingPaidUntil);
                paidUntilDate.setHours(23, 59, 59, 999);
            }
        }

        const eligibleFunerals = allFunerals.filter(f => {
            const fDate = new Date(f.date);
            // Rule 1: Date must be on or before the receipt date (calculation date)
            if (fDate > calculationDate) return false;
            
            // Rule 2: Date must be after the member's "Paid Until" date
            if (paidUntilDate && fDate <= paidUntilDate) return false;

            // Existing Rule: Not for own home, and only funerals after 6 months of joining
            return f.memberId !== memberId && fDate > gracePeriodEnd;
        });

        validFuneralCount = eligibleFunerals.length;
        let totalFuneralExpected = 0;
        for (let f of eligibleFunerals) {
            const fRate = await window.getEffectiveRate('සුභ සාධක අරමුදල් ලැබීම්', f.date);
            totalFuneralExpected += fRate;
        }

        let funeralPaid = 0;
        const fEntries = await db.entries.where('accountId').equals(funeralAcc.id).toArray();
        for (let e of fEntries) {
            const tx = await db.transactions.get(e.transactionId);
            // Rule: Only count payments made after or on the current joinDate
            if (tx && tx.memberId === memberId && tx.status !== 'Cancelled' && tx.date >= joinDateStr) {
                funeralPaid += (parseFloat(e.credit) || 0);
            }
        }
        funeralDue = Math.max(0, totalFuneralExpected - funeralPaid);
    }

    // 4. Arrears Balance (Manual Entry + Recovery)
    const arrearsAcc = accounts.find(a => a.accountName === 'හිඟ මුදල් ලැබීම්' || a.accountName.includes('Arrears Recovery'));
    let arrearsPaid = 0;
    if (arrearsAcc) {
        const aEntries = await db.entries.where('accountId').equals(arrearsAcc.id).toArray();
        for (let e of aEntries) {
            const tx = await db.transactions.get(e.transactionId);
            if (tx && tx.memberId === memberId && tx.status !== 'Cancelled' && tx.date >= joinDateStr) {
                arrearsPaid += (parseFloat(e.credit) || 0);
            }
        }
    }
    const arrearsDue = Math.max(0, (member.openingArrears || 0) - arrearsPaid);

    // Membership Status Flags
    // 1. Either: If they registered/became a member and after 6 months, they have not fully paid their admission fees (ඇතුලත්වීමේ ගාස්තු).
    let monthsSinceJoin = 0;
    const calcDate = asOfDate ? new Date(asOfDate) : new Date();
    if (joinDateStr) {
        monthsSinceJoin = (calcDate.getFullYear() - joinDate.getFullYear()) * 12 + (calcDate.getMonth() - joinDate.getMonth());
    }

    // 2. Or: If they have not made any payments (kisima gewimak nokalahoth) within 6 months from their last transaction date.
    let lastPaymentDateStr = joinDateStr;
    if (member.openingPaidUntil) {
        lastPaymentDateStr = member.openingPaidUntil;
    }

    const memberTxs = await db.transactions.where('memberId').equals(memberId).toArray();
    const receipts = memberTxs.filter(t => 
        t.type === 'Receipt' && 
        t.status !== 'Cancelled' && 
        (!asOfDate || t.date <= asOfDate)
    );
    if (receipts.length > 0) {
        const dates = receipts.map(t => t.date);
        dates.sort();
        const maxTxDate = dates[dates.length - 1];
        if (!lastPaymentDateStr || maxTxDate > lastPaymentDateStr) {
            lastPaymentDateStr = maxTxDate;
        }
    }

    let monthsSinceLastPayment = 0;
    if (lastPaymentDateStr) {
        const lastPaymentDate = new Date(lastPaymentDateStr + (lastPaymentDateStr.length === 7 ? "-01" : ""));
        monthsSinceLastPayment = (calcDate.getFullYear() - lastPaymentDate.getFullYear()) * 12 + (calcDate.getMonth() - lastPaymentDate.getMonth());
    }

    const isInvalid = (monthsSinceJoin >= 6 && entranceDue > 0) || (monthsSinceLastPayment >= 6 && monthlyDue > 0);
    const sixMonthsAgo = new Date(calcDate);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const isNewMember = joinDate > sixMonthsAgo;

    return { 
        entranceDue, 
        monthlyDue, 
        funeralDue, 
        arrearsDue,
        funeralCount: validFuneralCount, monthlyAdvance,
        isInvalid,
        isNewMember,
        monthsBehind
    };
};

window.autoFillDues = async (memberId) => {
    const txDate = document.getElementById('txDate')?.value; const dues = await window.getMemberDues(memberId, txDate);
    const container = document.getElementById('txLinesContainer');
    if (!container) return;

    container.innerHTML = ''; // Clear existing lines

    const accounts = await db.accounts.toArray();
    const entranceAcc = accounts.find(a => a.accountName === 'ඇතුලත්වීමේ ගාස්තු ලැබීම්' || a.accountName.includes('Entrance Fee'));
    const monthlyAccs = accounts.filter(a => 
        a.accountName.includes('මාසික සාමාජික') || 
        a.accountName.includes('මාසික දායකත්ව') || 
        a.accountName.includes('දායක අරමුදල්') || 
        a.accountName.includes('සාමාජික අරමුදල්') ||
        a.accountName.includes('Monthly Contribution') || 
        a.accountName.includes('Monthly Membership')
    );
    const monthlyAccIds = monthlyAccs.map(a => a.id);
    const monthlyUnifiedAcc = monthlyAccs.find(a => a.accountName === 'මාසික සාමාජික මුදල් ලැබීම්' || a.accountName.includes('(Rs. 300)'));
    const funeralAcc = accounts.find(a => a.accountName === 'සුභ සාධක අරමුදල් ලැබීම්' || a.accountName.includes('Funeral Contribution (Rs. 200)'));

    if (dues.entranceDue > 0 && entranceAcc) {
        window.addTxLineWithAmount(entranceAcc.id, dues.entranceDue);
    }
    if (dues.monthlyDue > 0 && monthlyUnifiedAcc) {
        window.addTxLineWithAmount(monthlyUnifiedAcc.id, dues.monthlyDue);
    }
    if (dues.funeralDue > 0 && funeralAcc) {
        window.addTxLineWithAmount(funeralAcc.id, dues.funeralDue);
    }
    const arrearsAcc = accounts.find(a => a.accountName === 'හිඟ මුදල් ලැබීම්' || a.accountName.includes('Arrears Recovery'));
    if (dues.arrearsDue > 0 && arrearsAcc) {
        window.addTxLineWithAmount(arrearsAcc.id, dues.arrearsDue);
    }

    window.calculateTxTotal();
};

window.addTxLineWithAmount = (accountId, amount) => {
    window.addTxLineRow(accountId);
    const rows = document.getElementById('txLinesContainer').children;
    const lastRow = rows[rows.length - 1];
    const amountInput = lastRow.querySelector('input[name="lineAmount[]"]');
    if (amountInput) amountInput.value = amount;
};

// ==========================================
// 3-MONTH ALMSGIVING & ATAPIRIKARA REMINDERS
// ==========================================

window.calculate3MonthDate = (funeralDateStr) => {
    if (!funeralDateStr) return '';
    const parts = funeralDateStr.split('-');
    if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        const targetDate = new Date(y, m - 1 + 3, d);
        return targetDate.toISOString().split('T')[0];
    }
    const dt = new Date(funeralDateStr);
    dt.setMonth(dt.getMonth() + 3);
    return dt.toISOString().split('T')[0];
};

window.get3MonthAlmsgivingStatus = (funeralDateStr, atapirikaraGiven = false) => {
    if (!funeralDateStr) return { status: 'unknown', text: '-', daysDiff: 0, targetDate: '', isUrgent: false };
    const targetDateStr = window.calculate3MonthDate(funeralDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(targetDateStr);
    targetDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((targetDate - today) / (1000 * 60 * 60 * 24));

    if (atapirikaraGiven) {
        return {
            status: 'completed',
            targetDate: targetDateStr,
            daysDiff: diffDays,
            badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold',
            text: '✅ අටපිරිකර ලබාදී ඇත',
            isUrgent: false
        };
    }

    if (diffDays < 0) {
        return {
            status: 'overdue',
            targetDate: targetDateStr,
            daysDiff: diffDays,
            badgeClass: 'bg-red-100 text-red-800 border border-red-200 font-bold',
            text: `🚨 දින ${Math.abs(diffDays)} ක් පසුවී ඇත`,
            isUrgent: true
        };
    } else if (diffDays === 0) {
        return {
            status: 'today',
            targetDate: targetDateStr,
            daysDiff: diffDays,
            badgeClass: 'bg-red-600 text-white border border-red-700 font-black animate-pulse',
            text: '⚠️ අද දිනට යෙදී ඇත (Today!)',
            isUrgent: true
        };
    } else if (diffDays <= 7) {
        return {
            status: 'urgent',
            targetDate: targetDateStr,
            daysDiff: diffDays,
            badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300 font-black',
            text: `🔔 තව දින ${diffDays} යි (සතියක් තුළ)`,
            isUrgent: true
        };
    } else if (diffDays <= 14) {
        return {
            status: 'upcoming',
            targetDate: targetDateStr,
            daysDiff: diffDays,
            badgeClass: 'bg-blue-100 text-blue-800 border border-blue-200 font-semibold',
            text: `📅 තව දින ${diffDays} යි (සති 2ක් තුළ)`,
            isUrgent: true
        };
    } else {
        return {
            status: 'future',
            targetDate: targetDateStr,
            daysDiff: diffDays,
            badgeClass: 'bg-gray-100 text-gray-700 border border-gray-200',
            text: `තව දින ${diffDays} යි`,
            isUrgent: false
        };
    }
};

window.toggleAtapirikaraGiven = async (funeralId) => {
    const f = await db.funerals.get(funeralId);
    if (!f) return;
    const newState = !f.atapirikaraGiven;
    await db.funerals.update(funeralId, {
        atapirikaraGiven: newState,
        atapirikaraGivenDate: newState ? new Date().toISOString().split('T')[0] : null
    });
    window.utils.showToast(newState ? "අටපිරිකර ලබාදුන් බව සටහන් විය (Marked as Given)" : "අටපිරිකර ලබාදීම Pending ලෙස සටහන් විය");
    window.openFuneralModal();
    if (window.refreshCurrentView) window.refreshCurrentView();
};

// Funeral Management
window._funeralMembersCache = [];

window.handleFuneralMemberSelection = (value) => {
    const hidden = document.getElementById('fMember');
    if (!hidden) return;
    const val = (value || '').trim().toLowerCase();
    const match = window._funeralMembersCache?.find(m => {
        const mNo = String(m.memberNo || '').trim().toLowerCase();
        const mName = String(m.name || '').trim().toLowerCase();
        const combined = `${mNo} - ${mName}`;
        return combined === val || mNo === val || mName === val;
    });
    hidden.value = match ? match.id : '';
};

window.openFuneralModal = async () => {
    const members = await db.members.toArray();
    window._funeralMembersCache = members;
    const memDatalistOptions = members.map(m => `<option value="${m.memberNo ? m.memberNo + ' - ' : ''}${m.name}"></option>`).join('');

    const funerals = (await db.funerals.toArray()).sort((a, b) => new Date(b.date) - new Date(a.date));

    const funeralRows = funerals.map(f => {
        const m = members.find(mem => mem.id === f.memberId);
        const st = window.get3MonthAlmsgivingStatus(f.date, f.atapirikaraGiven);
        return `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 text-xs font-bold text-gray-700 whitespace-nowrap">${window.utils.formatDate(f.date)}</td>
                <td class="px-4 py-3 text-xs font-black text-gray-900">${m ? `${m.memberNo ? m.memberNo + ' - ' : ''}${m.name}` : 'Unknown'}</td>
                <td class="px-4 py-3 text-xs text-gray-600">${f.description || '-'}</td>
                <td class="px-4 py-3 text-xs whitespace-nowrap">
                    <div class="font-bold text-gray-800">${window.utils.formatDate(st.targetDate)}</div>
                    <div class="inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 ${st.badgeClass}">${st.text}</div>
                </td>
                <td class="px-4 py-3 text-center whitespace-nowrap">
                    <button type="button" onclick="window.toggleAtapirikaraGiven(${f.id})" class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${f.atapirikaraGiven ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'} flex items-center gap-1.5 mx-auto shadow-sm" title="අටපිරිකර ලබාදීම සලකුණු කරන්න">
                        <i class="fa-solid ${f.atapirikaraGiven ? 'fa-circle-check text-emerald-600' : 'fa-clock text-amber-600'}"></i>
                        <span>${f.atapirikaraGiven ? 'ලබාදී ඇත' : 'ලබාදීමට ඇත'}</span>
                    </button>
                </td>
                <td class="px-4 py-3 text-right whitespace-nowrap">
                    <button onclick="window.editFuneral(${f.id})" class="text-brand-500 hover:text-brand-700 transition-colors mr-3 p-1" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button onclick="window.deleteFuneral(${f.id})" class="text-red-400 hover:text-red-600 transition-colors p-1" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');

    const html = `
        <div class="flex justify-between items-center mb-5">
            <div>
                <h3 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <i class="fa-solid fa-hands-praying text-amber-600"></i> Funeral Events Log
                </h3>
                <p class="text-xs text-gray-500 mt-0.5">මරණ සිදුවීම් ලියාපදිංචි කිරීම සහ කළමනාකරණය</p>
            </div>
            <button onclick="window.showAddFuneralForm()" class="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-gray-400/30 flex items-center gap-1.5 transition-all">
                <i class="fa-solid fa-plus"></i> Record New Event
            </button>
        </div>

        <div id="funeralFormContainer" class="hidden mb-6 bg-gray-50 p-5 rounded-2xl border border-gray-200 animate-fade-in">
            <form onsubmit="window.saveFuneral(event)" class="space-y-4">
                <input type="hidden" id="fId" value="">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">මරණ දිනය (Event Date) <span class="text-red-500">*</span></label>
                        <input type="date" id="fDate" required value="${new Date().toISOString().split('T')[0]}" class="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-brand-500 outline-none text-xs bg-white">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">සාමාජිකයා සොයන්න (Search / Select Member) <span class="text-red-500">*</span></label>
                        <input list="funeralMembersDatalist" id="fMemberInput" required oninput="window.handleFuneralMemberSelection(this.value)" onchange="window.handleFuneralMemberSelection(this.value)" class="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-brand-500 outline-none text-xs bg-white" placeholder="නම හෝ අංකය Type කරන්න..." autocomplete="off">
                        <input type="hidden" id="fMember" value="" required>
                        <datalist id="funeralMembersDatalist">
                            ${memDatalistOptions}
                        </datalist>
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">විස්තරය / ඥාතීත්වය (Description / Note)</label>
                    <textarea id="fDesc" rows="2" class="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-brand-500 outline-none text-xs resize-none bg-white" placeholder="උදා: පියා / මව / නැන්දම්මා..."></textarea>
                </div>
                <div class="flex items-center gap-2">
                    <label class="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                        <input type="checkbox" id="fAtapirikaraGiven" class="rounded text-emerald-600 focus:ring-emerald-500">
                        <span>තුන්මාසේ දානයට අටපිරිකර ලබා දී ඇත (Atapirikara Given)</span>
                    </label>
                </div>
                <div class="flex justify-end gap-2 text-xs pt-2">
                    <button type="button" onclick="window.showAddFuneralForm(false)" class="text-gray-500 font-bold px-4 py-2 hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button type="submit" id="fSubmitBtn" class="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-xl font-bold shadow-md shadow-brand-500/30">Save Event Record</button>
                </div>
            </form>
        </div>

        <div class="max-h-[55vh] overflow-auto rounded-xl border border-gray-200 custom-scrollbar">
            <table class="w-full text-left">
                <thead class="bg-gray-100 sticky top-0 text-gray-700 text-[11px] uppercase tracking-wider">
                    <tr>
                        <th class="px-4 py-3 font-bold">මරණ දිනය</th>
                        <th class="px-4 py-3 font-bold">සාමාජික නිවස</th>
                        <th class="px-4 py-3 font-bold">විස්තරය</th>
                        <th class="px-4 py-3 font-bold">තුන්මාසේ දාන දිනය</th>
                        <th class="px-4 py-3 font-bold text-center">අටපිරිකර තත්ත්වය</th>
                        <th class="px-4 py-3 font-bold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 bg-white text-xs">
                    ${funeralRows || '<tr><td colspan="6" class="text-center py-8 text-gray-400 italic">මරණ ලේඛන දත්ත ඇතුලත් කර නැත.</td></tr>'}
                </tbody>
            </table>
        </div>
    `;

    window.utils.showModal(html);
};

window.showAddFuneralForm = (show = true) => {
    const el = document.getElementById('funeralFormContainer');
    if (!el) return;
    
    if (show) {
        document.getElementById('fId').value = '';
        const memberInput = document.getElementById('fMemberInput');
        if (memberInput) memberInput.value = '';
        const hiddenMember = document.getElementById('fMember');
        if (hiddenMember) hiddenMember.value = '';
        const chk = document.getElementById('fAtapirikaraGiven');
        if (chk) chk.checked = false;
        document.getElementById('fSubmitBtn').textContent = 'Save Event Record';
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
    }
};

window.editFuneral = async (id) => {
    const f = await db.funerals.get(id);
    if (!f) return;

    if (!document.getElementById('funeralFormContainer')) {
        await window.openFuneralModal();
    }

    window.showAddFuneralForm(true);
    document.getElementById('fId').value = f.id;
    document.getElementById('fDate').value = f.date;
    const m = window._funeralMembersCache?.find(mem => mem.id === f.memberId) || (await db.members.get(f.memberId));
    const memberInput = document.getElementById('fMemberInput');
    if (memberInput) {
        memberInput.value = m ? (m.memberNo ? m.memberNo + ' - ' : '') + m.name : '';
    }
    document.getElementById('fMember').value = f.memberId;
    document.getElementById('fDesc').value = f.description || '';
    const chk = document.getElementById('fAtapirikaraGiven');
    if (chk) chk.checked = !!f.atapirikaraGiven;
    document.getElementById('fSubmitBtn').textContent = 'Update Event Record';
};

window.saveFuneral = async (e) => {
    e.preventDefault();
    try {
        const id = document.getElementById('fId').value;
        const date = document.getElementById('fDate').value;
        let memberId = parseInt(document.getElementById('fMember').value);
        
        // If hidden fMember is empty, attempt to resolve from fMemberInput
        if (!memberId) {
            const typedVal = document.getElementById('fMemberInput')?.value;
            if (typedVal) {
                window.handleFuneralMemberSelection(typedVal);
                memberId = parseInt(document.getElementById('fMember').value);
            }
        }

        if (!memberId) {
            window.utils.showToast("කරුණාකර සාමාජිකයෙකු තෝරන්න (Select a valid member)", "error");
            return;
        }

        const description = document.getElementById('fDesc').value;
        const atapirikaraGiven = document.getElementById('fAtapirikaraGiven')?.checked || false;

        const data = { date, memberId, description, atapirikaraGiven };

        if (id) {
            await db.funerals.update(parseInt(id), data);
            window.utils.showToast("Funeral event updated.");
        } else {
            await db.funerals.add(data);
            window.utils.showToast("Funeral event logged.");
        }
        
        window.openFuneralModal(); // Refresh
        if (typeof window.loadFuneralsViewTable === 'function') window.loadFuneralsViewTable();
        if (window.refreshCurrentView) window.refreshCurrentView();
    } catch (err) {
        console.error(err);
        window.utils.showToast("Error saving event", "error");
    }
};

window.deleteFuneral = async (id) => {
    window.utils.showConfirm(
        "Delete Record?", 
        "Remove this funeral record?",
        async () => {
            await db.funerals.delete(id);
            window.openFuneralModal();
            if (typeof window.loadFuneralsViewTable === 'function') window.loadFuneralsViewTable();
            if (window.refreshCurrentView) window.refreshCurrentView();
        },
        "Confirm Remove",
        "warning"
    );
};

// ==========================================
// FUNERALS & 3-MONTH REMINDERS FULL VIEW
// ==========================================

window.renderFuneralsView = async () => {
    return `
        <div class="glass-panel p-6 rounded-2xl h-full flex flex-col">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h3 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <i class="fa-solid fa-hands-praying text-rose-500"></i> මරණ ලේඛනය සහ තුන්මාසේ දාන (Funerals & 3-Month Reminders)
                    </h3>
                    <p class="text-sm text-gray-500">මරණ සිදුවීම් ලියාපදිංචිය, තුන්මාසයේ දානමය පින්කම් සහ අටපිරිකර සිහිකැඳවීම් කළමනාකරණය</p>
                </div>
            </div>

            <!-- Active 3-Month Reminders Banner -->
            <div id="funeralViewRemindersContainer" class="mb-6">
                <!-- Injected by mountFuneralsView -->
            </div>

            <!-- Quick Filters & Search -->
            <div class="mb-6 flex flex-wrap gap-3 items-center">
                <div class="flex-1 min-w-[200px] relative">
                    <i class="fa-solid fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                    <input type="text" id="funeralSearch" placeholder="සාමාජික නම, අංකය හෝ විස්තරය සොයන්න..." class="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:border-brand-500 bg-white/70 text-xs outline-none shadow-sm">
                </div>
                <select id="funeralFilterStatus" onchange="window.loadFuneralsViewTable()" class="px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-500 bg-white/70 text-xs font-medium outline-none shadow-sm">
                    <option value="all">සියලුම මරණ (All Funerals)</option>
                    <option value="upcoming">🔔 ඉදිරි තුන්මාසේ දාන (Upcoming 3-Month)</option>
                    <option value="pending">⏳ අටපිරිකර ලබාදීමට ඇති (Pending Atapirikara)</option>
                    <option value="given">✅ අටපිරිකර ලබාදුන් (Given Atapirikara)</option>
                </select>
            </div>

            <!-- Table -->
            <div class="flex-1 overflow-auto rounded-xl border border-gray-100 bg-white/50 custom-scrollbar">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-gray-50/80 sticky top-0 backdrop-blur-md z-10 text-gray-600 text-xs font-bold uppercase tracking-wider">
                        <tr>
                            <th class="px-6 py-4 border-b border-gray-100">මරණ දිනය</th>
                            <th class="px-6 py-4 border-b border-gray-100">සාමාජික නිවස</th>
                            <th class="px-6 py-4 border-b border-gray-100">විස්තරය</th>
                            <th class="px-6 py-4 border-b border-gray-100">තුන්මාසේ දාන දිනය</th>
                            <th class="px-6 py-4 border-b border-gray-100 text-center">අටපිරිකර තත්ත්වය</th>
                            <th class="px-6 py-4 border-b border-gray-100 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="funeralsViewTableBody" class="divide-y divide-gray-100 text-xs">
                        <!-- Populated by JS -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
};

window.mountFuneralsView = async () => {
    window.loadFuneralsViewTable();

    const searchInput = document.getElementById('funeralSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            window.loadFuneralsViewTable();
        });
    }
};

window.loadFuneralsViewTable = async () => {
    const tbody = document.getElementById('funeralsViewTableBody');
    const remindersContainer = document.getElementById('funeralViewRemindersContainer');
    if (!tbody) return;

    const searchQuery = (document.getElementById('funeralSearch')?.value || '').toLowerCase().trim();
    const filterStatus = document.getElementById('funeralFilterStatus')?.value || 'all';

    const members = await db.members.toArray();
    let funerals = (await db.funerals.toArray()).sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate status for all funerals
    const funeralsWithInfo = funerals.map(f => {
        const m = members.find(mem => mem.id === f.memberId);
        const st = window.get3MonthAlmsgivingStatus(f.date, f.atapirikaraGiven);
        return { funeral: f, member: m, st };
    });

    // Reminders Banner
    const upcomingReminders = funeralsWithInfo.filter(item => item.st.isUrgent && !item.funeral.atapirikaraGiven);
    if (remindersContainer) {
        if (upcomingReminders.length > 0) {
            remindersContainer.innerHTML = `
                <div class="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-2 border-amber-300 rounded-2xl p-4 shadow-sm animate-fade-in">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-2 text-amber-900 font-black text-xs">
                            <div class="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs animate-bounce shadow-sm">
                                <i class="fa-solid fa-bell"></i>
                            </div>
                            <span>ඉදිරි සති 2 ඇතුලත තුන්මාසේ දානමය පින්කම් සහ අටපිරිකර සිහිකැඳවීම් (Active Reminders)</span>
                        </div>
                        <span class="bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full text-[10px] font-black">${upcomingReminders.length} ක් ඇත</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        ${upcomingReminders.map(item => `
                            <div class="bg-white p-3 rounded-xl border border-amber-200 shadow-sm flex justify-between items-center gap-2">
                                <div>
                                    <div class="font-bold text-gray-900 text-xs">${item.member ? `${item.member.memberNo} - ${item.member.name}` : 'Unknown Member'}</div>
                                    <div class="text-[11px] text-gray-500 font-medium">මරණ දිනය: <strong>${window.utils.formatDate(item.funeral.date)}</strong> &rarr; තුන්මාසේ: <strong class="text-amber-800">${window.utils.formatDate(item.st.targetDate)}</strong></div>
                                    <div class="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold ${item.st.badgeClass}">${item.st.text}</div>
                                </div>
                                <button type="button" onclick="window.toggleAtapirikaraGivenInView(${item.funeral.id})" class="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1">
                                    <i class="fa-solid fa-check"></i> අටපිරිකර ලබාදුන්නා
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            remindersContainer.classList.remove('hidden');
        } else {
            remindersContainer.innerHTML = '';
            remindersContainer.classList.add('hidden');
        }
    }

    // Apply Filter
    let filtered = funeralsWithInfo;
    if (filterStatus === 'upcoming') {
        filtered = filtered.filter(item => item.st.isUrgent && !item.funeral.atapirikaraGiven);
    } else if (filterStatus === 'pending') {
        filtered = filtered.filter(item => !item.funeral.atapirikaraGiven);
    } else if (filterStatus === 'given') {
        filtered = filtered.filter(item => item.funeral.atapirikaraGiven);
    }

    // Apply Search
    if (searchQuery) {
        filtered = filtered.filter(item => {
            const mName = (item.member?.name || '').toLowerCase();
            const mNo = (item.member?.memberNo || '').toString().toLowerCase();
            const desc = (item.funeral.description || '').toLowerCase();
            return mName.includes(searchQuery) || mNo.includes(searchQuery) || desc.includes(searchQuery);
        });
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-gray-400 italic">මරණ හෝ සිහිකැඳවීම් වාර්තා සොයාගත නොහැක.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(item => {
        const f = item.funeral;
        const m = item.member;
        const st = item.st;
        return `
            <tr class="hover:bg-brand-50/40 transition-colors">
                <td class="px-6 py-4 font-bold text-gray-700 whitespace-nowrap">${window.utils.formatDate(f.date)}</td>
                <td class="px-6 py-4 font-black text-gray-900">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">
                            ${(m?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div>${m ? m.name : 'Unknown Member'}</div>
                            ${m?.memberNo ? `<div class="text-[10px] text-gray-400 font-bold">No: ${m.memberNo}</div>` : ''}
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-gray-600">${f.description || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="font-black text-gray-800">${window.utils.formatDate(st.targetDate)}</div>
                    <div class="inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 ${st.badgeClass}">${st.text}</div>
                </td>
                <td class="px-6 py-4 text-center whitespace-nowrap">
                    <button type="button" onclick="window.toggleAtapirikaraGivenInView(${f.id})" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${f.atapirikaraGiven ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'} flex items-center gap-1.5 mx-auto shadow-sm" title="අටපිරිකර ලබාදීම සලකුණු කරන්න">
                        <i class="fa-solid ${f.atapirikaraGiven ? 'fa-circle-check text-emerald-600' : 'fa-clock text-amber-600'}"></i>
                        <span>${f.atapirikaraGiven ? 'ලබාදී ඇත (Given)' : 'ලබාදීමට ඇත (Pending)'}</span>
                    </button>
                </td>
                <td class="px-6 py-4 text-right whitespace-nowrap space-x-1">
                    <button onclick="window.editFuneral(${f.id})" class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors p-1" title="Edit"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="window.deleteFuneral(${f.id})" class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors p-1" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
};

window.toggleAtapirikaraGivenInView = async (funeralId) => {
    const f = await db.funerals.get(funeralId);
    if (!f) return;
    const newState = !f.atapirikaraGiven;
    await db.funerals.update(funeralId, {
        atapirikaraGiven: newState,
        atapirikaraGivenDate: newState ? new Date().toISOString().split('T')[0] : null
    });
    window.utils.showToast(newState ? "අටපිරිකර ලබාදුන් බව සටහන් විය (Marked as Given)" : "අටපිරිකර ලබාදීම Pending ලෙස සටහන් විය");
    window.loadFuneralsViewTable();
    if (window.updateFuneralsNavBadge) window.updateFuneralsNavBadge();
};

// ==========================================
// ADVANCE LOAN (අත්තිකාරම් ණය) SETTLEMENT & RENEWAL
// ==========================================

window.getAccountBalance = async (accountId) => {
    if (!accountId) return 0;
    const acc = await db.accounts.get(parseInt(accountId));
    if (!acc) return 0;
    const entries = await db.entries.where('accountId').equals(acc.id).toArray();
    let debit = 0;
    let credit = 0;
    for (let e of entries) {
        const tx = await db.transactions.get(e.transactionId);
        if (tx && tx.status !== 'Cancelled') {
            debit += parseFloat(e.debit) || 0;
            credit += parseFloat(e.credit) || 0;
        }
    }
    if (acc.accountType === 'Asset' || acc.accountType === 'Expense') {
        return debit - credit;
    } else {
        return credit - debit;
    }
};

window.openAdvanceLoanModal = async (preselectedAccId = null, initialTab = 'settle') => {
    const accounts = (await db.accounts.toArray()).filter(a => (a.unit || 'Main') === window.currentUnit);
    
    // Loan Accounts (Liability accounts, specially ones with 'අත්තිකාරම්' or 'ණය' or 'Loan')
    const loanAccounts = accounts.filter(a => a.accountType === 'Liability' || (a.accountName && (a.accountName.includes('අත්තිකාරම්') || a.accountName.includes('ණය') || a.accountName.toLowerCase().includes('loan'))));
    
    // Cash & Bank accounts (Assets for payments)
    const cashBankAccounts = accounts.filter(a =>
        a.accountType === 'Asset' &&
        (a.accountName.toLowerCase().includes('cash') || a.accountName.toLowerCase().includes('bank') || a.accountName.includes('මුදල් පොත') || a.accountName.includes('තැන්පතු') || a.category === 'Current Asset')
    );

    // Fixed Deposit Accounts (Assets)
    const fdAccounts = accounts.filter(a =>
        a.accountType === 'Asset' &&
        (a.accountName.includes('තැන්පතු') || a.accountName.includes('තැන්පත්') || a.accountName.includes('ස්ථාවර') || a.accountName.toLowerCase().includes('deposit') || a.accountName.toLowerCase().includes('fixed'))
    );

    // Interest Expense Accounts
    let intExpenseAccounts = accounts.filter(a => a.accountType === 'Expense');
    let defaultIntExpAcc = accounts.find(a => a.accountName === 'ණය පොලී වියදම්' || a.accountName.includes('පොලී වියදම්'));
    if (!defaultIntExpAcc && intExpenseAccounts.length > 0) defaultIntExpAcc = intExpenseAccounts[0];

    // FD Interest Income Accounts
    let fdIncomeAccounts = accounts.filter(a => a.accountType === 'Income');
    let defaultFdIncAcc = accounts.find(a => a.accountName === 'ස්ථාවර තැන්පතු පොලී ආදායම' || a.accountName.includes('පොලී ආදායම'));
    if (!defaultFdIncAcc && fdIncomeAccounts.length > 0) defaultFdIncAcc = fdIncomeAccounts[0];

    const loanAccOptions = loanAccounts.map(a => `<option value="${a.id}" ${preselectedAccId == a.id ? 'selected' : ''}>${a.accountName}</option>`).join('');
    const cashBankOptions = cashBankAccounts.map(a => `<option value="${a.id}">${a.accountName}</option>`).join('');
    const fdOptions = fdAccounts.map(a => `<option value="${a.id}">${a.accountName}</option>`).join('');
    const intExpOptions = intExpenseAccounts.map(a => `<option value="${a.id}" ${defaultIntExpAcc && defaultIntExpAcc.id === a.id ? 'selected' : ''}>${a.accountName}</option>`).join('');
    const fdIncOptions = fdIncomeAccounts.map(a => `<option value="${a.id}" ${defaultFdIncAcc && defaultFdIncAcc.id === a.id ? 'selected' : ''}>${a.accountName}</option>`).join('');

    window.loanGlobalCashBankOptions = cashBankAccounts.map(a => `<option value="${a.id}">${a.accountName}</option>`).join('');

    const defaultDate = new Date().toISOString().split('T')[0];

    const html = `
        <div class="space-y-4">
            <!-- Modal Header -->
            <div class="flex items-center justify-between pb-3 border-b border-gray-100">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl shadow-sm">
                        <i class="fa-solid fa-hand-holding-dollar"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-gray-800 leading-tight">ස්ථාවර තැන්පතු අත්තිකාරම් ණය</h3>
                        <p class="text-xs text-gray-500">ණය පියවීම සහ වාර්ෂිකව අලුත් කිරීම (Settlement & Renewal)</p>
                    </div>
                </div>
            </div>

            <!-- Tab Navigation -->
            <div class="flex bg-gray-100 p-1 rounded-xl">
                <button type="button" id="tabBtnSettle" onclick="window.switchLoanTab('settle')" class="flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${initialTab === 'settle' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'} flex items-center justify-center gap-2">
                    <i class="fa-solid fa-check-to-slot"></i> 1. ණය පියවීම (Loan Settlement)
                </button>
                <button type="button" id="tabBtnRenew" onclick="window.switchLoanTab('renew')" class="flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${initialTab === 'renew' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'} flex items-center justify-center gap-2">
                    <i class="fa-solid fa-arrows-rotate"></i> 2. ණය අලුත් කිරීම (Loan Renewal)
                </button>
            </div>

            <!-- ============================================== -->
            <!-- TAB 1: ණය පියවීම (LOAN SETTLEMENT) -->
            <!-- ============================================== -->
            <div id="loanTabSettle" class="${initialTab === 'settle' ? '' : 'hidden'} space-y-4">
                <form id="loanSettleForm" class="space-y-4" onsubmit="window.saveAdvanceLoanSettlement(event, false)">
                    <div class="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 space-y-3">
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">අත්තිකාරම් ණය ගිණුම (Advance Loan Account) <span class="text-red-500">*</span></label>
                            <select id="lsLoanAcc" required onchange="window.handleLoanAccountChange(this.value, 'settle')" class="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none bg-white font-medium text-sm">
                                <option value="" disabled ${!preselectedAccId ? 'selected' : ''}>තෝරන්න (Select Loan Account)</option>
                                ${loanAccOptions}
                            </select>
                        </div>
                        <div class="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-amber-100 text-xs">
                            <span class="text-gray-500 font-medium">දැනට පවතින ණය ශේෂය (Current Outstanding):</span>
                            <span id="lsCurrentBalDisplay" class="font-black text-amber-700 text-sm">Rs. 0.00</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">දිනය (Date) <span class="text-red-500">*</span></label>
                            <input type="date" id="lsDate" required value="${defaultDate}" class="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-amber-500 outline-none bg-white text-sm">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">යොමු අංකය (Reference No)</label>
                            <input type="text" id="lsRef" class="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-amber-500 outline-none bg-white text-sm font-bold text-amber-600" placeholder="e.g. LN-SET-000001">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">පියවන ණය මුදල (Principal Amount) <span class="text-red-500">*</span></label>
                            <div class="relative">
                                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">Rs.</span>
                                <input type="number" id="lsPrincipal" required step="0.01" min="0.01" oninput="window.updateLoanSettleSummary(true)" placeholder="0.00" class="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 focus:border-amber-500 outline-none text-right font-bold text-gray-800 text-sm bg-white">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">ගෙවන පොලී මුදල (Interest Amount)</label>
                            <div class="relative">
                                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">Rs.</span>
                                <input type="number" id="lsInterest" step="0.01" min="0.00" value="0.00" oninput="window.updateLoanSettleSummary(true)" placeholder="0.00" class="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 focus:border-amber-500 outline-none text-right font-bold text-red-600 text-sm bg-white">
                            </div>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">පොලී වියදම් ගිණුම (Interest Account)</label>
                        <select id="lsIntAcc" class="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-amber-500 outline-none bg-white text-xs">
                            ${intExpOptions}
                        </select>
                    </div>

                    <!-- MULTIPLE PAYMENT SOURCE ACCOUNTS SECTION -->
                    <div class="border border-amber-200 bg-amber-50/40 rounded-xl p-3.5 space-y-2.5">
                        <div class="flex justify-between items-center">
                            <label class="block text-xs font-bold text-gray-800">
                                <i class="fa-solid fa-wallet text-amber-600 mr-1"></i> ගෙවීම් සිදුකරන ගිණුම් (Paid From Accounts) <span class="text-red-500">*</span>
                            </label>
                            <button type="button" onclick="window.addLoanPaymentSourceRow()" class="text-[11px] text-amber-800 font-bold bg-amber-200/80 hover:bg-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors border border-amber-300 shadow-sm">
                                <i class="fa-solid fa-plus"></i> තවත් ගිණුමක් (Add Account)
                            </button>
                        </div>
                        <p class="text-[10px] text-gray-500">ගෙවීම් සිදුකරන්නේ ගිණුම් කිහිපයකින් නම් "තවත් ගිණුමක්" ක්ලික් කර අදාළ ගිණුම් සහ මුදල් වෙන් කරන්න.</p>
                        
                        <div id="lsPaymentSourcesContainer" class="space-y-2 pt-1">
                            <!-- Populated dynamically with at least 1 row -->
                        </div>
                        
                        <div class="flex justify-between items-center bg-white px-3 py-1.5 rounded-lg border border-amber-100 text-xs mt-2">
                            <span class="text-gray-500 font-medium">මුළු වෙන්කළ ගෙවීම් ශේෂය (Total Allocated):</span>
                            <span id="lsAllocatedTotalDisplay" class="font-black text-gray-800">Rs. 0.00</span>
                        </div>
                        <div id="lsAllocationDiffAlert" class="hidden text-[11px] font-bold text-red-600 bg-red-50 px-2.5 py-1.5 rounded border border-red-200"></div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">විස්තරය (Narration / Description)</label>
                        <input type="text" id="lsDesc" class="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-amber-500 outline-none bg-white text-xs" placeholder="අත්තිකාරම් ණය සහ පොලිය පියවීම...">
                    </div>

                    <!-- Live Calculation Summary -->
                    <div class="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1.5 text-xs">
                        <div class="flex justify-between text-gray-600">
                            <span>පියවන ණය මුදල (Principal Paid):</span>
                            <span class="font-bold" id="lsSumPrincipal">Rs. 0.00</span>
                        </div>
                        <div class="flex justify-between text-gray-600">
                            <span>ගෙවන පොලී මුදල (Interest Paid):</span>
                            <span class="font-bold text-red-600" id="lsSumInterest">Rs. 0.00</span>
                        </div>
                        <div class="flex justify-between text-sm font-black text-gray-900 border-t border-gray-200 pt-1.5">
                            <span>ගෙවිය යුතු මුළු මුදල (Total Outflow Required):</span>
                            <span class="text-amber-700" id="lsSumTotal">Rs. 0.00</span>
                        </div>
                    </div>

                    <div class="pt-3 border-t border-gray-100 flex flex-wrap justify-end gap-2">
                        <button type="button" onclick="window.utils.closeModal()" class="px-4 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-100 text-xs">Cancel</button>
                        <button type="button" onclick="window.saveAdvanceLoanSettlement(event, true)" class="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-lg font-bold transition-all shadow-md text-xs flex items-center gap-1.5">
                            <i class="fa-solid fa-print"></i> Save & Print
                        </button>
                        <button type="submit" class="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg font-bold transition-all shadow-md shadow-amber-500/30 text-xs flex items-center gap-1.5">
                            <i class="fa-solid fa-check"></i> Save Settlement
                        </button>
                    </div>
                </form>
            </div>

            <!-- ============================================== -->
            <!-- TAB 2: ණය අලුත් කිරීම (LOAN RENEWAL / ROLLOVER) -->
            <!-- ============================================== -->
            <div id="loanTabRenew" class="${initialTab === 'renew' ? '' : 'hidden'} space-y-4">
                <form id="loanRenewForm" class="space-y-4" onsubmit="window.saveAdvanceLoanRenewal(event, false)">
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3 space-y-2">
                            <label class="block text-xs font-bold text-gray-700">අත්තිකාරම් ණය ගිණුම <span class="text-red-500">*</span></label>
                            <select id="lrLoanAcc" required onchange="window.handleLoanAccountChange(this.value, 'renew')" class="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 focus:border-blue-500 outline-none bg-white font-medium text-xs">
                                <option value="" disabled ${!preselectedAccId ? 'selected' : ''}>තෝරන්න (Loan Account)</option>
                                ${loanAccOptions}
                            </select>
                            <div class="flex justify-between text-[11px] bg-white px-2.5 py-1 rounded border border-blue-100">
                                <span class="text-gray-500">දැනට ණය ශේෂය:</span>
                                <span id="lrCurrentBalDisplay" class="font-black text-blue-700">Rs. 0.00</span>
                            </div>
                        </div>

                        <div class="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3 space-y-2">
                            <label class="block text-xs font-bold text-gray-700">අදාළ ස්ථාවර තැන්පතුව (Linked FD)</label>
                            <select id="lrFdAcc" onchange="window.handleLoanFdAccountChange(this.value)" class="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 focus:border-emerald-500 outline-none bg-white font-medium text-xs">
                                <option value="">තෝරන්න (Fixed Deposit)</option>
                                ${fdOptions}
                            </select>
                            <div class="flex justify-between text-[11px] bg-white px-2.5 py-1 rounded border border-emerald-100">
                                <span class="text-gray-500">තැන්පතු ශේෂය:</span>
                                <span id="lrFdBalDisplay" class="font-black text-emerald-700">Rs. 0.00</span>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">අලුත් කළ දිනය (Renewal Date) <span class="text-red-500">*</span></label>
                            <input type="date" id="lrDate" required value="${defaultDate}" class="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-blue-500 outline-none bg-white text-sm">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">යොමු අංකය (Reference No)</label>
                            <input type="text" id="lrRef" class="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-blue-500 outline-none bg-white text-sm font-bold text-blue-600" placeholder="e.g. LN-RNW-000001">
                        </div>
                    </div>

                    <!-- 1. Loan Interest Payment Section -->
                    <div class="border border-red-200 bg-red-50/40 rounded-xl p-3.5 space-y-3">
                        <div class="flex items-center gap-2 text-xs font-bold text-red-800">
                            <i class="fa-solid fa-receipt"></i> 1. ණය සඳහා පොලිය ගෙවීම (Loan Interest Paid)
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[11px] font-bold text-gray-700 mb-1">ගෙවූ මුළු පොලී මුදල (Rs.) <span class="text-red-500">*</span></label>
                                <input type="number" id="lrLoanIntAmount" required step="0.01" min="0.00" value="0.00" oninput="window.updateLoanRenewSummary(true)" class="w-full px-3 py-1.5 rounded-lg border border-gray-300 focus:border-red-500 outline-none text-right font-bold text-red-600 text-xs bg-white">
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-gray-700 mb-1">පොලී වියදම් ගිණුම</label>
                                <select id="lrLoanIntAcc" class="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 focus:border-red-500 outline-none bg-white text-xs">
                                    ${intExpOptions}
                                </select>
                            </div>
                        </div>

                        <!-- MULTIPLE PAYMENT ACCOUNTS FOR RENEWAL INTEREST -->
                        <div class="pt-1 space-y-2">
                            <div class="flex justify-between items-center">
                                <label class="block text-[11px] font-bold text-gray-800">
                                    <i class="fa-solid fa-wallet text-red-600 mr-1"></i> පොලිය ගෙවූ ගිණුම් (Interest Paid From Accounts)
                                </label>
                                <button type="button" onclick="window.addLoanRenewPaymentSourceRow()" class="text-[10px] text-red-800 font-bold bg-red-200/80 hover:bg-red-300 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors border border-red-300 shadow-sm">
                                    <i class="fa-solid fa-plus"></i> තවත් ගිණුමක් (Add Account)
                                </button>
                            </div>
                            
                            <div id="lrPaymentSourcesContainer" class="space-y-2">
                                <!-- Populated dynamically with at least 1 row -->
                            </div>
                            
                            <div class="flex justify-between items-center bg-white px-3 py-1.5 rounded-lg border border-red-100 text-xs">
                                <span class="text-gray-500 font-medium">වෙන්කළ මුළු පොලී මුදල:</span>
                                <span id="lrAllocatedTotalDisplay" class="font-black text-gray-800">Rs. 0.00</span>
                            </div>
                            <div id="lrAllocationDiffAlert" class="hidden text-[11px] font-bold text-red-600 bg-red-50 px-2.5 py-1.5 rounded border border-red-200"></div>
                        </div>
                    </div>

                    <!-- 2. FD Interest Addition Section -->
                    <div class="border border-emerald-200 bg-emerald-50/40 rounded-xl p-3 space-y-3">
                        <div class="flex justify-between items-center">
                            <label class="flex items-center gap-2 text-xs font-bold text-emerald-800 cursor-pointer">
                                <input type="checkbox" id="lrFdInterestToggle" onchange="window.toggleFdInterestSection(this.checked)" class="rounded text-emerald-600 focus:ring-emerald-500">
                                <span><i class="fa-solid fa-arrow-trend-up"></i> 2. ස්ථාවර තැන්පතුවට පොලී එකතු වීම (Add FD Interest to Principal)</span>
                            </label>
                        </div>
                        <div id="lrFdInterestBox" class="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-40 pointer-events-none transition-all">
                            <div>
                                <label class="block text-[11px] font-bold text-gray-700 mb-1">ලැබුණු තැන්පතු පොලිය (Rs.)</label>
                                <input type="number" id="lrFdIntAmount" step="0.01" min="0.00" value="0.00" oninput="window.updateLoanRenewSummary()" class="w-full px-3 py-1.5 rounded-lg border border-gray-300 focus:border-emerald-500 outline-none text-right font-bold text-emerald-700 text-xs bg-white">
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-gray-700 mb-1">පොලී ආදායම් ගිණුම (Income Account)</label>
                                <select id="lrFdIntAcc" class="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 focus:border-emerald-500 outline-none bg-white text-xs">
                                    ${fdIncOptions}
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- 3. Principal Adjustment Section -->
                    <div class="border border-blue-200 bg-blue-50/40 rounded-xl p-3 space-y-3">
                        <div class="text-xs font-bold text-blue-800 flex items-center gap-2">
                            <i class="fa-solid fa-sliders"></i> 3. ණය මුදල වෙනස් කිරීම (Principal Adjustment - Optional)
                        </div>
                        <div class="grid grid-cols-3 gap-2 text-xs">
                            <label class="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-gray-200 cursor-pointer">
                                <input type="radio" name="lrAdjMode" value="none" checked onchange="window.togglePrincipalAdjMode('none')">
                                <span class="font-medium text-gray-700 text-[11px]">වෙනසක් නැත</span>
                            </label>
                            <label class="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-gray-200 cursor-pointer">
                                <input type="radio" name="lrAdjMode" value="topup" onchange="window.togglePrincipalAdjMode('topup')">
                                <span class="font-medium text-blue-700 text-[11px]">ණය මුදල වැඩි කිරීම</span>
                            </label>
                            <label class="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-gray-200 cursor-pointer">
                                <input type="radio" name="lrAdjMode" value="repay" onchange="window.togglePrincipalAdjMode('repay')">
                                <span class="font-medium text-amber-700 text-[11px]">ණය මුදල අඩු කිරීම</span>
                            </label>
                        </div>
                        <div id="lrAdjInputBox" class="hidden grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            <div>
                                <label id="lrAdjAmountLabel" class="block text-[11px] font-bold text-gray-700 mb-1">මුදල (Rs.)</label>
                                <input type="number" id="lrAdjAmount" step="0.01" min="0.00" value="0.00" oninput="window.updateLoanRenewSummary(false)" class="w-full px-3 py-1.5 rounded-lg border border-gray-300 focus:border-blue-500 outline-none text-right font-bold text-xs bg-white text-gray-800">
                            </div>
                            <div>
                                <label id="lrAdjAccountLabel" class="block text-[11px] font-bold text-gray-700 mb-1">මුදල් ගිණුම (Account)</label>
                                <select id="lrAdjAccount" class="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 focus:border-blue-500 outline-none bg-white text-xs">
                                    ${cashBankOptions}
                                </select>
                            </div>
                        </div>

                        <!-- New Loan Account Name for Renewal -->
                        <div class="pt-2.5 border-t border-blue-200/60 space-y-1.5">
                            <label class="block text-[11px] font-bold text-gray-800">
                                <i class="fa-solid fa-file-signature text-blue-600 mr-1"></i> අලුත් ණය ගිණුමේ නම / අංකය (New Loan Account Name / Number) <span class="text-gray-400 font-normal">(වෙනස් වේ නම්)</span>
                            </label>
                            <input type="text" id="lrNewLoanAccName" class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 outline-none text-xs bg-white font-medium text-gray-800" placeholder="e.g. අත්තිකාරම් ණය ගිණුම 01-3030106-00295">
                            <div class="flex flex-wrap items-center gap-4 text-[11px] pt-0.5">
                                <label class="flex items-center gap-1.5 cursor-pointer text-blue-800 font-semibold">
                                    <input type="radio" name="lrNewAccAction" value="transfer" checked class="text-blue-600 focus:ring-blue-500">
                                    <span>නව ගිණුමක් සකසා ශේෂය මාරු කරන්න (New Account & Transfer Balance)</span>
                                </label>
                                <label class="flex items-center gap-1.5 cursor-pointer text-gray-700 font-medium">
                                    <input type="radio" name="lrNewAccAction" value="rename" class="text-blue-600 focus:ring-blue-500">
                                    <span>පවතින ගිණුමේ නම යාවත්කාලීන කරන්න (Rename Existing)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">විස්තරය (Description)</label>
                        <input type="text" id="lrDesc" class="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-blue-500 outline-none bg-white text-xs" placeholder="අත්තිකාරම් ණය අලුත් කිරීම සහ පොලී ගෙවීම...">
                    </div>

                    <!-- Renewal Live Calculation Summary -->
                    <div class="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1.5 text-xs">
                        <div class="flex justify-between text-gray-600">
                            <span>ණය පොලී ගෙවීම (Interest Paid Outflow):</span>
                            <span class="font-bold text-red-600" id="lrSumIntPaid">Rs. 0.00</span>
                        </div>
                        <div class="flex justify-between text-gray-600">
                            <span>තැන්පතුවට එකතු කළ පොලිය (FD Growth):</span>
                            <span class="font-bold text-emerald-600" id="lrSumFdGrowth">Rs. 0.00</span>
                        </div>
                        <div class="flex justify-between text-gray-700 border-t border-gray-200 pt-1">
                            <span>නව ණය ශේෂය (New Loan Balance):</span>
                            <span class="font-black text-blue-800 text-sm" id="lrSumNewLoanBal">Rs. 0.00</span>
                        </div>
                    </div>

                    <div class="pt-3 border-t border-gray-100 flex flex-wrap justify-end gap-2">
                        <button type="button" onclick="window.utils.closeModal()" class="px-4 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-100 text-xs">Cancel</button>
                        <button type="button" onclick="window.saveAdvanceLoanRenewal(event, true)" class="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-lg font-bold transition-all shadow-md text-xs flex items-center gap-1.5">
                            <i class="fa-solid fa-print"></i> Save & Print
                        </button>
                        <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold transition-all shadow-md shadow-blue-500/30 text-xs flex items-center gap-1.5">
                            <i class="fa-solid fa-arrows-rotate"></i> Save Renewal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    window.utils.showModal(html);

    // Initial triggers
    requestAnimationFrame(async () => {
        const nextSetRef = await window.getNextReferenceNumber('LN-SET-');
        const setRefInput = document.getElementById('lsRef');
        if (setRefInput) setRefInput.value = nextSetRef;

        const nextRnwRef = await window.getNextReferenceNumber('LN-RNW-');
        const rnwRefInput = document.getElementById('lrRef');
        if (rnwRefInput) rnwRefInput.value = nextRnwRef;

        // Initialize with 1 payment source row for both settlement and renewal
        window.addLoanPaymentSourceRow();
        window.addLoanRenewPaymentSourceRow();

        if (preselectedAccId) {
            window.handleLoanAccountChange(preselectedAccId, 'settle');
            window.handleLoanAccountChange(preselectedAccId, 'renew');
        }
    });
};

window.addLoanPaymentSourceRow = (defaultAccId = null, defaultAmount = null) => {
    const container = document.getElementById('lsPaymentSourcesContainer');
    if (!container) return;

    // Calculate remaining unallocated amount to auto-suggest
    let suggestedAmount = '';
    if (defaultAmount !== null) {
        suggestedAmount = defaultAmount;
    } else {
        const p = parseFloat(document.getElementById('lsPrincipal')?.value) || 0;
        const i = parseFloat(document.getElementById('lsInterest')?.value) || 0;
        const totalReq = p + i;
        const currentAllocated = Array.from(document.getElementsByName('lsPaidAmount[]')).reduce((sum, el) => sum + (parseFloat(el.value) || 0), 0);
        const rem = totalReq - currentAllocated;
        if (rem > 0) suggestedAmount = rem.toFixed(2);
    }

    const row = document.createElement('div');
    row.className = "flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 relative animate-fade-in";
    row.innerHTML = `
        <div class="flex-1">
            <select name="lsPaidAccount[]" required class="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 focus:border-amber-500 outline-none bg-white font-medium text-xs">
                <option value="" disabled selected>ගිණුම තෝරන්න (Select Account)</option>
                ${window.loanGlobalCashBankOptions || ''}
            </select>
        </div>
        <div class="w-1/3 relative">
            <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">Rs.</span>
            <input type="number" name="lsPaidAmount[]" required step="0.01" min="0.01" value="${suggestedAmount}" placeholder="0.00" oninput="window.updateLoanSettleSummary(false)" class="w-full pl-7 pr-2.5 py-1.5 rounded-lg border border-gray-300 focus:border-amber-500 outline-none text-right font-bold text-xs bg-white text-gray-800">
        </div>
        <button type="button" onclick="if(document.getElementsByName('lsPaidAccount[]').length > 1) { this.parentElement.remove(); window.updateLoanSettleSummary(false); } else { window.utils.showToast('අවම වශයෙන් එක් ගෙවීම් ගිණුමක් අවශ්‍ය වේ.', 'error'); }" class="text-red-400 hover:text-red-600 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors" title="ගිණුම ඉවත් කරන්න">
            <i class="fa-solid fa-trash text-xs"></i>
        </button>
    `;
    container.appendChild(row);

    if (defaultAccId) {
        const sel = row.querySelector('select');
        if (sel) sel.value = defaultAccId;
    }

    window.updateLoanSettleSummary(false);
};

window.addLoanRenewPaymentSourceRow = (defaultAccId = null, defaultAmount = null) => {
    const container = document.getElementById('lrPaymentSourcesContainer');
    if (!container) return;

    let suggestedAmount = '';
    if (defaultAmount !== null) {
        suggestedAmount = defaultAmount;
    } else {
        const intAmt = parseFloat(document.getElementById('lrLoanIntAmount')?.value) || 0;
        const currentAllocated = Array.from(document.getElementsByName('lrPaidAmount[]')).reduce((sum, el) => sum + (parseFloat(el.value) || 0), 0);
        const rem = intAmt - currentAllocated;
        if (rem > 0) suggestedAmount = rem.toFixed(2);
    }

    const row = document.createElement('div');
    row.className = "flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 relative animate-fade-in";
    row.innerHTML = `
        <div class="flex-1">
            <select name="lrPaidAccount[]" required class="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 focus:border-red-500 outline-none bg-white font-medium text-xs">
                <option value="" disabled selected>ගිණුම තෝරන්න (Select Account)</option>
                ${window.loanGlobalCashBankOptions || ''}
            </select>
        </div>
        <div class="w-1/3 relative">
            <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">Rs.</span>
            <input type="number" name="lrPaidAmount[]" required step="0.01" min="0.01" value="${suggestedAmount}" placeholder="0.00" oninput="window.updateLoanRenewSummary(false)" class="w-full pl-7 pr-2.5 py-1.5 rounded-lg border border-gray-300 focus:border-red-500 outline-none text-right font-bold text-xs bg-white text-gray-800">
        </div>
        <button type="button" onclick="if(document.getElementsByName('lrPaidAccount[]').length > 1) { this.parentElement.remove(); window.updateLoanRenewSummary(false); } else { window.utils.showToast('අවම වශයෙන් එක් ගෙවීම් ගිණුමක් අවශ්‍ය වේ.', 'error'); }" class="text-red-400 hover:text-red-600 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors" title="ගිණුම ඉවත් කරන්න">
            <i class="fa-solid fa-trash text-xs"></i>
        </button>
    `;
    container.appendChild(row);

    if (defaultAccId) {
        const sel = row.querySelector('select');
        if (sel) sel.value = defaultAccId;
    }

    window.updateLoanRenewSummary(false);
};

window.switchLoanTab = (tab) => {
    const settleBox = document.getElementById('loanTabSettle');
    const renewBox = document.getElementById('loanTabRenew');
    const btnSettle = document.getElementById('tabBtnSettle');
    const btnRenew = document.getElementById('tabBtnRenew');

    if (tab === 'settle') {
        settleBox.classList.remove('hidden');
        renewBox.classList.add('hidden');
        btnSettle.className = "flex-1 py-2.5 rounded-lg text-xs font-bold transition-all bg-white text-amber-700 shadow-sm flex items-center justify-center gap-2";
        btnRenew.className = "flex-1 py-2.5 rounded-lg text-xs font-bold transition-all text-gray-600 hover:text-gray-900 flex items-center justify-center gap-2";
    } else {
        settleBox.classList.add('hidden');
        renewBox.classList.remove('hidden');
        btnSettle.className = "flex-1 py-2.5 rounded-lg text-xs font-bold transition-all text-gray-600 hover:text-gray-900 flex items-center justify-center gap-2";
        btnRenew.className = "flex-1 py-2.5 rounded-lg text-xs font-bold transition-all bg-white text-blue-700 shadow-sm flex items-center justify-center gap-2";
    }
};

window.handleLoanAccountChange = async (accId, mode) => {
    if (!accId) return;
    const balance = await window.getAccountBalance(accId);
    const acc = await db.accounts.get(parseInt(accId));
    const accName = acc ? acc.accountName : '';

    if (mode === 'settle') {
        const balEl = document.getElementById('lsCurrentBalDisplay');
        if (balEl) balEl.textContent = `Rs. ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const pInput = document.getElementById('lsPrincipal');
        if (pInput && (!pInput.value || parseFloat(pInput.value) === 0)) {
            pInput.value = balance > 0 ? balance.toFixed(2) : '0.00';
        }
        const descInput = document.getElementById('lsDesc');
        if (descInput && !descInput.value) {
            descInput.value = `ස්ථාවර තැන්පතු අත්තිකාරම් ණය පියවීම (${accName})`;
        }
        window.updateLoanSettleSummary(true);
    } else {
        const balEl = document.getElementById('lrCurrentBalDisplay');
        if (balEl) balEl.textContent = `Rs. ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const descInput = document.getElementById('lrDesc');
        if (descInput && !descInput.value) {
            descInput.value = `ස්ථාවර තැන්පතු අත්තිකාරම් ණය අලුත් කිරීම (${accName})`;
        }
        window.updateLoanRenewSummary(false);
    }
};

window.handleLoanFdAccountChange = async (accId) => {
    const balEl = document.getElementById('lrFdBalDisplay');
    if (!balEl) return;
    if (!accId) {
        balEl.textContent = "Rs. 0.00";
        return;
    }
    const balance = await window.getAccountBalance(accId);
    balEl.textContent = `Rs. ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    window.updateLoanRenewSummary(false);
};

window.updateLoanSettleSummary = (autoAdjustSingle = false) => {
    const p = parseFloat(document.getElementById('lsPrincipal')?.value) || 0;
    const i = parseFloat(document.getElementById('lsInterest')?.value) || 0;
    const totalRequired = p + i;

    const paidAmtInputs = Array.from(document.getElementsByName('lsPaidAmount[]'));
    
    // If only 1 payment source row exists and autoAdjustSingle is true or its value is 0/empty, auto-sync
    if (paidAmtInputs.length === 1 && (autoAdjustSingle || !paidAmtInputs[0].value || parseFloat(paidAmtInputs[0].value) === 0)) {
        if (totalRequired > 0) {
            paidAmtInputs[0].value = totalRequired.toFixed(2);
        }
    }

    const allocatedTotal = paidAmtInputs.reduce((sum, el) => sum + (parseFloat(el.value) || 0), 0);

    const sumP = document.getElementById('lsSumPrincipal');
    const sumI = document.getElementById('lsSumInterest');
    const sumT = document.getElementById('lsSumTotal');
    const allocDisplay = document.getElementById('lsAllocatedTotalDisplay');
    const diffAlert = document.getElementById('lsAllocationDiffAlert');

    if (sumP) sumP.textContent = `Rs. ${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (sumI) sumI.textContent = `Rs. ${i.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (sumT) sumT.textContent = `Rs. ${totalRequired.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (allocDisplay) allocDisplay.textContent = `Rs. ${allocatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (diffAlert) {
        const diff = totalRequired - allocatedTotal;
        if (totalRequired > 0 && Math.abs(diff) > 0.01) {
            diffAlert.classList.remove('hidden');
            if (diff > 0) {
                diffAlert.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> ගෙවිය යුතු මුළු මුදලින් තවත් <strong>Rs. ${diff.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> ක් ගිණුම් වලින් වෙන් කළ යුතුය!`;
            } else {
                diffAlert.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> වෙන් කළ මුදල ගෙවිය යුතු මුදලට වඩා <strong>Rs. ${Math.abs(diff).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> කින් වැඩිය!`;
            }
        } else {
            diffAlert.classList.add('hidden');
        }
    }
};

window.toggleFdInterestSection = (enabled) => {
    const box = document.getElementById('lrFdInterestBox');
    if (!box) return;
    if (enabled) {
        box.classList.remove('opacity-40', 'pointer-events-none');
    } else {
        box.classList.add('opacity-40', 'pointer-events-none');
        const input = document.getElementById('lrFdIntAmount');
        if (input) input.value = "0.00";
    }
    window.updateLoanRenewSummary(false);
};

window.togglePrincipalAdjMode = (mode) => {
    const box = document.getElementById('lrAdjInputBox');
    const labelAmt = document.getElementById('lrAdjAmountLabel');
    const labelAcc = document.getElementById('lrAdjAccountLabel');
    if (!box) return;

    if (mode === 'none') {
        box.classList.add('hidden');
        const input = document.getElementById('lrAdjAmount');
        if (input) input.value = "0.00";
    } else if (mode === 'topup') {
        box.classList.remove('hidden');
        if (labelAmt) labelAmt.textContent = "වැඩි කළ ණය මුදල (Top-up Amount Rs.)";
        if (labelAcc) labelAcc.textContent = "මුදල් ලැබුණු ගිණුම (Receive Into Account)";
    } else if (mode === 'repay') {
        box.classList.remove('hidden');
        if (labelAmt) labelAmt.textContent = "අඩු කළ ණය මුදල (Repay Amount Rs.)";
        if (labelAcc) labelAcc.textContent = "ගෙවීම සිදුකළ ගිණුම (Paid From Account)";
    }
    window.updateLoanRenewSummary(false);
};

window.updateLoanRenewSummary = async (autoAdjustSingle = false) => {
    const loanAccId = document.getElementById('lrLoanAcc')?.value;
    const loanBal = loanAccId ? await window.getAccountBalance(loanAccId) : 0;

    const loanInt = parseFloat(document.getElementById('lrLoanIntAmount')?.value) || 0;
    const fdInt = parseFloat(document.getElementById('lrFdIntAmount')?.value) || 0;

    const adjMode = document.querySelector('input[name="lrAdjMode"]:checked')?.value || 'none';
    const adjAmt = parseFloat(document.getElementById('lrAdjAmount')?.value) || 0;

    let newLoanBal = loanBal;
    if (adjMode === 'topup') newLoanBal += adjAmt;
    else if (adjMode === 'repay') newLoanBal -= adjAmt;

    // Multi-payment source calculation for renewal loan interest
    const paidAmtInputs = Array.from(document.getElementsByName('lrPaidAmount[]'));
    if (paidAmtInputs.length === 1 && (autoAdjustSingle || !paidAmtInputs[0].value || parseFloat(paidAmtInputs[0].value) === 0)) {
        if (loanInt > 0) {
            paidAmtInputs[0].value = loanInt.toFixed(2);
        }
    }
    const allocatedTotal = paidAmtInputs.reduce((sum, el) => sum + (parseFloat(el.value) || 0), 0);

    const sumInt = document.getElementById('lrSumIntPaid');
    const sumFd = document.getElementById('lrSumFdGrowth');
    const sumNewBal = document.getElementById('lrSumNewLoanBal');
    const allocDisplay = document.getElementById('lrAllocatedTotalDisplay');
    const diffAlert = document.getElementById('lrAllocationDiffAlert');

    if (sumInt) sumInt.textContent = `Rs. ${loanInt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (sumFd) sumFd.textContent = `Rs. ${fdInt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (sumNewBal) sumNewBal.textContent = `Rs. ${newLoanBal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (allocDisplay) allocDisplay.textContent = `Rs. ${allocatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (diffAlert) {
        const diff = loanInt - allocatedTotal;
        if (loanInt > 0 && Math.abs(diff) > 0.01) {
            diffAlert.classList.remove('hidden');
            if (diff > 0) {
                diffAlert.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> පොලී මුදලින් තවත් <strong>Rs. ${diff.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> ක් ගිණුම් වලින් වෙන් කළ යුතුය!`;
            } else {
                diffAlert.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1"></i> වෙන් කළ මුදල පොලී මුදලට වඩා <strong>Rs. ${Math.abs(diff).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> කින් වැඩිය!`;
            }
        } else {
            diffAlert.classList.add('hidden');
        }
    }
};

window.saveAdvanceLoanSettlement = async (e, printAfter = false) => {
    e.preventDefault();
    try {
        const loanAccId = parseInt(document.getElementById('lsLoanAcc').value);
        const date = document.getElementById('lsDate').value;
        const ref = document.getElementById('lsRef').value || await window.getNextReferenceNumber('LN-SET-');
        const principal = parseFloat(document.getElementById('lsPrincipal').value) || 0;
        const interest = parseFloat(document.getElementById('lsInterest').value) || 0;
        const intAccId = parseInt(document.getElementById('lsIntAcc').value);
        const desc = document.getElementById('lsDesc').value;

        if (!loanAccId || isNaN(loanAccId)) {
            window.utils.showToast("Please select a valid Loan Account", "error");
            return;
        }
        if (principal <= 0) {
            window.utils.showToast("Principal repayment amount must be greater than 0", "error");
            return;
        }

        // Collect payment source rows
        const paidAccEls = Array.from(document.getElementsByName('lsPaidAccount[]'));
        const paidAmtEls = Array.from(document.getElementsByName('lsPaidAmount[]'));
        
        const validPaymentSources = [];
        let totalAllocated = 0;

        for (let idx = 0; idx < paidAccEls.length; idx++) {
            const accId = parseInt(paidAccEls[idx].value);
            const amt = parseFloat(paidAmtEls[idx].value) || 0;
            if (!accId || isNaN(accId)) {
                window.utils.showToast("Please select a payment source account for each line", "error");
                return;
            }
            if (amt <= 0) {
                window.utils.showToast("Payment amount for each account must be greater than 0", "error");
                return;
            }
            validPaymentSources.push({ accountId: accId, amount: amt });
            totalAllocated += amt;
        }

        if (validPaymentSources.length === 0) {
            window.utils.showToast("Please add at least one payment source account", "error");
            return;
        }

        const totalRequired = principal + interest;
        if (Math.abs(totalAllocated - totalRequired) > 0.01) {
            window.utils.showToast(`ගෙවිය යුතු මුළු මුදල (Rs. ${totalRequired.toFixed(2)}) සහ ගිණුම් වලින් ගෙවන මුදල් එකතුව (Rs. ${totalAllocated.toFixed(2)}) සමාන විය යුතුය!`, "error");
            return;
        }

        const loanAcc = await db.accounts.get(loanAccId);
        const loanName = loanAcc ? loanAcc.accountName : 'Advance Loan';

        // 1. Create Transaction Header
        const txId = await db.transactions.add({
            date: date,
            type: 'Payment',
            reference: ref,
            memberId: null,
            otherName: loanName,
            description: desc || `අත්තිකාරම් ණය පියවීම: ${loanName} (ණය මුදල: Rs. ${principal.toFixed(2)}, පොලිය: Rs. ${interest.toFixed(2)})`,
            unit: window.currentUnit,
            userId: window.auth.session ? window.auth.session.id : null,
            status: 'Active'
        });

        // 2. Create Double Entry Items
        const entries = [];
        
        // Debit Loan Liability Account (reduces loan liability)
        entries.push({
            transactionId: txId,
            accountId: loanAccId,
            debit: principal,
            credit: 0
        });

        // Debit Interest Expense Account (if interest > 0)
        if (interest > 0) {
            entries.push({
                transactionId: txId,
                accountId: intAccId,
                debit: interest,
                credit: 0
            });
        }

        // Credit Each Payment Source Account for its allocated amount
        validPaymentSources.forEach(ps => {
            entries.push({
                transactionId: txId,
                accountId: ps.accountId,
                debit: 0,
                credit: ps.amount
            });
        });

        await db.entries.bulkAdd(entries);

        window.utils.showToast("අත්තිකාරම් ණය පියවීම සාර්ථකව සටහන් විය!");
        window.utils.closeModal();
        if (window.loadTransactionsTable) window.loadTransactionsTable();
        if (window.loadAccountsTable) window.loadAccountsTable();
        if (window.refreshCurrentView) window.refreshCurrentView();

        if (printAfter) {
            setTimeout(() => {
                window.printTransaction(txId);
            }, 500);
        }
    } catch (err) {
        console.error(err);
        window.utils.showToast("Error saving loan settlement", "error");
    }
};

window.saveAdvanceLoanRenewal = async (e, printAfter = false) => {
    e.preventDefault();
    try {
        const loanAccId = parseInt(document.getElementById('lrLoanAcc').value);
        const fdAccId = parseInt(document.getElementById('lrFdAcc').value) || null;
        const date = document.getElementById('lrDate').value;
        const ref = document.getElementById('lrRef').value || await window.getNextReferenceNumber('LN-RNW-');
        
        const loanInterest = parseFloat(document.getElementById('lrLoanIntAmount').value) || 0;
        const loanIntAccId = parseInt(document.getElementById('lrLoanIntAcc').value);

        // Collect renewal interest payment sources if loanInterest > 0
        const validPaymentSources = [];
        if (loanInterest > 0) {
            const paidAccEls = Array.from(document.getElementsByName('lrPaidAccount[]'));
            const paidAmtEls = Array.from(document.getElementsByName('lrPaidAmount[]'));
            let totalAllocated = 0;

            for (let idx = 0; idx < paidAccEls.length; idx++) {
                const accId = parseInt(paidAccEls[idx].value);
                const amt = parseFloat(paidAmtEls[idx].value) || 0;
                if (!accId || isNaN(accId)) {
                    window.utils.showToast("Please select a payment account for interest", "error");
                    return;
                }
                if (amt <= 0) {
                    window.utils.showToast("Interest payment amount for each account must be greater than 0", "error");
                    return;
                }
                validPaymentSources.push({ accountId: accId, amount: amt });
                totalAllocated += amt;
            }

            if (validPaymentSources.length === 0) {
                window.utils.showToast("Please add at least one payment account for loan interest", "error");
                return;
            }

            if (Math.abs(totalAllocated - loanInterest) > 0.01) {
                window.utils.showToast(`ගෙවිය යුතු පොලී මුදල (Rs. ${loanInterest.toFixed(2)}) සහ ගිණුම් වලින් වෙන්කළ මුදල (Rs. ${totalAllocated.toFixed(2)}) සමාන විය යුතුය!`, "error");
                return;
            }
        }

        const isFdInt = document.getElementById('lrFdInterestToggle')?.checked || false;
        const fdInterest = isFdInt ? (parseFloat(document.getElementById('lrFdIntAmount').value) || 0) : 0;
        const fdIntAccId = parseInt(document.getElementById('lrFdIntAcc').value);

        const adjMode = document.querySelector('input[name="lrAdjMode"]:checked')?.value || 'none';
        const adjAmount = (adjMode !== 'none') ? (parseFloat(document.getElementById('lrAdjAmount').value) || 0) : 0;
        const adjAccountId = (adjMode !== 'none') ? parseInt(document.getElementById('lrAdjAccount').value) : null;

        const newLoanAccName = document.getElementById('lrNewLoanAccName')?.value.trim();
        const newAccAction = document.querySelector('input[name="lrNewAccAction"]:checked')?.value || 'transfer';

        const desc = document.getElementById('lrDesc').value;

        if (!loanAccId || isNaN(loanAccId)) {
            window.utils.showToast("Please select a valid Loan Account", "error");
            return;
        }

        if (loanInterest <= 0 && fdInterest <= 0 && adjAmount <= 0 && !newLoanAccName) {
            window.utils.showToast("Please enter at least interest payment, FD interest, or loan adjustments", "error");
            return;
        }

        if (isFdInt && fdInterest > 0 && !fdAccId) {
            window.utils.showToast("Please select a Fixed Deposit account to add the FD interest", "error");
            return;
        }

        if (adjMode !== 'none' && adjAmount > 0 && (!adjAccountId || isNaN(adjAccountId))) {
            window.utils.showToast("Please select an account for Principal adjustment", "error");
            return;
        }

        const loanAcc = await db.accounts.get(loanAccId);
        const oldLoanName = loanAcc ? loanAcc.accountName : 'Advance Loan';
        let targetLoanName = oldLoanName;

        // Check if renaming existing account
        if (newLoanAccName && newLoanAccName !== oldLoanName && newAccAction === 'rename') {
            await db.accounts.update(loanAccId, { accountName: newLoanAccName });
            targetLoanName = newLoanAccName;
        }

        // 1. Create Transaction Header
        const txId = await db.transactions.add({
            date: date,
            type: 'Transfer',
            reference: ref,
            memberId: null,
            otherName: (newLoanAccName && newAccAction === 'transfer') ? `${oldLoanName} -> ${newLoanAccName}` : targetLoanName,
            description: desc || `අත්තිකාරම් ණය අලුත් කිරීම: ${targetLoanName} (පොලිය: Rs. ${loanInterest.toFixed(2)}${fdInterest > 0 ? `, FD පොලිය: Rs. ${fdInterest.toFixed(2)}` : ''})`,
            unit: window.currentUnit,
            userId: window.auth.session ? window.auth.session.id : null,
            status: 'Active'
        });

        // 2. Create Double Entry Items
        const entries = [];

        // 2.1 Loan Interest Paid Entries (Debit Interest Expense, Credit Selected Cash/Bank Accounts)
        if (loanInterest > 0) {
            entries.push({
                transactionId: txId,
                accountId: loanIntAccId,
                debit: loanInterest,
                credit: 0
            });
            validPaymentSources.forEach(ps => {
                entries.push({
                    transactionId: txId,
                    accountId: ps.accountId,
                    debit: 0,
                    credit: ps.amount
                });
            });
        }

        // 2.2 FD Interest Income Capitalization Entries (Debit FD Asset, Credit FD Interest Income)
        if (fdInterest > 0 && fdAccId) {
            entries.push({
                transactionId: txId,
                accountId: fdAccId,
                debit: fdInterest,
                credit: 0
            });
            entries.push({
                transactionId: txId,
                accountId: fdIntAccId,
                debit: 0,
                credit: fdInterest
            });
        }

        // 2.3 Principal Adjustment and New Loan Account Transfer Handling
        if (newLoanAccName && newLoanAccName !== oldLoanName && newAccAction === 'transfer') {
            // Find or create the new liability loan account
            let targetNewAcc = await db.accounts.where('accountName').equalsIgnoreCase(newLoanAccName).first();
            if (!targetNewAcc) {
                const newId = await db.accounts.add({
                    accountName: newLoanAccName,
                    accountType: 'Liability',
                    category: loanAcc.category || 'Advance Loan',
                    unit: window.currentUnit
                });
                targetNewAcc = { id: newId, accountName: newLoanAccName };
            }

            const currentOutstanding = await window.getAccountBalance(loanAccId);
            let finalNewPrincipal = currentOutstanding;
            if (adjMode === 'topup') finalNewPrincipal += adjAmount;
            else if (adjMode === 'repay') finalNewPrincipal -= adjAmount;

            // Close old loan account
            if (currentOutstanding > 0) {
                entries.push({
                    transactionId: txId,
                    accountId: loanAccId,
                    debit: currentOutstanding,
                    credit: 0
                });
            }

            // Open new loan account with final renewed balance
            if (finalNewPrincipal > 0) {
                entries.push({
                    transactionId: txId,
                    accountId: targetNewAcc.id,
                    debit: 0,
                    credit: finalNewPrincipal
                });
            }

            // Cash / Bank inflows or outflows for top-up or repay
            if (adjMode === 'topup' && adjAmount > 0 && adjAccountId) {
                entries.push({
                    transactionId: txId,
                    accountId: adjAccountId,
                    debit: adjAmount,
                    credit: 0
                });
            } else if (adjMode === 'repay' && adjAmount > 0 && adjAccountId) {
                entries.push({
                    transactionId: txId,
                    accountId: adjAccountId,
                    debit: 0,
                    credit: adjAmount
                });
            }
        } else {
            // Standard adjustment on the existing loan account
            if (adjMode === 'topup' && adjAmount > 0 && adjAccountId) {
                entries.push({
                    transactionId: txId,
                    accountId: adjAccountId,
                    debit: adjAmount,
                    credit: 0
                });
                entries.push({
                    transactionId: txId,
                    accountId: loanAccId,
                    debit: 0,
                    credit: adjAmount
                });
            } else if (adjMode === 'repay' && adjAmount > 0 && adjAccountId) {
                entries.push({
                    transactionId: txId,
                    accountId: loanAccId,
                    debit: adjAmount,
                    credit: 0
                });
                entries.push({
                    transactionId: txId,
                    accountId: adjAccountId,
                    debit: 0,
                    credit: adjAmount
                });
            }
        }

        await db.entries.bulkAdd(entries);

        window.utils.showToast("අත්තිකාරම් ණය අලුත් කිරීම සාර්ථකව සටහන් විය!");
        window.utils.closeModal();
        if (window.loadTransactionsTable) window.loadTransactionsTable();
        if (window.loadAccountsTable) window.loadAccountsTable();
        if (window.refreshCurrentView) window.refreshCurrentView();

        if (printAfter) {
            setTimeout(() => {
                window.printTransaction(txId);
            }, 500);
        }
    } catch (err) {
        console.error(err);
        window.utils.showToast("Error saving loan renewal", "error");
    }
};

