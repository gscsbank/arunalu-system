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
                    ${window.currentUnit === 'Main' ? `
                    <button onclick="window.openFuneralModal()" class="flex-1 md:flex-none bg-gray-800 hover:bg-black text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-gray-500/30 text-sm">
                        <i class="fa-solid fa-cross"></i> Deaths
                    </button>
                    ` : ''}
                </div>
            </div>
            
            <!-- Quick Filters -->
            <div class="mb-6 flex flex-wrap gap-2">
                <input type="date" id="txStartDate" class="flex-1 md:flex-none px-4 py-2 rounded-xl border border-gray-200 focus:border-brand-500 bg-white/50 text-sm">
                <input type="date" id="txEndDate" class="flex-1 md:flex-none px-4 py-2 rounded-xl border border-gray-200 focus:border-brand-500 bg-white/50 text-sm">
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
                <td class="px-6 py-4 text-sm text-gray-600">${tx.date}</td>
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
        <form id="txForm" class="space-y-5 max-h-[75vh] overflow-y-auto px-1 custom-scrollbar" onsubmit="window.saveTransaction(event, '${type}')">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date <span class="text-red-500">*</span></label>
                    <input type="date" id="txDate" required onchange="const input = document.getElementById('txPayerInput'); if(input && input.value) window.handleTxMemberSelection(input.value)" value="${new Date().toISOString().split('T')[0]}" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Reference No</label>
                    <input type="text" id="txRef" ${window.currentUnit === 'Main' ? 'readonly' : ''} class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 outline-none transition-all font-bold text-brand-600 ${window.currentUnit === 'Main' ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-text'}" placeholder="e.g. AR000001">
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Payer / Member</label>
                    <input list="membersList" id="txPayerInput" onchange="window.handleTxMemberSelection(this.value)" oninput="window.handleTxMemberSelection(this.value)" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all bg-white" placeholder="Search member..." autocomplete="off">
                    <datalist id="membersList">
                        ${memOptions}
                    </datalist>
                    <div id="duesSummaryContainer" class="mt-2 hidden animate-fade-in"></div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">${type === 'Receipt' ? 'Deposit To' : 'Pay From'} (Asset) <span class="text-red-500">*</span></label>
                    <select id="cbAccount" required class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all bg-white">
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
        const nextRef = isMain ? await window.getNextReferenceNumber(prefix) : '';
        const refInput = document.getElementById('txRef');
        if (refInput) {
            refInput.value = nextRef;
            if (!isMain) refInput.placeholder = "Enter Reference Number";
        }

        if (type === 'Receipt') {
            const isSAP = window.currentUnit === 'SAP';
            const welfarAcc = accounts.find(a => a.accountName && a.accountName.includes(isSAP ? 'SAP මුදල් පොත' : 'සුභ සාධක අරමුදල්'));
            const memberAcc = accounts.find(a => a.accountName && a.accountName.includes(isSAP ? 'සිතුමිණ තැන්පත් ගිණුම' : 'සාමාජික අරමුදල්'));
            const contributionAcc = accounts.find(a => a.accountName && a.accountName.includes('දායක අරමුදල්'));

            if (welfarAcc || memberAcc || contributionAcc) {
                if (isSAP) {
                    if (welfarAcc) window.addTxLineRow(welfarAcc.id);
                } else {
                    if (welfarAcc) window.addTxLineRow(welfarAcc.id);
                    if (memberAcc) window.addTxLineRow(memberAcc.id);
                    if (contributionAcc) window.addTxLineRow(contributionAcc.id);
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

        if (payerInput) {
            const members = await db.members.toArray();
            const matchedMember = members.find(m => `${m.memberNo} - ${m.name}` === payerInput || m.memberNo === payerInput || m.name === payerInput);
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
            <tr>
                <td class="pt-1 pb-1 text-left align-top leading-tight" style="padding-right: 4px;">Transfer To: ${accMap[debitEntry?.accountId]?.accountName || 'Unknown'}</td>
                <td class="pt-1 pb-1 text-right align-top leading-tight whitespace-nowrap">${total.toFixed(2)}</td>
            </tr>
            <tr>
                <td class="pt-1 pb-1 text-left align-top leading-tight text-gray-500" style="padding-right: 4px;">(From: ${accMap[creditEntry?.accountId]?.accountName || 'Unknown'})</td>
                <td class="pt-1 pb-1 text-right align-top leading-tight whitespace-nowrap"></td>
            </tr>
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
        const dues = await window.getMemberDues(tx.memberId);
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
        const voucherHtml = (label) => `
            <div style="width: 210mm; height: 148.5mm; padding: 15mm; font-family: 'Inter', sans-serif; color: black; background: white; border-bottom: 1px dashed #ccc; box-sizing: border-box; position: relative; overflow: hidden;">
                <div style="position: absolute; right: 15mm; top: 15mm; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; border: 1px solid #e2e8f0; padding: 1mm 3mm; border-radius: 4px;">${label}</div>
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid black; padding-bottom: 10mm; margin-bottom: 8mm;">
                    <div>
                        <h1 style="font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: -1px;">${(tx.unit || 'Main') === 'SAP' ? 'SAP CENTER - ARUNALU' : 'Arunalu Welfare Society'}</h1>
                        <p style="font-size: 12px; color: #444; margin: 2px 0;">Galapitiyagama, Nikaweratiya</p>
                        <p style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #666;">${(tx.unit || 'Main') === 'SAP' ? 'SAP CENTER PROJECT - WELFARE BRANCH' : 'Galapitiyagama Sanasa Society - Welfare Branch'}</p>
                    </div>
                    <div style="text-align: right;">
                        <h2 style="font-size: 20px; font-weight: 800; margin: 0;">${title}</h2>
                        <p style="font-size: 14px; font-weight: bold; margin-top: 4px;">Ref: ${tx.reference || '-'}</p>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; margin-bottom: 8mm; font-size: 14px;">
                    <div>
                        <span style="color: #666; text-transform: uppercase; font-size: 10px; font-weight: 800; display: block; margin-bottom: 2px;">Paid To:</span>
                        <span style="font-size: 18px; font-weight: 800;">${memberLabel}</span>
                    </div>
                    <div style="text-align: right;">
                        <span style="color: #666; text-transform: uppercase; font-size: 10px; font-weight: 800; display: block; margin-bottom: 2px;">Date:</span>
                        <span style="font-size: 16px; font-weight: 700;">${tx.date}</span>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 10mm;">
                    <thead>
                        <tr style="border-bottom: 2px solid black;">
                            <th style="text-align: left; padding: 3mm 0; font-size: 12px; text-transform: uppercase; font-weight: 800;">Description of Payment</th>
                            <th style="text-align: right; padding: 3mm 0; font-size: 12px; text-transform: uppercase; font-weight: 800; width: 40mm;">Amount (Rs.)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${linesHtml}
                        <tr style="border-top: 2px solid black;">
                            <td style="text-align: right; padding: 4mm 0; font-weight: 800; font-size: 14px;">TOTAL AMOUNT PAID</td>
                            <td style="text-align: right; padding: 4mm 0; font-weight: 900; font-size: 18px;">${total.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>

                <div style="display: flex; justify-content: space-between; margin-top: auto; padding-top: 5mm;">
                    <div style="text-align: center; width: 30%;">
                        <div style="border-top: 1.5px solid black; padding-top: 2mm;">
                            <div style="font-size: 11px; font-weight: 800;">Member / Payee</div>
                            <div style="font-size: 9px; color: #666;">සාමාජිකයාගේ අත්සන</div>
                        </div>
                    </div>
                    <div style="text-align: center; width: 30%;">
                        <div style="border-top: 1.5px solid black; padding-top: 2mm;">
                            <div style="font-size: 11px; font-weight: 800;">${(tx.unit || 'Main') === 'SAP' ? 'SAP CENTER MANAGER' : 'Treasurer'}</div>
                            <div style="font-size: 9px; color: #666;">${(tx.unit || 'Main') === 'SAP' ? 'SAP මධ්‍යස්ථාන කළමනාකරු' : 'භාණ්ඩාගාරික'}</div>
                        </div>
                    </div>
                    <div style="text-align: center; width: 30%;">
                        <div style="border-top: 1.5px solid black; padding-top: 2mm;">
                            <div style="font-size: 11px; font-weight: 800;">Chairman</div>
                            <div style="font-size: 9px; color: #666;">සභාපති</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        printArea.innerHTML = `
            <div style="width: 210mm; background: white;">
                ${voucherHtml('Original Copy - Member')}
                ${voucherHtml('Office Copy - Society')}
            </div>
        `;
    } else {
        // Standard Thermal Layout for Receipts/Transfers - Optimized for 55mm Bluetooth Printers
        let statusTagHtml = '';
        if (tx.memberId && tx.type === 'Receipt') {
            const dues = await window.getMemberDues(tx.memberId);
            if (dues.isInvalid) {
                statusTagHtml = `<div style="text-align: center; border: 1px solid black; margin: 4px 0; font-size: 10px; font-weight: bold;">INVALID MEMBERSHIP</div>`;
            } else if (dues.isNewMember) {
                statusTagHtml = `<div style="text-align: center; border: 1px solid black; margin: 4px 0; font-size: 10px; font-weight: bold;">NEW MEMBER (GRACE)</div>`;
            }
        }

        printArea.innerHTML = `
            <div style="width: 55mm; max-width: 55mm; margin: 0 auto; padding: 1mm; font-family: 'Inter', 'Iskoola Pota', 'Nirmala UI', sans-serif; font-size: 10px; line-height: 1.2; color: black; background: white;">
                
                <div style="text-align: center; margin-bottom: 6px;">
                    <h1 style="font-size: 13px; font-weight: 900; margin: 0; line-height: 1.1; text-transform: uppercase;">${(tx.unit || 'Main') === 'SAP' ? 'SAP CENTER - ARUNALU' : 'Arunalu Welfare Society'}</h1>
                    <div style="font-size: 8px; font-weight: bold;">Galapitiyagama, Nikaweratiya</div>
                    <div style="font-size: 7px; font-weight: bold; color: #333; margin-bottom: 3px; text-transform: uppercase;">${(tx.unit || 'Main') === 'SAP' ? 'SAP CENTER PROJECT - WELFARE BRANCH' : 'Galapitiyagama Sanasa Society <br> Welfare Branch'}</div>
                    <div style="margin-top: 3px; font-weight: 900; text-decoration: underline; font-size: 14px; letter-spacing: 1px;">${title}</div>
                </div>
                
                ${statusTagHtml}

                <div style="display: flex; justify-content: space-between; margin-bottom: 1px;">
                    <span>Date:</span>
                    <span style="font-weight: 900;">${tx.date}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span>Ref:</span>
                    <span style="font-weight: 900;">${tx.reference || '-'}</span>
                </div>

                <div style="border-top: 1px dashed black; border-bottom: 1px dashed black; padding: 3px 0; margin-bottom: 4px;">
                    <div style="margin-bottom: 1px; font-size: 8px;">${tx.type === 'Receipt' ? 'PAYER:' : 'PAYEE:'}</div>
                    <div style="font-weight: 900; font-size: 11px; line-height: 1.1;">${memberLabel}</div>
                </div>

                <div style="width: 100%; margin-bottom: 6px; font-size: 10px; border-bottom: 1px dashed #ccc; padding-bottom: 4px;">
                    ${linesHtml}
                </div>

                <div style="border-top: 1px solid black; padding: 4px 0; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 900; font-size: 12px;">TOTAL:</span>
                    <span style="font-weight: 900; font-size: 13px;">Rs. ${total.toFixed(2)}</span>
                </div>

                ${tx.description ? `
                <div style="margin-bottom: 8px; font-size: 9px;">
                    <span style="text-decoration: underline; display: inline-block; margin-bottom: 1px;">Memo:</span><br>
                    <span style="line-height: 1.1;">${tx.description}</span>
                </div>` : ''}

                <div style="margin-top: 45px; text-align: center; display: flex; justify-content: space-between; gap: 5px;">
                    <div style="border-top: 1px solid black; width: 48%; font-size: 8px; padding-top: 2px; font-weight: bold;">Member/Payer</div>
                    <div style="border-top: 1px solid black; width: 48%; font-size: 8px; padding-top: 2px; font-weight: bold;">${(tx.unit || 'Main') === 'SAP' ? 'Manager' : 'Treasurer'}</div>
                </div>

                ${arrearsHtml}

                <div style="text-align: center; margin-top: 12px; font-size: 8px; font-weight: bold; border-top: 1px dashed #ccc; pt-2">
                    THANK YOU! - IRRASOFT SOLUTION
                </div>
                <div style="height: 10mm;"></div> <!-- Extra space for tearing -->
            </div>
        `;
    }

    // Wait a brief moment to ensure DOM is updated
    requestAnimationFrame(() => {
        setTimeout(() => {
            window.print();
            // Cleanup after print dialog closes
            setTimeout(() => {
                printArea.innerHTML = '';
            }, 500);
        }, 200);
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
                <span class="font-semibold text-gray-800">${tx.date}</span>
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
window.handleTxMemberSelection = async (value) => {
    const container = document.getElementById('duesSummaryContainer');
    if (!container || window.currentUnit === 'SAP') {
        if (container) container.classList.add('hidden');
        return;
    }

    const members = await db.members.toArray();
    const matched = members.find(m => `${m.memberNo} - ${m.name}` === value || String(m.memberNo) === String(value) || m.name === value);

    if (!matched) {
        container.classList.add('hidden');
        return;
    }

    const txDate = document.getElementById('txDate')?.value; const dues = await window.getMemberDues(matched.id, txDate);
    const totalDue = dues.entranceDue + dues.monthlyDue + dues.funeralDue + dues.arrearsDue;

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
                        Renew as New Member (රු. 13,000)
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
                        <div class="text-[10px] opacity-80">ඇතුලත්වීමේ ගාස්තුව රු. 13,000 මාස 6ක් තුල ගෙවා නිම කළ යුතුය. මරණාධාර ලබා ගැනීමට පෙර සම්පූර්ණ මුදල ගෙවිය යුතුය.</div>
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
    if (!confirm("Are you sure you want to renew this membership? This will reset the join date to today and apply the Rs. 13,000 new member fee.")) return;

    try {
        const today = new Date().toISOString().split('T')[0];
        await db.members.update(memberId, {
            joinedDate: today,
            openingEntrancePaid: 0,
            openingPaidUntil: ''
        });

        window.utils.showToast("Membership renewed as a New Member.");
        
        // Refresh the dues display
        const payerInput = document.getElementById('txPayerInput');
        if (payerInput) {
            window.handleTxMemberSelection(payerInput.value);
        }
    } catch (err) {
        console.error(err);
        window.utils.showToast("Error renewing membership", "error");
    }
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

    // 1. Entrance Fee (Max 13,000)
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
    const entranceDue = Math.max(0, 13000 - (entrancePaid + (member.openingEntrancePaid || 0)));

    // 2. Monthly Dues (Rs. 300 total)
    let monthlyDue = 0;
    let monthsBehind = 0; let monthlyAdvance = 0;
    if (joinDateStr !== '') {
        const lastPaidStr = member.openingPaidUntil; 
        let referenceDate = new Date(joinDateStr);

        if (lastPaidStr) {
            referenceDate = new Date(lastPaidStr + (lastPaidStr.length === 7 ? "-01" : ""));
        }

        const now = asOfDate ? new Date(asOfDate) : new Date();
        monthsBehind = (now.getFullYear() - referenceDate.getFullYear()) * 12 + (now.getMonth() - referenceDate.getMonth());

        const totalMonthlyExpected = monthsBehind * 300;
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
        // Re-calculate actual months behind based on remaining balance
        monthsBehind = Math.floor(monthlyDue / 300);
    }

    // 3. Funeral Dues (Rs. 200 each)
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
        const totalFuneralExpected = validFuneralCount * 200;

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
    const isInvalid = monthsBehind >= 6;
    const sixMonthsAgo = new Date();
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

// Funeral Management
window.openFuneralModal = async () => {
    const members = await db.members.toArray();
    const memOptions = members.map(m => `<option value="${m.id}">${m.memberNo} - ${m.name}</option>`).join('');

    const funerals = (await db.funerals.toArray()).reverse();
    const funeralRows = funerals.map(f => {
        const m = members.find(mem => mem.id === f.memberId);
        return `
            <tr class="border-b border-gray-100 hover:bg-gray-50">
                <td class="px-4 py-3 text-sm text-gray-600">${f.date}</td>
                <td class="px-4 py-3 text-sm font-medium text-gray-800">${m ? m.name : 'Unknown'}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${f.description || '-'}</td>
                <td class="px-4 py-3 text-right">
                    <button onclick="window.deleteFuneral(${f.id})" class="text-red-400 hover:text-red-600 transition-colors"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');

    const html = `
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold text-gray-800">Funeral Events Log</h3>
            <button onclick="window.showAddFuneralForm()" class="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-gray-400/30">+ Record New Event</button>
        </div>

        <div id="funeralFormContainer" class="hidden mb-6 bg-gray-50 p-6 rounded-2xl border border-gray-200 animate-fade-in">
            <form onsubmit="window.saveFuneral(event)" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                        <input type="date" id="fDate" required value="${new Date().toISOString().split('T')[0]}" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 outline-none transition-all">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Associated Member</label>
                        <select id="fMember" required class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 outline-none transition-all bg-white">
                            <option value="" disabled selected>Select Member</option>
                            ${memOptions}
                        </select>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description / Note</label>
                    <textarea id="fDesc" rows="2" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 outline-none transition-all resize-none" placeholder="Details about the funeral..."></textarea>
                </div>
                <div class="flex justify-end gap-3 text-sm">
                    <button type="button" onclick="window.showAddFuneralForm(false)" class="text-gray-500 font-bold px-4 py-2">Cancel</button>
                    <button type="submit" class="bg-brand-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-brand-500/30">Save Event Record</button>
                </div>
            </form>
        </div>

        <div class="max-h-[50vh] overflow-auto rounded-xl border border-gray-200 custom-scrollbar">
            <table class="w-full text-left">
                <thead class="bg-gray-100 sticky top-0">
                    <tr>
                        <th class="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Date</th>
                        <th class="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Member Home</th>
                        <th class="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Description</th>
                        <th class="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-50 bg-white">
                    ${funeralRows || '<tr><td colspan="4" class="text-center py-8 text-gray-400 italic">No funeral events recorded yet.</td></tr>'}
                </tbody>
            </table>
        </div>
    `;

    window.utils.showModal(html);
};

window.showAddFuneralForm = (show = true) => {
    const el = document.getElementById('funeralFormContainer');
    if (el) el.classList.toggle('hidden', !show);
};

window.saveFuneral = async (e) => {
    e.preventDefault();
    try {
        const date = document.getElementById('fDate').value;
        const memberId = parseInt(document.getElementById('fMember').value);
        const description = document.getElementById('fDesc').value;

        await db.funerals.add({ date, memberId, description });
        window.utils.showToast("Funeral event logged. Billing will be adjusted automatically.");
        window.openFuneralModal(); // Refresh
    } catch (err) {
        console.error(err);
        window.utils.showToast("Error recording event", "error");
    }
};

window.deleteFuneral = async (id) => {
    if (confirm("Remove this funeral record?")) {
        await db.funerals.delete(id);
        window.openFuneralModal();
    }
};
