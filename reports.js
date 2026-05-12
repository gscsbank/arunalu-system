// Reports Module Logic
async function renderReports() {
    return `
        <div class="glass-panel p-6 rounded-2xl h-full flex flex-col no-print bg-white print:bg-white text-gray-800">
            <div class="flex justify-between items-center mb-6 no-print">
                <div>
                    <h3 class="text-xl font-bold text-gray-800">${window.currentUnit === 'SAP' ? 'SAP CENTER - ARUNALU WELFARE' : 'Reports Module'}</h3>
                    <p class="text-sm text-gray-500">${window.currentUnit === 'SAP' ? 'Project financial statements and records' : 'Generate and print accounting reports'}</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="window.triggerReportPrint()" class="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-brand-500/30">
                        <i class="fa-solid fa-print"></i> Print Report
                    </button>
                </div>
            </div>
            
            <div class="mb-6 flex gap-3 no-print flex-wrap">
                <select id="reportType" onchange="generateReport()" class="px-4 py-2 rounded-xl border border-gray-200 focus:border-brand-500 bg-white/50 w-64 outline-none">
                    <option value="trial_balance">ශේෂ පිරික්සුම (Trial Balance)</option>
                    <option value="pnl">ලැබීම් හා ගෙවීම් ප්‍රකාශනය (Receipts & Payments Statement)</option>
                    ${window.currentUnit === 'Main' ? '<option value="balance_sheet">තත්ත්ව ප්‍රකාශය (Balance Sheet)</option>' : ''}
                    <option value="gl_summary">ලෙජර් සාරාංශය (GL Summary)</option>
                    <option value="gl_transactions">ප්‍රධාන ලෙජරය (General Ledger)</option>
                    <option value="account_ledger">ගිණුම් ලෙජරය (Individual Account Ledger)</option>
                    <option value="fixed_assets">ස්ථාවර වත්කම් (Fixed Assets)</option>
                    <option value="bank_summary">බැංකු ගිණුම් සාරාංශය (Bank Summary)</option>
                    <option value="receipt_book">රිසිට්පත් ලේඛනය (Receipt Book - Audit)</option>
                    <option value="member_list">සාමාජික ලැයිස්තුව (Member List)</option>
                    ${window.currentUnit === 'Main' ? '<option value="funerals">මරණ වාර්තා ලේඛනය (Funerals Report)</option>' : ''}
                </select>
                
                <div id="accountSelectorContainer" class="hidden animate-fade-in">
                    <select id="reportAccountId" class="px-4 py-2 rounded-xl border border-brand-200 focus:border-brand-500 bg-white w-64 outline-none shadow-sm">
                        <!-- Populated by JS -->
                    </select>
                </div>
                <div id="monthSelectorContainer" class="hidden animate-fade-in">
                    <input type="month" id="reportMonth" class="px-4 py-2 rounded-xl border border-brand-200 focus:border-brand-500 bg-white w-48 outline-none shadow-sm">
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-sm text-gray-500 font-medium">From:</span>
                    <input type="date" id="reportStartDate" class="px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-500 bg-white/50 outline-none w-36">
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-sm text-gray-500 font-medium">To:</span>
                    <input type="date" id="reportDate" class="px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-500 bg-white/50 outline-none w-36">
                </div>
                <button onclick="generateReport()" class="bg-brand-50 text-brand-600 px-5 py-2 rounded-xl border border-brand-100 hover:bg-brand-100 font-medium">Generate</button>
            </div>

            <!-- Report Content Area (Printed) -->
            <div class="flex-1 overflow-auto bg-white rounded-xl border border-gray-200 p-8 shadow-sm print:border-none print:shadow-none print:p-0 custom-scrollbar">
                <div id="printContainer" class="w-full max-w-4xl mx-auto mx-print print:font-serif">
                    <!-- Report will be injected here -->
                    <div class="text-center py-20 text-gray-400 no-print">Select a report and click Generate to view.</div>
                </div>
            </div>
        </div>
    `;
}

function mountReports() {
    const today = new Date();
    document.getElementById('reportDate').value = today.toISOString().split('T')[0];
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    document.getElementById('reportStartDate').value = firstDay.toISOString().split('T')[0];

    // Populate account selector
    db.accounts.toArray().then(accounts => {
        const sel = document.getElementById('reportAccountId');
        if (sel) {
            sel.innerHTML = accounts.map(a => `<option value="${a.id}">${a.accountName} (${a.accountType})</option>`).join('');
        }
    });

    // Set month selector default
    const monthInput = document.getElementById('reportMonth');
    if (monthInput) {
        monthInput.value = today.toISOString().slice(0, 7); // YYYY-MM
    }

    generateReport();
}

window.generateReport = async () => {
    const type = document.getElementById('reportType').value;
    const date = document.getElementById('reportDate').value;
    const startDate = document.getElementById('reportStartDate').value;
    const printContainer = document.getElementById('printContainer');

    printContainer.innerHTML = '<div class="text-center py-20 text-gray-400 no-print"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Generating...</div>';

    const titles = {
        'trial_balance': 'ශේෂ පිරික්සුම (Trial Balance)',
        'pnl': 'ලැබීම් හා ගෙවීම් ප්‍රකාශනය (Receipts & Payments Statement)',
        'balance_sheet': 'තත්ත්ව ප්‍රකාශය (Balance Sheet)',
        'receipt_payment': 'ලැබීම් හා ගෙවීම් (Receipts & Payments)',
        'gl_summary': 'ලෙජර් සාරාංශය (General Ledger Summary)',
        'gl_transactions': 'ප්‍රධාන ලෙජරය (General Ledger)',
        'account_ledger': 'ගිණුම් ලෙජරය (Individual Account Ledger)',
        'fixed_assets': 'ස්ථාවර වත්කම් සාරාංශය (Fixed Assets)',
        'bank_summary': 'බැංකු ගිණුම් සාරාංශය (Bank Summary)',
        'receipt_book': 'රිසිට්පත් ලේඛනය (Receipt Book Report)',
        'member_list': 'සාමාජික ලැයිස්තුව (Member List)',
        'funerals': 'මරණ වාර්තා ලේඛනය (Funerals Report)'
    };

    // Toggle Account Selector visibility
    const accSel = document.getElementById('accountSelectorContainer');
    if (accSel) {
        accSel.classList.toggle('hidden', type !== 'account_ledger');
    }
    // Toggle Month Selector visibility
    const monthSel = document.getElementById('monthSelectorContainer');
    if (monthSel) {
        monthSel.classList.toggle('hidden', type !== 'monthly_book');
    }



    let dateSubtitle = "දිනය: " + window.utils.formatDate(date);
    if (['pnl', 'receipt_payment', 'gl_transactions', 'receipt_book'].includes(type) && startDate) {
        dateSubtitle = "කාල සීමාව: " + window.utils.formatDate(startDate) + " සිට " + window.utils.formatDate(date) + " දක්වා";
    }

    const headerHtml = `
        <div class="mb-5 border-b-2 border-black pb-4 text-center">
            <h1 class="text-base font-black uppercase tracking-[0.3em] text-gray-900 leading-none whitespace-nowrap">${window.currentUnit === 'SAP' ? 'SAP CENTER - ARUNALU WELFARE' : 'Arunalu Welfare Society'}</h1>
            <p class="text-[8px] font-bold text-gray-500 uppercase tracking-[0.3em] mt-1">Galapitiyagama Sanasa Society</p>
            <div class="mt-3">
                <h2 class="text-sm font-black uppercase tracking-tight text-gray-900">${titles[type] || 'Report'}</h2>
                <div class="inline-block px-2 py-0.5 bg-black text-white text-[8px] font-bold uppercase tracking-widest mt-1">${dateSubtitle}</div>
            </div>
        </div>
    `;

    let contentHtml = '';

    const formatCurrency = (amount) => amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Globals for financial computations
    const accounts = await db.accounts.toArray();
    const entries = await db.entries.toArray();
    const members = await db.members.toArray();
    const funerals = await db.funerals.toArray();

    // Context up to End Date - FILTERED BY UNIT
    const sapCashAccounts = ['SAP මුදල් පොත', 'සිතුමිණ තැන්පත් ගිණුම'];
    const sapCashAccountIds = new Set(accounts.filter(a => sapCashAccounts.some(name => a.accountName && a.accountName.trim() === name)).map(a => a.id));

    const allTxsEnd = await db.transactions.where('date').belowOrEqual(date).toArray();
    
    // For Balance Sheet/Bank Summary in Main unit, we need entries from both Main transactions 
    // AND SAP transactions that involve the specific SAP Cash accounts.
    const isMainUnit = window.currentUnit === 'Main';

    // Standard unit filtering for transactions
    const validTxsEnd = allTxsEnd.filter(t => {
        const txUnit = t.unit || 'Main';
        if (!isMainUnit) return txUnit === 'SAP';
        return txUnit === 'Main';
    });

    const validTxIdsEnd = new Set(validTxsEnd.map(t => t.id));
    
    // Core entries for the current unit - KEEP CLEAN FOR LEDGERS
    let entriesEnd = entries.filter(e => validTxIdsEnd.has(e.transactionId));

    // Context Strictly Period Between
    let validTxsPeriod = validTxsEnd;
    if (startDate) {
        validTxsPeriod = validTxsEnd.filter(t => t.date >= startDate);
    }
    const validTxIdsPeriod = new Set(validTxsPeriod.map(t => t.id));
    
    // Core entries for the period - KEEP CLEAN FOR LEDGERS
    let entriesPeriod = entries.filter(e => validTxIdsPeriod.has(e.transactionId));


    if (type === 'trial_balance' || type === 'gl_summary') {
        let totalDebit = 0;
        let totalCredit = 0;
        let rowsHtml = '';

        for (let acc of accounts) {
            let debit = 0;
            let credit = 0;

            const targetEntries = (type === 'trial_balance') ? entriesEnd : entriesPeriod;
            targetEntries.filter(e => e.accountId === acc.id).forEach(e => {
                debit += parseFloat(e.debit) || 0;
                credit += parseFloat(e.credit) || 0;
            });

            // LOCAL ROLL-UP: Add SAP cash account entries if we are in Main unit and it's a summary report
            if (isMainUnit && sapCashAccountIds.has(acc.id)) {
                const isTrial = (type === 'trial_balance');
                const extraEntries = entries.filter(e => {
                    const tx = allTxsEnd.find(t => t.id === e.transactionId);
                    const isInPeriod = isTrial || (tx && tx.date >= (startDate || '1970-01-01') && tx.date <= date);
                    return tx && tx.status !== 'Cancelled' && tx.unit === 'SAP' && e.accountId === acc.id && isInPeriod;
                });
                extraEntries.forEach(e => {
                    debit += parseFloat(e.debit) || 0;
                    credit += parseFloat(e.credit) || 0;
                });
            }

            let balance = 0;
            let balType = 'DR';
            if (acc.accountType === 'Asset' || acc.accountType === 'Expense') {
                balance = debit - credit;
                if (balance < 0) { balance = Math.abs(balance); balType = 'CR'; }
            } else {
                balance = credit - debit;
                balType = 'CR';
                if (balance < 0) { balance = Math.abs(balance); balType = 'DR'; }
            }

            if (balance === 0) continue;

            let displayDebit = balType === 'DR' ? balance : 0;
            let displayCredit = balType === 'CR' ? balance : 0;

            totalDebit += displayDebit;
            totalCredit += displayCredit;

            rowsHtml += `
            <tr class="border-b border-dashed border-gray-300">
                <td class="py-2 text-sm text-gray-800">${acc.accountName} <span class="text-xs text-gray-400 ml-1">(${acc.accountType})</span></td>
                <td class="py-2 text-sm text-right text-gray-800">${displayDebit > 0 ? formatCurrency(displayDebit) : '-'}</td>
                <td class="py-2 text-sm text-right text-gray-800">${displayCredit > 0 ? formatCurrency(displayCredit) : '-'}</td>
            </tr>
            `;
        }

        contentHtml = `
            <table class="w-full text-left border-collapse mb-8">
                <thead>
                    <tr class="border-b-2 border-gray-800">
                        <th class="py-3 font-bold text-gray-800">ගිණුම් නාමය</th>
                        <th class="py-3 font-bold text-gray-800 text-right">හර (Rs)</th>
                        <th class="py-3 font-bold text-gray-800 text-right">බැර (Rs)</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml || '<tr><td colspan="3" class="py-4 text-center text-gray-500">No balances found.</td></tr>'}
                </tbody>
                <tfoot>
                    <tr class="border-t-2 border-b-4 border-gray-800 font-bold">
                        <td class="py-3 text-right">මුළු එකතුව :</td>
                        <td class="py-3 text-right">${formatCurrency(totalDebit)}</td>
                        <td class="py-3 text-right">${formatCurrency(totalCredit)}</td>
                    </tr>
                </tfoot>
            </table>
        `;
    } else if (type === 'pnl') {
        let totalIncome = 0;
        let totalExpense = 0;
        let incHtml = '';
        let expHtml = '';

        for (let acc of accounts) {
            if (acc.accountType !== 'Income' && acc.accountType !== 'Expense') continue;

            let debit = 0;
            let credit = 0;
            entriesPeriod.filter(e => e.accountId === acc.id).forEach(e => {
                debit += parseFloat(e.debit) || 0;
                credit += parseFloat(e.credit) || 0;
            });

            if (acc.accountType === 'Income') {
                const bal = credit - debit;
                if (bal !== 0) {
                    totalIncome += bal;
                    incHtml += '<tr><td class="py-1.5 pl-6 text-sm">' + acc.accountName + '</td><td class="py-1.5 text-right text-sm pr-4">' + formatCurrency(bal) + '</td></tr>';
                }
            } else if (acc.accountType === 'Expense') {
                const bal = debit - credit;
                if (bal !== 0) {
                    totalExpense += bal;
                    expHtml += '<tr><td class="py-1.5 pl-6 text-sm">' + acc.accountName + '</td><td class="py-1.5 text-right text-sm pr-4">' + formatCurrency(bal) + '</td></tr>';
                }
            }
        }

        const netIncome = totalIncome - totalExpense;

        // Calculate Cash Reconciliation (Valid Assets only)
        const validTxIdsBefore = new Set(validTxsEnd.filter(t => startDate ? t.date < startDate : false).map(t => t.id));
        const entriesBefore = entries.filter(e => validTxIdsBefore.has(e.transactionId));

        let openingCash = 0;
        let closingCash = 0;
        accounts.filter(a => a.accountType === 'Asset').forEach(acc => {
            const eb = entriesBefore.filter(e => e.accountId === acc.id);
            let oCash = eb.reduce((sum, e) => sum + (parseFloat(e.debit) || 0) - (parseFloat(e.credit) || 0), 0);

            const ee = entriesEnd.filter(e => e.accountId === acc.id);
            let cCash = ee.reduce((sum, e) => sum + (parseFloat(e.debit) || 0) - (parseFloat(e.credit) || 0), 0);

            // LOCAL ROLL-UP for P&L Cash Reconciliation
            if (isMainUnit && sapCashAccountIds.has(acc.id)) {
                const sapBefore = entries.filter(e => {
                    const tx = allTxsEnd.find(t => t.id === e.transactionId);
                    return tx && tx.status !== 'Cancelled' && tx.unit === 'SAP' && e.accountId === acc.id && tx.date < (startDate || '1970-01-01');
                });
                oCash += sapBefore.reduce((sum, e) => sum + (parseFloat(e.debit) || 0) - (parseFloat(e.credit) || 0), 0);

                const sapAll = entries.filter(e => {
                    const tx = allTxsEnd.find(t => t.id === e.transactionId);
                    return tx && tx.status !== 'Cancelled' && tx.unit === 'SAP' && e.accountId === acc.id && tx.date <= date;
                });
                cCash += sapAll.reduce((sum, e) => sum + (parseFloat(e.debit) || 0) - (parseFloat(e.credit) || 0), 0);
            }

            openingCash += oCash;
            closingCash += cCash;
        });

        contentHtml = `
            <table class="w-full text-left border-collapse mb-8 max-w-3xl mx-auto border border-gray-200">
                <thead class="bg-gray-100 border-b-2 border-gray-800">
                    <tr><th class="py-3 px-4 font-bold text-gray-800">විස්තරය (Description)</th><th class="py-3 px-4 font-bold text-gray-800 text-right">මුදල (Rs)</th></tr>
                </thead>
                <tbody>
                    <tr class="border-b border-gray-300 bg-gray-50"><td colspan="2" class="py-2 px-4 font-bold text-gray-900">ලැබීම් (Receipts)</td></tr>
                    ${incHtml || '<tr><td colspan="2" class="py-2 pl-8 text-sm text-gray-400">මෙම කාල සීමාව තුළ දත්ත නැත</td></tr>'}
                    <tr class="font-bold border-t border-gray-300"><td class="py-2 pl-6">මුළු ලැබීම්</td><td class="py-2 text-right pr-4">${formatCurrency(totalIncome)}</td></tr>
                    
                    <tr><td colspan="2" class="py-4"></td></tr>
                    
                    <tr class="border-b border-gray-300 border-t bg-gray-50"><td colspan="2" class="py-2 px-4 font-bold text-gray-900">ගෙවීම් (Payments)</td></tr>
                    ${expHtml || '<tr><td colspan="2" class="py-2 pl-8 text-sm text-gray-400">මෙම කාල සීමාව තුළ දත්ත නැත</td></tr>'}
                    <tr class="font-bold border-t border-gray-300"><td class="py-2 pl-6">මුළු ගෙවීම්</td><td class="py-2 text-right pr-4">${formatCurrency(totalExpense)}</td></tr>
                </tbody>
                <tfoot>
                    <tr class="border-t-2 border-b-2 border-gray-800 font-bold bg-gray-100">
                        <td class="py-4 pl-4 text-lg uppercase tracking-tighter font-black">එම කාලය තුළ අතිරික්තය / (ඌණතාවය)</td>
                        <td class="py-4 text-right pr-4 text-lg ${netIncome >= 0 ? 'text-green-700' : 'text-red-600'}">${formatCurrency(netIncome)}</td>
                    </tr>
                    <tr class="border-t border-gray-200 italic text-gray-600">
                        <td class="py-2 pl-4 text-sm font-medium">කාලච්ඡේදය ආරම්භයේ මුදල් ශේෂය (Opening Balance)</td>
                        <td class="py-2 text-right pr-4 text-sm font-medium">${formatCurrency(openingCash)}</td>
                    </tr>
                    <tr class="border-t-2 border-b-4 border-gray-900 bg-gray-50 text-gray-900">
                        <td class="py-3 pl-4 text-sm font-black uppercase tracking-tight">කාලච්ඡේදය අවසානයේ මුදල් ශේෂය (Closing Balance)</td>
                        <td class="py-3 text-right pr-4 text-sm font-black">${formatCurrency(closingCash)}</td>
                    </tr>
                </tfoot>
            </table>
        `;
    } else if (type === 'balance_sheet') {
        let tAssets = 0;
        let tLiab = 0;
        let tEquity = 0;

        let astHtml = '';
        let liabHtml = '';
        let eqHtml = '';

        let retainedEarnings = 0;

        for (let acc of accounts) {
            let debit = 0;
            let credit = 0;
            entriesEnd.filter(e => e.accountId === acc.id).forEach(e => {
                debit += parseFloat(e.debit) || 0;
                credit += parseFloat(e.credit) || 0;
            });

            if (acc.accountType === 'Asset') {
                const bal = debit - credit;
                if (bal !== 0) { tAssets += bal; astHtml += '<tr><td class="py-1.5 pl-6 text-sm">' + acc.accountName + '</td><td class="py-1.5 text-right text-sm">' + formatCurrency(bal) + '</td></tr>'; }
            } else if (acc.accountType === 'Liability') {
                const bal = credit - debit;
                if (bal !== 0) { tLiab += bal; liabHtml += '<tr><td class="py-1.5 pl-6 text-sm">' + acc.accountName + '</td><td class="py-1.5 text-right text-sm">' + formatCurrency(bal) + '</td></tr>'; }
            } else if (acc.accountType === 'Equity') {
                const bal = credit - debit;
                if (bal !== 0) { tEquity += bal; eqHtml += '<tr><td class="py-1.5 pl-6 text-sm">' + acc.accountName + '</td><td class="py-1.5 text-right text-sm">' + formatCurrency(bal) + '</td></tr>'; }
            } else if (acc.accountType === 'Income') {
                retainedEarnings += (credit - debit);
            } else if (acc.accountType === 'Expense') {
                retainedEarnings -= (debit - credit);
            }
        }

        tEquity += retainedEarnings;
        if (retainedEarnings !== 0) {
            eqHtml += '<tr><td class="py-1.5 pl-6 text-sm text-gray-900 font-medium">Retained Earnings (Net Income)</td><td class="py-1.5 text-right text-sm text-gray-900 font-medium">' + formatCurrency(retainedEarnings) + '</td></tr>';
        }

        // Calculate signed totals like a professional system
        let totalAssets = 0;
        let assetRows = '';
        let totalLiabilities = 0;
        let liabilityRows = '';
        let totalEquityBalance = 0;
        let equityRows = '';
        let netProfit = 0;

        for (let acc of accounts) {
            let debit = 0; let credit = 0;
            entriesEnd.filter(e => e.accountId === acc.id).forEach(e => {
                debit += parseFloat(e.debit) || 0;
                credit += parseFloat(e.credit) || 0;
            });

            // LOCAL ROLL-UP for Balance Sheet (Main Society mode only)
            if (isMainUnit && sapCashAccountIds.has(acc.id)) {
                const extraSap = entries.filter(e => {
                    const tx = allTxsEnd.find(t => t.id === e.transactionId);
                    return tx && tx.status !== 'Cancelled' && tx.unit === 'SAP' && e.accountId === acc.id && tx.date <= date;
                });
                extraSap.forEach(e => {
                    debit += parseFloat(e.debit) || 0;
                    credit += parseFloat(e.credit) || 0;
                });
            }

            if (acc.accountType === 'Asset') {
                const bal = debit - credit;
                totalAssets += bal;
                assetRows += `<tr><td class="py-1.5 pl-6 text-sm text-gray-700">${acc.accountName}</td><td class="py-1.5 text-right text-sm ${bal < 0 ? 'text-red-600' : ''}">${bal < 0 ? '(' + formatCurrency(Math.abs(bal)) + ')' : formatCurrency(bal)}</td></tr>`;
            } else if (acc.accountType === 'Liability') {
                const bal = credit - debit; // Standard liability balance
                totalLiabilities += bal;
                liabilityRows += `<tr><td class="py-1.5 pl-6 text-sm text-gray-700">${acc.accountName}</td><td class="py-1.5 text-right text-sm ${bal < 0 ? 'text-red-600' : ''}">${bal < 0 ? '(' + formatCurrency(Math.abs(bal)) + ')' : formatCurrency(bal)}</td></tr>`;
            } else if (acc.accountType === 'Equity') {
                const bal = credit - debit;
                totalEquityBalance += bal;
                equityRows += `<tr><td class="py-1.5 pl-6 text-sm text-gray-700">${acc.accountName}</td><td class="py-1.5 text-right text-sm ${bal < 0 ? 'text-red-600' : ''}">${bal < 0 ? '(' + formatCurrency(Math.abs(bal)) + ')' : formatCurrency(bal)}</td></tr>`;
            } else if (acc.accountType === 'Income') {
                netProfit += (credit - debit);
            } else if (acc.accountType === 'Expense') {
                netProfit -= (debit - credit);
            }
        }

        // Calculate Net Assets as Liabilities + Equity as requested
        const finalEquity = totalEquityBalance + netProfit;
        const netAssets = totalLiabilities + finalEquity;

        contentHtml = `
            <div class="mb-8 border border-gray-200 p-8 rounded-2xl bg-white shadow-sm space-y-8">

                <!-- Assets Section -->
                <div class="space-y-2">
                    <h3 class="text-sm font-black text-gray-900 border-b border-gray-800 pb-1 uppercase">වත්කම් (Assets)</h3>
                    <table class="w-full">
                        <tbody>
                            ${assetRows || '<tr><td class="text-sm text-gray-400 pl-6 italic">දත්ත නැත</td></tr>'}
                        </tbody>
                        <tfoot>
                            <tr class="font-bold border-t border-gray-300">
                                <td class="py-2 pl-4 text-gray-800">මුළු වත්කම් (Total Assets)</td>
                                <td class="py-2 text-right border-b-2 border-gray-800 underline underline-offset-4 decoration-double">${totalAssets < 0 ? '(' + formatCurrency(Math.abs(totalAssets)) + ')' : formatCurrency(totalAssets)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <!-- Liabilities Section -->
                <div class="space-y-2">
                    <h3 class="text-sm font-black text-gray-900 border-b border-gray-800 pb-1 uppercase">බැරකම් (Liabilities)</h3>
                    <table class="w-full">
                        <tbody>
                            ${liabilityRows || '<tr><td class="text-sm text-gray-400 pl-6 italic">දත්ත නැත</td></tr>'}
                        </tbody>
                        <tfoot>
                            <tr class="font-bold border-t border-gray-300">
                                <td class="py-2 pl-4 text-gray-800">මුළු බැරකම් (Total Liabilities)</td>
                                <td class="py-2 text-right border-b-2 border-gray-800 ${totalLiabilities < 0 ? 'text-red-600' : ''}">${totalLiabilities < 0 ? '(' + formatCurrency(Math.abs(totalLiabilities)) + ')' : formatCurrency(totalLiabilities)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <!-- Equity Section -->
                <div class="space-y-2 pt-4">
                    <h3 class="text-sm font-black text-gray-900 border-b border-gray-800 pb-1 uppercase">හිමිකම් (Equity)</h3>
                    <table class="w-full">
                        <tbody>
                            ${equityRows}
                            <tr>
                                <td class="py-1.5 pl-6 text-sm text-gray-700 italic">ශුද්ධ ලාභය/අලාභය (Net Profit/Loss)</td>
                                <td class="py-1.5 text-right text-sm ${netProfit < 0 ? 'text-red-600' : ''}">${netProfit < 0 ? '(' + formatCurrency(Math.abs(netProfit)) + ')' : formatCurrency(netProfit)}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr class="font-bold border-t border-gray-300">
                                <td class="py-2 pl-4 text-gray-800">මුළු හිමිකම (Total Equity)</td>
                                <td class="py-2 text-right border-b-2 border-gray-800">${finalEquity < 0 ? '(' + formatCurrency(Math.abs(finalEquity)) + ')' : formatCurrency(finalEquity)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <!-- Net Assets Calculation (Liabilities + Equity) -->
                <div class="border-y-2 border-gray-900 py-3 flex justify-between items-center bg-gray-50 px-4 mt-8">
                    <span class="text-base font-black text-gray-900 uppercase tracking-tighter">ශුද්ධ වත්කම (NET ASSETS / TOTAL FUNDS)</span>
                    <span class="text-base font-black text-gray-900 underline decoration-double underline-offset-4">${formatCurrency(netAssets)}</span>
                </div>
            </div>
        `;
    } else if (type === 'receipt_payment') {
        const cashBankAccs = accounts.filter(a => a.category === 'Current Asset' && (a.accountName && (a.accountName.toLowerCase().includes('cash') || a.accountName.toLowerCase().includes('bank') || a.accountName.includes('මුදල් පොත') || a.accountName.includes('තැන්පතු'))));
        const cashBankIds = new Set(cashBankAccs.map(a => a.id));

        let openingBal = 0;
        let receipts = 0;
        let payments = 0;
        let recHtml = '';
        let payHtml = '';

        const validTxsBefore = allTxsEnd.filter(t => t.status !== 'Cancelled' && t.date < startDate);
        const setIdsBef = new Set(validTxsBefore.map(t => t.id));
        const entriesBefore = entries.filter(e => setIdsBef.has(e.transactionId) && cashBankIds.has(e.accountId));
        entriesBefore.forEach(e => { openingBal += (parseFloat(e.debit) || 0) - (parseFloat(e.credit) || 0); });

        const recGroups = {};
        const payGroups = {};

        for (let tx of validTxsPeriod) {
            const txE = entriesPeriod.filter(e => e.transactionId === tx.id);
            if (txE.length === 0) continue;

            const isTxReceipt = tx.type === 'Receipt';
            const isTxPayment = tx.type === 'Payment';

            for (let e of txE) {
                if (cashBankIds.has(e.accountId) && !isTxReceipt && !isTxPayment) continue;

                if (isTxReceipt && e.credit > 0) {
                    const aName = accounts.find(a => a.id === e.accountId)?.accountName || 'Unknown Accounts';
                    recGroups[aName] = (recGroups[aName] || 0) + e.credit;
                    receipts += e.credit;
                } else if (isTxPayment && e.debit > 0) {
                    const aName = accounts.find(a => a.id === e.accountId)?.accountName || 'Unknown Accounts';
                    payGroups[aName] = (payGroups[aName] || 0) + e.debit;
                    payments += e.debit;
                }
            }
        }

        for (const [k, v] of Object.entries(recGroups)) { recHtml += '<tr><td class="py-1.5 pl-8 text-sm">' + k + '</td><td class="py-1.5 text-right text-sm pr-4">' + formatCurrency(v) + '</td></tr>'; }
        for (const [k, v] of Object.entries(payGroups)) { payHtml += '<tr><td class="py-1.5 pl-8 text-sm">' + k + '</td><td class="py-1.5 text-right text-sm pr-4">' + formatCurrency(v) + '</td></tr>'; }

        const closingBal = openingBal + receipts - payments;

        contentHtml = `
            <table class="w-full text-left border-collapse mb-8 max-w-3xl mx-auto border border-gray-200">
                <tbody>
                    <tr class="font-bold border-b-2 border-gray-800 bg-gray-100 text-lg"><td class="py-4 pl-4">ආරම්භක ශේෂය (Cash & Bank)</td><td class="py-4 text-right pr-4">${formatCurrency(openingBal)}</td></tr>
                    
                    <tr><td colspan="2" class="py-2"></td></tr>
                    
                    <tr class="border-b-2 border-gray-300 bg-gray-50"><th colspan="2" class="py-2 px-4 text-gray-900">ලැබීම් (Receipts)</th></tr>
                    ${recHtml || '<tr><td colspan="2" class="py-2 pl-8 text-sm text-gray-400">මෙම කාල සීමාව තුළ දත්ත නැත</td></tr>'}
                    <tr class="font-bold border-t border-gray-300"><td class="py-2 pl-6 text-gray-900">මුළු ලැබීම්</td><td class="py-2 text-right pr-4 text-gray-900">${formatCurrency(receipts)}</td></tr>
                    
                    <tr><td colspan="2" class="py-2"></td></tr>

                    <tr class="border-b-2 border-gray-300 bg-gray-50 border-t"><th colspan="2" class="py-2 px-4 text-gray-900">ගෙවීම් (Payments)</th></tr>
                    ${payHtml || '<tr><td colspan="2" class="py-2 pl-8 text-sm text-gray-400">මෙම කාල සීමාව තුළ දත්ත නැත</td></tr>'}
                    <tr class="font-bold border-t border-gray-300"><td class="py-2 pl-6 text-gray-900">මුළු ගෙවීම්</td><td class="py-2 text-right pr-4 text-gray-900">${formatCurrency(payments)}</td></tr>

                </tbody>
                <tfoot>
                    <tr class="border-t-2 border-b-4 border-gray-800 font-bold bg-gray-100 text-lg">
                        <td class="py-4 pl-4">අවසාන ශේෂය (Closing Balance)</td>
                        <td class="py-4 text-right pr-4">${formatCurrency(closingBal)}</td>
                    </tr>
                </tfoot>
            </table>
        `;
    } else if (type === 'gl_transactions') {
        let glHtml = '';

        let txForPeriod = validTxsEnd;
        if (startDate) {
            txForPeriod = validTxsEnd.filter(t => t.date >= startDate);
        }
        const sortedTxs = [...txForPeriod].sort((a, b) => new Date(a.date) - new Date(b.date));

        glHtml += sortedTxs.map(tx => {
            const eT = entries.filter(e => e.transactionId === tx.id);
            
            // Get member info if attached
            let memberInfo = '';
            if (tx.memberId) {
                const m = members.find(mem => mem.id === tx.memberId);
                if (m) memberInfo = ` | <span class="text-xs font-bold text-gray-600">Member: ${m.memberNo} - ${m.name}</span>`;
            }

            const badge = tx.status === 'Cancelled' ? `<br><span class="text-[10px] text-red-600 font-black underline italic">අවලංගු කරන ලදී: ${tx.cancelReason || 'හේතුවක් නැත'}</span>` : '';
            
            return eT.map((e, index) => `
                <tr class="text-sm border-b border-gray-200">
                    <td class="py-2 px-2 text-xs font-bold text-gray-900">${index === 0 ? window.utils.formatDate(tx.date) : ''}</td>
                    <td class="py-2 px-2 text-xs text-gray-500">${index === 0 ? (tx.reference || '-') : ''}</td>
                    <td class="py-2 px-2 text-sm text-gray-800">${index === 0 ? `<strong>${tx.type === 'Receipt' ? 'ලැබීම්' : tx.type === 'Payment' ? 'ගෙවීම්' : 'මාරු කිරීම්'}</strong> - ${tx.description || ''}${memberInfo}${badge}` : ''}</td>
                    <td class="py-2 px-4 text-sm text-gray-700 italic border-l border-gray-100">${accounts.find(a => a.id === e.accountId)?.accountName || '-'}</td>
                    <td class="py-2 px-2 text-right font-medium text-gray-900">${e.debit > 0 ? formatCurrency(e.debit) : '-'}</td>
                    <td class="py-2 px-2 text-right font-medium text-gray-900">${e.credit > 0 ? formatCurrency(e.credit) : '-'}</td>
                </tr>
            `).join('');
        }).join('');

        contentHtml = `
            <table class="w-full text-left border-collapse border-t-4 border-black">
                <thead class="bg-gray-50 border-b-2 border-black">
                    <tr class="uppercase text-[10px] font-black tracking-widest text-gray-900">
                        <th class="py-3 px-2 w-20">දිනය</th>
                        <th class="py-3 px-2 w-16">REF</th>
                        <th class="py-3 px-2">විස්තරය (Transaction)</th>
                        <th class="py-3 px-4">ගිණුම (Account)</th>
                        <th class="py-3 px-2 text-right w-28">හර (Rs)</th>
                        <th class="py-3 px-2 text-right w-28">බැර (Rs)</th>
                    </tr>
                </thead>
                <tbody>
                    ${glHtml || '<tr><td colspan="6" class="py-12 text-center text-gray-400 italic">මෙම කාල සීමාව තුළ ගනුදෙනු නැත</td></tr>'}
                </tbody>
            </table>
        `;
    } else if (type === 'bank_summary' || type === 'fixed_assets') {
        let rowsHtml = '';
        let totalVal = 0;

        for (let acc of accounts) {
            let isTypeMatch = false;

            if (type === 'bank_summary' && (acc.accountType === 'Asset' && (acc.accountName && (acc.accountName.toLowerCase().includes('cash') || acc.accountName.toLowerCase().includes('bank') || acc.accountName.includes('මුදල් පොත') || acc.accountName.includes('තැන්පතු') || acc.accountName.includes('ගිණුම'))))) isTypeMatch = true;
            if (type === 'fixed_assets' && acc.category === 'Fixed Asset') isTypeMatch = true;

            if (!isTypeMatch) continue;

            let debit = 0; let credit = 0;
            entriesEnd.filter(e => e.accountId === acc.id).forEach(e => {
                debit += parseFloat(e.debit) || 0; credit += parseFloat(e.credit) || 0;
            });

            // LOCAL ROLL-UP for Bank Summary
            if (isMainUnit && sapCashAccountIds.has(acc.id)) {
                const extraSap = entries.filter(e => {
                    const tx = allTxsEnd.find(t => t.id === e.transactionId);
                    return tx && tx.status !== 'Cancelled' && tx.unit === 'SAP' && e.accountId === acc.id && tx.date <= date;
                });
                extraSap.forEach(e => {
                    debit += parseFloat(e.debit) || 0;
                    credit += parseFloat(e.credit) || 0;
                });
            }

            let bal = debit - credit;
            if (bal !== 0) {
                totalVal += bal;
                rowsHtml += '<tr><td class="py-2.5 pl-4 text-gray-800">' + acc.accountName + '</td><td class="py-2.5 text-right font-medium pr-4 text-gray-800">' + formatCurrency(bal) + '</td></tr>';
            }
        }

        contentHtml = `
            <table class="w-full text-left border-collapse mb-8 max-w-2xl mx-auto border border-gray-200">
                <thead class="border-b-2 border-gray-800 bg-gray-50">
                    <tr>
                        <th class="py-3 pl-4">ගිණුම් නාමය (Account Name)</th>
                        <th class="py-3 text-right pr-4">අවසාන ශේෂය (Balance) (Rs)</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml || '<tr><td colspan="2" class="py-8 text-center text-gray-400">දත්ත සොයාගත නොහැක</td></tr>'}</tbody>
                <tfoot>
                    <tr class="border-t-2 border-b-4 border-gray-800 font-bold bg-gray-100 text-lg">
                        <td class="py-4 pl-4">මුළු වටිනාකම (Total Value)</td>
                        <td class="py-4 text-right pr-4">${formatCurrency(totalVal)}</td>
                    </tr>
                </tfoot>
            </table>
        `;
    } else if (type === 'receipt_book') {
        const receiptTxs = validTxsPeriod.filter(t => t.type === 'Receipt').sort((a, b) => {
            // Sort by reference (AR000001...)
            return (a.reference || '').localeCompare(b.reference || '', undefined, { numeric: true });
        });

        let rowsHtml = '';
        let grandTotal = 0;

        for (let tx of receiptTxs) {
            const txEntries = entries.filter(e => e.transactionId === tx.id);
            const credits = txEntries.filter(e => e.credit > 0);
            const totalAmount = credits.reduce((sum, e) => sum + (parseFloat(e.credit) || 0), 0);
            grandTotal += totalAmount;

            let memberName = '-';
            if (tx.memberId) {
                const m = members.find(mem => mem.id === tx.memberId);
                if (m) memberName = `${m.memberNo} - ${m.name}`;
            } else if (tx.otherName) {
                memberName = tx.otherName;
            }

            const breakdown = credits.map(e => {
                const acc = accounts.find(a => a.id === e.accountId);
                return `<div class="text-[9px] text-gray-600 flex justify-between">
                    <span>${acc?.accountName || 'Unknown'}</span>
                    <span class="font-bold">${formatCurrency(e.credit)}</span>
                </div>`;
            }).join('');

            const isCan = tx.status === 'Cancelled';
            const canBadge = isCan ? `<br><span class="text-[9px] text-red-600 font-bold italic">CANCELLED: ${tx.cancelReason || '-'}</span>` : '';
            
            rowsHtml += `
                <tr class="border-b border-gray-200 align-top ${isCan ? 'bg-red-50/30' : ''}">
                    <td class="py-3 px-2 text-[10px] font-bold">${window.utils.formatDate(tx.date)}</td>
                    <td class="py-3 px-2 text-[11px] font-black ${isCan ? 'text-red-600' : 'text-brand-700'}">${tx.reference || '-'}${canBadge}</td>
                    <td class="py-3 px-2 text-[10px] font-bold">${memberName}</td>
                    <td class="py-3 px-2">${breakdown}</td>
                    <td class="py-3 px-2 text-right font-black text-[11px] ${isCan ? 'text-red-400' : ''}">${formatCurrency(totalAmount)}</td>
                </tr>
            `;
        }

        contentHtml = `
            <table class="w-full text-left border-collapse border-t-4 border-black">
                <thead class="bg-gray-50 border-b-2 border-black">
                    <tr class="uppercase text-[10px] font-black tracking-widest text-gray-900">
                        <th class="py-3 px-2 w-24">දිනය</th>
                        <th class="py-3 px-2 w-24">අංකය (REF)</th>
                        <th class="py-3 px-2 w-48">සාමාජිකයා / නම</th>
                        <th class="py-3 px-2">විස්තරය (Breakdown)</th>
                        <th class="py-3 px-2 text-right w-32">මුළු මුදල (Rs)</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml || '<tr><td colspan="5" class="py-12 text-center text-gray-400 italic">මෙම කාල සීමාව තුළ ලැබීම් (Receipts) දත්ත නැත</td></tr>'}
                </tbody>
                <tfoot>
                    <tr class="border-t-2 border-b-4 border-gray-900 font-black bg-gray-50">
                        <td colspan="4" class="py-3 px-2 text-right uppercase text-xs">මුළු ලැබීම් එකතුව (Grand Total Receipts):</td>
                        <td class="py-3 px-2 text-right text-sm underline decoration-double">${formatCurrency(grandTotal)}</td>
                    </tr>
                </tfoot>
            </table>
        `;
    } else if (type === 'account_ledger') {
        const accountId = parseInt(document.getElementById('reportAccountId').value);
        const account = accounts.find(a => a.id === accountId);
        if (!account) return;

        // Opening Balance (before StartDate)
        let openingBal = 0;
        const entriesBefore = entries.filter(e => {
            const tx = validTxsEnd.find(t => t.id === e.transactionId);
            return tx && tx.date < startDate && e.accountId === accountId;
        });

        entriesBefore.forEach(e => {
            if (account.accountType === 'Asset' || account.accountType === 'Expense') {
                openingBal += (parseFloat(e.debit) || 0) - (parseFloat(e.credit) || 0);
            } else {
                openingBal += (parseFloat(e.credit) || 0) - (parseFloat(e.debit) || 0);
            }
        });

        // Transactions in Period
        let runningBal = openingBal;
        const rows = entriesPeriod.filter(e => e.accountId === accountId).map(e => {
            const tx = validTxsPeriod.find(t => t.id === e.transactionId);
            const deb = parseFloat(e.debit) || 0;
            const cre = parseFloat(e.credit) || 0;

            if (account.accountType === 'Asset' || account.accountType === 'Expense') {
                runningBal += deb - cre;
            } else {
                runningBal += cre - deb;
            }

            return `
                <tr class="border-b border-gray-200">
                    <td class="py-2 px-2 text-xs">${window.utils.formatDate(tx.date)}</td>
                    <td class="py-2 px-2 text-xs">${tx.reference || '-'}</td>
                    <td class="py-2 px-2 text-sm">${tx.description || '-'}</td>
                    <td class="py-2 px-2 text-sm text-right text-gray-600">${deb > 0 ? formatCurrency(deb) : '-'}</td>
                    <td class="py-2 px-2 text-sm text-right text-gray-600">${cre > 0 ? formatCurrency(cre) : '-'}</td>
                    <td class="py-2 px-2 text-sm text-right font-bold">${formatCurrency(runningBal)}</td>
                </tr>
            `;
        }).join('');

        contentHtml = `
            <div class="mb-4 text-sm font-bold text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200">
                Selected Account: <span class="text-gray-900 underline text-base font-black">${account.accountName}</span> (${account.accountType})
            </div>
            <table class="w-full text-left border-collapse border border-gray-300">
                <thead class="bg-gray-100 border-b-2 border-gray-800 uppercase text-[10px] font-bold tracking-tighter">
                    <tr>
                        <th class="py-2 px-2">දිනය (Date)</th>
                        <th class="py-2 px-2 w-20">REF</th>
                        <th class="py-2 px-2">විස්තරය (Description)</th>
                        <th class="py-2 px-2 text-right">හර (Debit)</th>
                        <th class="py-2 px-2 text-right">බැර (Credit)</th>
                        <th class="py-2 px-2 text-right">ශේෂය (Balance)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="bg-gray-50 font-bold italic border-b border-gray-300">
                        <td colspan="3" class="py-2 px-2 text-xs">ආරම්භක ශේෂය (Opening Balance)</td>
                        <td colspan="2"></td>
                        <td class="py-2 px-2 text-right text-sm">${formatCurrency(openingBal)}</td>
                    </tr>
                    ${rows || '<tr><td colspan="6" class="py-8 text-center text-gray-400 italic">මෙම කාල සීමාව තුළ ගනුදෙනු නැත</td></tr>'}
                </tbody>
                <tfoot>
                    <tr class="bg-gray-800 text-white font-bold">
                        <td colspan="5" class="py-2 px-2 text-right uppercase text-xs">අවසාන ශේෂය (Closing Balance):</td>
                        <td class="py-2 px-2 text-right text-sm border-t-4 border-double border-white">${formatCurrency(runningBal)}</td>
                    </tr>
                </tfoot>
            </table>
        `;
    } else if (type === 'member_list') {
        const sortedMembers = [...members].sort((a, b) => (a.memberNo || '').localeCompare(b.memberNo || '', undefined, {numeric: true}));
        const rows = sortedMembers.map(m => `
            <tr class="border-b border-gray-200">
                <td class="py-2 px-3 text-sm font-bold text-gray-900">${m.memberNo || '-'}</td>
                <td class="py-2 px-3 text-sm font-black text-gray-800">${m.name || '-'}</td>
                <td class="py-2 px-3 text-xs text-gray-600">${m.address || '-'}</td>
                <td class="py-2 px-3 text-xs text-gray-600">${m.phone || '-'}</td>
                <td class="py-2 px-3 text-xs text-gray-500">${m.joinDate || '-'}</td>
                <td class="py-2 px-3 text-xs font-bold text-gray-700">${m.status || 'Active'}</td>
            </tr>
        `).join('');

        contentHtml = `
            <table class="w-full text-left border-collapse border-t-4 border-black">
                <thead class="bg-gray-50 border-b-2 border-black">
                    <tr class="uppercase text-[10px] font-black tracking-widest text-gray-900">
                        <th class="py-3 px-3 w-24">සා.අංකය</th>
                        <th class="py-3 px-3">නම (Name)</th>
                        <th class="py-3 px-3">ලිපිනය (Address)</th>
                        <th class="py-3 px-3 w-28">දුරකථන</th>
                        <th class="py-3 px-3 w-24">බැඳුණු දිනය</th>
                        <th class="py-3 px-3 w-20">තත්ත්වය</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows || '<tr><td colspan="6" class="py-12 text-center text-gray-400 italic">සාමාජිකයින් ලියාපදිංචි වී නැත</td></tr>'}
                </tbody>
            </table>
        `;
    } else if (type === 'funerals') {
        const sortedFunerals = funerals
            .filter(f => (startDate ? f.date >= startDate : true) && (date ? f.date <= date : true))
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        const rows = sortedFunerals.map(f => {
            const m = members.find(mem => mem.id === f.memberId);
            return `
                <tr class="border-b border-gray-200">
                    <td class="py-3 px-3 text-sm font-bold text-gray-900">${f.date}</td>
                    <td class="py-3 px-3 text-sm font-black text-gray-800">${m ? `${m.memberNo} - ${m.name}` : 'Unknown Member'}</td>
                    <td class="py-3 px-3 text-sm text-gray-700">${f.description || '-'}</td>
                </tr>
            `;
        }).join('');

        contentHtml = `
            <table class="w-full text-left border-collapse border-t-4 border-black">
                <thead class="bg-gray-50 border-b-2 border-black">
                    <tr class="uppercase text-[10px] font-black tracking-widest text-gray-900">
                        <th class="py-3 px-3 w-32">දිනය</th>
                        <th class="py-3 px-3">සාමාජිකයා (Member)</th>
                        <th class="py-3 px-3">විස්තරය (Description)</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows || '<tr><td colspan="3" class="py-12 text-center text-gray-400 italic">මෙම කාල සීමාව තුළ මරණ වාර්තා නැත</td></tr>'}
                </tbody>
            </table>
        `;
    }

    const signatureHtml = `
        <div class="mt-20 flex justify-between items-center page-break-inside-avoid">
            <div class="text-center w-64">
                <div class="text-gray-400 text-xs tracking-[0.5em] leading-none mb-1">...........................</div>
                <div class="font-bold text-xs uppercase tracking-wider">${window.currentUnit === 'SAP' ? 'SAP CENTER MANAGER / SAP මධ්‍යස්ථාන කළමනාකරු' : 'Treasurer / භාණ්ඩාගාරික'}</div>
            </div>
            <div class="text-center w-64">
                <div class="text-gray-400 text-xs tracking-[0.5em] leading-none mb-1">...........................</div>
                <div class="font-bold text-xs uppercase tracking-wider">Chairman / සභාපති</div>
            </div>
        </div>
        <div class="mt-12 text-center border-t border-black pt-4">
            <p class="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 leading-none">${window.currentUnit === 'SAP' ? 'SAP CENTER - ARUNALU WELFARE PROJECT' : 'Galapitiyagama Sanasa Welfare Division'}</p>
            <p class="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-1.5 italic">Report Generated by Arunalu Welfare Society Accounting System - Developed by Iraasoft Solution</p>
        </div>
    `;

    printContainer.innerHTML = headerHtml + contentHtml + signatureHtml;
};

window.triggerReportPrint = () => {
    const printArea = document.getElementById('printArea');
    const content = document.getElementById('printContainer').innerHTML;

    if (content.includes('fa-spinner') || content.includes('Select a report')) {
        window.utils.showToast("මුලින් වාර්තාවක් සාදා ගන්න.", "error");
        return;
    }

    printArea.innerHTML = `
        <div style="font-family: 'Inter', 'Iskoola Pota', sans-serif; color: black; width: 100%;">
            <style>
                @media print {
                    @page { size: A4 portrait; margin: 12mm 12mm 12mm 25mm; }
                    body { background: white !important; color: black !important; font-family: 'Inter', 'Iskoola Pota', sans-serif !important; }
                    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    
                    /* Reset colors for BW print */
                    .text-gray-400, .text-gray-500 { color: #666 !important; }
                    .text-gray-900, .text-gray-800, .text-gray-700 { color: #000 !important; }
                    .bg-black { background: black !important; }
                    .text-white { color: white !important; }
                    .border-black { border-color: black !important; }
                    
                    table { width: 100%; border-collapse: collapse; }
                    th { padding: 6pt 5pt !important; font-size: 8.5pt !important; text-transform: uppercase !important; font-weight: 900 !important; text-align: left !important; border-bottom: 1.5pt solid black !important; }
                    td { padding: 5pt 5pt !important; font-size: 9.5pt !important; border-bottom: 0.4pt solid #ccc !important; }
                    tfoot tr td { border-top: 2pt solid black !important; border-bottom: 3pt double black !important; font-weight: 900 !important; font-size: 10pt !important; }
                    .text-right { text-align: right !important; }
                    .font-bold { font-weight: 800 !important; }
                    .pl-6 { padding-left: 18pt !important; }
                    .pl-8 { padding-left: 24pt !important; }
                }
            </style>
            
            ${content}
        </div>
    `;

    requestAnimationFrame(() => {
        setTimeout(() => window.print(), 350);
    });
};

// Monthly Financial Report Book Generator
async function generateMonthlyBook() {
    const printContainer = document.getElementById('printContainer');
    const monthVal = document.getElementById('bookMonth')?.value || document.getElementById('reportMonth')?.value;
    if (!monthVal) { printContainer.innerHTML = '<div class="text-center py-20 text-gray-400">Please select a month.</div>'; return; }

    printContainer.innerHTML = '<div class="text-center py-20 text-gray-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Generating Monthly Book...</div>';

    const [year, month] = monthVal.split('-').map(Number);
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const monthName = monthNames[month - 1];
    const startDate = `${year}-${String(month).padStart(2,'0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;

    const formatCurrency = (a) => a.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
    const accounts = await db.accounts.toArray();
    const entries = await db.entries.toArray();
    const members = await db.members.toArray();
    const funerals = await db.funerals.toArray();
    const sapCashAccounts = ['SAP මුදල් පොත', 'සිතුමිණ තැන්පත් ගිණුම'];
    const sapCashAccountIds = new Set(accounts.filter(a => sapCashAccounts.includes(a.accountName)).map(a => a.id));
    const isMainUnit = window.currentUnit === 'Main';

    const allTxs = await db.transactions.where('date').belowOrEqual(endDate).toArray();
    const validTxsEnd = allTxs.filter(t => {
        if (t.status === 'Cancelled') return false;
        const txUnit = t.unit || 'Main';
        if (!isMainUnit) return txUnit === 'SAP';
        return txUnit === 'Main';
    });

    const validTxIdsEnd = new Set(validTxsEnd.map(t => t.id));
    let entriesEnd = entries.filter(e => validTxIdsEnd.has(e.transactionId));
    
    // Roll-up specific SAP accounts into Main
    if (isMainUnit) {
        const extraSapEntries = entries.filter(e => {
            const tx = allTxs.find(t => t.id === e.transactionId);
            return tx && tx.status !== 'Cancelled' && tx.unit === 'SAP' && sapCashAccountIds.has(e.accountId);
        });
        entriesEnd = [...entriesEnd, ...extraSapEntries];
    }

    const validTxsPeriod = validTxsEnd.filter(t => t.date >= startDate);
    const validTxIdsPeriod = new Set(validTxsPeriod.map(t => t.id));
    const entriesPeriod = entries.filter(e => validTxIdsPeriod.has(e.transactionId));

    const pageBreak = '<div style="page-break-after: always;"></div>';
    const sectionHeader = (title) => `<div class="mb-5 border-b-2 border-black pb-4 text-center">
        <h1 class="text-base font-black uppercase tracking-[0.3em] text-gray-900 leading-none whitespace-nowrap">${isMainUnit ? 'Arunalu Welfare Society' : 'SAP Center - Arunalu Welfare'}</h1>
        <p class="text-[8px] font-bold text-gray-500 uppercase tracking-[0.3em] mt-1">Galapitiyagama Sanasa Society</p>
        <div class="mt-3"><h2 class="text-sm font-black uppercase tracking-tight text-gray-900">${title}</h2>
        <div class="inline-block px-2 py-0.5 bg-black text-white text-[8px] font-bold uppercase tracking-widest mt-1">කාල සීමාව: ${startDate} සිට ${endDate} දක්වා</div></div></div>`;

    // === COVER PAGE ===
    const coverPage = `<div style="display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:90vh;text-align:center;">
        <div style="border:3px solid black;padding:60px 80px;max-width:500px;">
            <h1 style="font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:0.3em;margin:0;">${isMainUnit ? 'Arunalu' : 'SAP CENTER'}</h1>
            <h1 style="font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:0.3em;margin:0;">${isMainUnit ? 'Welfare Society' : 'ARUNALU WELFARE'}</h1>
            <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.4em;color:#666;margin-top:8px;">Galapitiyagama Sanasa Society</p>
            <div style="width:60px;height:3px;background:black;margin:30px auto;"></div>
            <h2 style="font-size:20px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;">Monthly Financial Report</h2>
            <h2 style="font-size:18px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;margin-top:5px;">මාසික මූල්‍ය වාර්තාව</h2>
            <div style="width:60px;height:3px;background:black;margin:30px auto;"></div>
            <p style="font-size:24px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;">${monthName} ${year}</p>
            <p style="font-size:10px;color:#666;margin-top:15px;font-weight:700;text-transform:uppercase;letter-spacing:0.3em;">Period: ${startDate} to ${endDate}</p>
        </div>
        <p style="font-size:8px;color:#999;margin-top:40px;font-weight:600;text-transform:uppercase;letter-spacing:0.3em;">Confidential - For Internal Use Only</p>
    </div>`;

    // === TRIAL BALANCE ===
    let tbRows = ''; let tbDr = 0; let tbCr = 0;
    for (let acc of accounts) {
        let d=0,c=0; entriesEnd.filter(e=>e.accountId===acc.id).forEach(e=>{d+=parseFloat(e.debit)||0;c+=parseFloat(e.credit)||0;});
        let bal=0,bt='DR'; if(acc.accountType==='Asset'||acc.accountType==='Expense'){bal=d-c;if(bal<0){bal=Math.abs(bal);bt='CR';}}else{bal=c-d;bt='CR';if(bal<0){bal=Math.abs(bal);bt='DR';}}
        if(bal===0)continue; let dd=bt==='DR'?bal:0,dc=bt==='CR'?bal:0; tbDr+=dd;tbCr+=dc;
        tbRows+=`<tr class="border-b border-dashed border-gray-300"><td class="py-2 text-sm">${acc.accountName} <span class="text-xs text-gray-400">(${acc.accountType})</span></td><td class="py-2 text-sm text-right">${dd>0?formatCurrency(dd):'-'}</td><td class="py-2 text-sm text-right">${dc>0?formatCurrency(dc):'-'}</td></tr>`;
    }
    const trialBalancePage = sectionHeader('ශේෂ පිරික්සුම (Trial Balance)') + `<table class="w-full text-left border-collapse mb-8"><thead><tr class="border-b-2 border-gray-800"><th class="py-3 font-bold">ගිණුම් නාමය</th><th class="py-3 font-bold text-right">හර (Rs)</th><th class="py-3 font-bold text-right">බැර (Rs)</th></tr></thead><tbody>${tbRows}</tbody><tfoot><tr class="border-t-2 border-b-4 border-gray-800 font-bold"><td class="py-3 text-right">මුළු එකතුව :</td><td class="py-3 text-right">${formatCurrency(tbDr)}</td><td class="py-3 text-right">${formatCurrency(tbCr)}</td></tr></tfoot></table>`;

    // === PNL (Receipts & Payments Statement) ===
    let tInc=0,tExp=0,incH='',expH='';
    for(let acc of accounts){if(acc.accountType!=='Income'&&acc.accountType!=='Expense')continue;let d=0,c=0;entriesPeriod.filter(e=>e.accountId===acc.id).forEach(e=>{d+=parseFloat(e.debit)||0;c+=parseFloat(e.credit)||0;});
    if(acc.accountType==='Income'){const b=c-d;if(b!==0){tInc+=b;incH+=`<tr><td class="py-1.5 pl-6 text-sm">${acc.accountName}</td><td class="py-1.5 text-right text-sm">${formatCurrency(b)}</td></tr>`;}}
    else{const b=d-c;if(b!==0){tExp+=b;expH+=`<tr><td class="py-1.5 pl-6 text-sm">${acc.accountName}</td><td class="py-1.5 text-right text-sm">${formatCurrency(b)}</td></tr>`;}}}
    const netInc=tInc-tExp;
    const pnlPage = sectionHeader('ලැබීම් හා ගෙවීම් ප්‍රකාශනය (Receipts & Payments Statement)') + `<table class="w-full text-left border-collapse mb-8 border border-gray-200"><thead class="bg-gray-100 border-b-2 border-gray-800"><tr><th class="py-3 px-4 font-bold">විස්තරය</th><th class="py-3 px-4 font-bold text-right">මුදල (Rs)</th></tr></thead><tbody><tr class="border-b border-gray-300 bg-gray-50"><td colspan="2" class="py-2 px-4 font-bold">ලැබීම් (Receipts)</td></tr>${incH||'<tr><td colspan="2" class="py-2 pl-8 text-sm text-gray-400">දත්ත නැත</td></tr>'}<tr class="font-bold border-t border-gray-300"><td class="py-2 pl-6">මුළු ලැබීම්</td><td class="py-2 text-right pr-4">${formatCurrency(tInc)}</td></tr><tr><td colspan="2" class="py-4"></td></tr><tr class="border-b border-gray-300 border-t bg-gray-50"><td colspan="2" class="py-2 px-4 font-bold">ගෙවීම් (Payments)</td></tr>${expH||'<tr><td colspan="2" class="py-2 pl-8 text-sm text-gray-400">දත්ත නැත</td></tr>'}<tr class="font-bold border-t border-gray-300"><td class="py-2 pl-6">මුළු ගෙවීම්</td><td class="py-2 text-right pr-4">${formatCurrency(tExp)}</td></tr></tbody><tfoot><tr class="border-t-2 border-b-2 border-gray-800 font-bold bg-gray-100"><td class="py-4 pl-4 text-lg uppercase tracking-tighter font-black">අතිරික්තය / (ඌණතාවය)</td><td class="py-4 text-right pr-4 text-lg">${formatCurrency(netInc)}</td></tr></tfoot></table>`;

    // === BALANCE SHEET ===
    let tA=0,aR='',tL=0,lR='',tEq=0,eR='',nP=0;
    for(let acc of accounts){let d=0,c=0;entriesEnd.filter(e=>e.accountId===acc.id).forEach(e=>{d+=parseFloat(e.debit)||0;c+=parseFloat(e.credit)||0;});
    if(acc.accountType==='Asset'){const b=d-c;tA+=b;aR+=`<tr><td class="py-1.5 pl-6 text-sm">${acc.accountName}</td><td class="py-1.5 text-right text-sm">${formatCurrency(b)}</td></tr>`;}
    else if(acc.accountType==='Liability'){const b=c-d;tL+=b;lR+=`<tr><td class="py-1.5 pl-6 text-sm">${acc.accountName}</td><td class="py-1.5 text-right text-sm">${formatCurrency(b)}</td></tr>`;}
    else if(acc.accountType==='Equity'){const b=c-d;tEq+=b;eR+=`<tr><td class="py-1.5 pl-6 text-sm">${acc.accountName}</td><td class="py-1.5 text-right text-sm">${formatCurrency(b)}</td></tr>`;}
    else if(acc.accountType==='Income'){nP+=(c-d);}else if(acc.accountType==='Expense'){nP-=(d-c);}}
    const nA=tA+tL;const fEq=tEq+nP;
    const bsPage = sectionHeader('තත්ත්ව ප්‍රකාශය (Balance Sheet)') + `<div class="space-y-6"><div><h3 class="text-sm font-black border-b border-gray-800 pb-1 uppercase">වත්කම් (Assets)</h3><table class="w-full"><tbody>${aR}</tbody><tfoot><tr class="font-bold border-t border-gray-300"><td class="py-2 pl-4">මුළු වත්කම්</td><td class="py-2 text-right">${formatCurrency(tA)}</td></tr></tfoot></table></div><div><h3 class="text-sm font-black border-b border-gray-800 pb-1 uppercase">බැරකම් (Liabilities)</h3><table class="w-full"><tbody>${lR||'<tr><td class="text-sm text-gray-400 pl-6 italic">දත්ත නැත</td></tr>'}</tbody><tfoot><tr class="font-bold border-t border-gray-300"><td class="py-2 pl-4">මුළු බැරකම්</td><td class="py-2 text-right">${formatCurrency(tL)}</td></tr></tfoot></table></div><div class="border-y-2 border-gray-900 py-3 flex justify-between items-center px-4"><span class="text-base font-black uppercase">ශුද්ධ වත්කම (NET ASSETS)</span><span class="text-base font-black underline decoration-double underline-offset-4">${formatCurrency(nA)}</span></div><div><h3 class="text-sm font-black border-b border-gray-800 pb-1 uppercase mt-4">හිමිකම් (Equity)</h3><table class="w-full"><tbody>${eR}<tr><td class="py-1.5 pl-6 text-sm italic">ශුද්ධ ලාභය (Net Profit/Loss)</td><td class="py-1.5 text-right text-sm">${formatCurrency(nP)}</td></tr></tbody><tfoot><tr class="font-bold border-t border-gray-300"><td class="py-2 pl-4">මුළු හිමිකම</td><td class="py-2 text-right underline underline-offset-4 decoration-double">${formatCurrency(fEq)}</td></tr></tfoot></table></div></div>`;

    // === BANK SUMMARY ===
    let bkR='',bkT=0;
    for(let acc of accounts){if(!(acc.accountType==='Asset'&&acc.accountName&&(acc.accountName.toLowerCase().includes('cash')||acc.accountName.toLowerCase().includes('bank')||acc.accountName.includes('මුදල් පොත')||acc.accountName.includes('තැන්පතු')||acc.accountName.includes('ගිණුම'))))continue;let d=0,c=0;entriesEnd.filter(e=>e.accountId===acc.id).forEach(e=>{d+=parseFloat(e.debit)||0;c+=parseFloat(e.credit)||0;});let b=d-c;if(b!==0){bkT+=b;bkR+=`<tr><td class="py-2.5 pl-4">${acc.accountName}</td><td class="py-2.5 text-right font-medium pr-4">${formatCurrency(b)}</td></tr>`;}}
    const bankPage = sectionHeader('බැංකු ගිණුම් සාරාංශය (Bank Summary)') + `<table class="w-full text-left border-collapse mb-8 border border-gray-200"><thead class="border-b-2 border-gray-800 bg-gray-50"><tr><th class="py-3 pl-4">ගිණුම් නාමය</th><th class="py-3 text-right pr-4">ශේෂය (Rs)</th></tr></thead><tbody>${bkR||'<tr><td colspan="2" class="py-8 text-center text-gray-400">දත්ත නැත</td></tr>'}</tbody><tfoot><tr class="border-t-2 border-b-4 border-gray-800 font-bold bg-gray-100 text-lg"><td class="py-4 pl-4">මුළු වටිනාකම</td><td class="py-4 text-right pr-4">${formatCurrency(bkT)}</td></tr></tfoot></table>`;

    // === GL SUMMARY ===
    let glsRows='',glsDr=0,glsCr=0;
    for(let acc of accounts){let d=0,c=0;entriesPeriod.filter(e=>e.accountId===acc.id).forEach(e=>{d+=parseFloat(e.debit)||0;c+=parseFloat(e.credit)||0;});
    let bal=0,bt='DR';if(acc.accountType==='Asset'||acc.accountType==='Expense'){bal=d-c;if(bal<0){bal=Math.abs(bal);bt='CR';}}else{bal=c-d;bt='CR';if(bal<0){bal=Math.abs(bal);bt='DR';}}
    if(bal===0)continue;let dd=bt==='DR'?bal:0,dc=bt==='CR'?bal:0;glsDr+=dd;glsCr+=dc;
    glsRows+=`<tr class="border-b border-dashed border-gray-300"><td class="py-2 text-sm">${acc.accountName} <span class="text-xs text-gray-400">(${acc.accountType})</span></td><td class="py-2 text-sm text-right">${dd>0?formatCurrency(dd):'-'}</td><td class="py-2 text-sm text-right">${dc>0?formatCurrency(dc):'-'}</td></tr>`;}
    const glSummaryPage = sectionHeader('ලෙජර් සාරාංශය (GL Summary)') + `<table class="w-full text-left border-collapse mb-8"><thead><tr class="border-b-2 border-gray-800"><th class="py-3 font-bold">ගිණුම් නාමය</th><th class="py-3 font-bold text-right">හර (Rs)</th><th class="py-3 font-bold text-right">බැර (Rs)</th></tr></thead><tbody>${glsRows}</tbody><tfoot><tr class="border-t-2 border-b-4 border-gray-800 font-bold"><td class="py-3 text-right">මුළු එකතුව :</td><td class="py-3 text-right">${formatCurrency(glsDr)}</td><td class="py-3 text-right">${formatCurrency(glsCr)}</td></tr></tfoot></table>`;

    // === GENERAL LEDGER ===
    let glHtml='';
    const sortedTxs=[...validTxsPeriod].sort((a,b)=>new Date(a.date)-new Date(b.date));
    glHtml+=sortedTxs.map(tx=>{const eT=entries.filter(e=>e.transactionId===tx.id);let mi='';if(tx.memberId){const m=members.find(mem=>mem.id===tx.memberId);if(m)mi=` | <span class="text-xs font-bold">${m.memberNo} - ${m.name}</span>`;}
    return eT.map((e,i)=>`<tr class="text-sm border-b border-gray-200"><td class="py-2 px-2 text-xs font-bold">${i===0?tx.date:''}</td><td class="py-2 px-2 text-xs">${i===0?(tx.reference||'-'):''}</td><td class="py-2 px-2 text-sm">${i===0?`<strong>${tx.type==='Receipt'?'ලැබීම්':tx.type==='Payment'?'ගෙවීම්':'මාරු'}</strong> - ${tx.description||''}${mi}`:''}</td><td class="py-2 px-4 text-sm italic border-l border-gray-100">${accounts.find(a=>a.id===e.accountId)?.accountName||'-'}</td><td class="py-2 px-2 text-right font-medium">${e.debit>0?formatCurrency(e.debit):'-'}</td><td class="py-2 px-2 text-right font-medium">${e.credit>0?formatCurrency(e.credit):'-'}</td></tr>`).join('');}).join('');
    const glPage = sectionHeader('ප්‍රධාන ලෙජරය (General Ledger)') + `<table class="w-full text-left border-collapse border-t-4 border-black"><thead class="bg-gray-50 border-b-2 border-black"><tr class="uppercase text-[10px] font-black tracking-widest"><th class="py-3 px-2 w-20">දිනය</th><th class="py-3 px-2 w-16">REF</th><th class="py-3 px-2">විස්තරය</th><th class="py-3 px-4">ගිණුම</th><th class="py-3 px-2 text-right w-28">හර (Rs)</th><th class="py-3 px-2 text-right w-28">බැර (Rs)</th></tr></thead><tbody>${glHtml||'<tr><td colspan="6" class="py-12 text-center text-gray-400 italic">ගනුදෙනු නැත</td></tr>'}</tbody></table>`;

    // === FIXED ASSETS ===
    let faR='',faT=0;
    for(let acc of accounts){if(acc.category!=='Fixed Asset')continue;let d=0,c=0;entriesEnd.filter(e=>e.accountId===acc.id).forEach(e=>{d+=parseFloat(e.debit)||0;c+=parseFloat(e.credit)||0;});let b=d-c;if(b!==0){faT+=b;faR+=`<tr><td class="py-2.5 pl-4">${acc.accountName}</td><td class="py-2.5 text-right font-medium pr-4">${formatCurrency(b)}</td></tr>`;}}
    const fixedAssetsPage = sectionHeader('ස්ථාවර වත්කම් සාරාංශය (Fixed Assets)') + `<table class="w-full text-left border-collapse mb-8 border border-gray-200"><thead class="border-b-2 border-gray-800 bg-gray-50"><tr><th class="py-3 pl-4">ගිණුම් නාමය</th><th class="py-3 text-right pr-4">වටිනාකම (Rs)</th></tr></thead><tbody>${faR||'<tr><td colspan="2" class="py-8 text-center text-gray-400">දත්ත නැත</td></tr>'}</tbody><tfoot><tr class="border-t-2 border-b-4 border-gray-800 font-bold bg-gray-100 text-lg"><td class="py-4 pl-4">මුළු වටිනාකම</td><td class="py-4 text-right pr-4">${formatCurrency(faT)}</td></tr></tfoot></table>`;

    // === INTERNAL AUDIT PAGE ===
    const auditPage = `<div style="display:flex;flex-direction:column;justify-content:center;min-height:85vh;text-align:center;">
        <div style="border:2px solid black;padding:40px 50px;max-width:550px;margin:0 auto;">
            <h2 style="font-size:16px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;margin-bottom:5px;">Internal Audit Verification</h2>
            <h3 style="font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:25px;">අභ්‍යන්තර විගණන සහතිකය</h3>
            <p style="font-size:10px;color:#666;margin-bottom:30px;line-height:1.8;">
                We hereby certify that we have examined the financial records of<br><strong>${isMainUnit ? 'Arunalu Welfare Society' : 'SAP Center Project - Arunalu Welfare'}</strong><br>for the month of <strong>${monthName} ${year}</strong> and found them to be accurate and in order.<br>
                <span style="font-weight:700;display:block;margin-top:10px;">මෙයින් අප සහතික කරනු ලබන්නේ ${isMainUnit ? 'අරුණළු සුභසාධක සමිතිය' : 'අරුණළු සුභසාධක - SAP මධ්‍යස්ථාන ව්‍යාපෘතිය'} හි ${monthName} ${year} මාසය සඳහා වූ මූල්‍ය වාර්තා අප විසින් පරීක්ෂා කළ බවත්, ඒවා නිවැරදි සහ විධිමත් බවත්ය.</span>
            </p>
            <div style="width:60px;height:2px;background:black;margin:25px auto;"></div>
            <div style="display:flex;justify-content:space-between;margin-top:50px;">
                <div style="text-align:center;width:200px;"><div style="letter-spacing:0.3em;color:#aaa;font-size:10px;">...........................</div><div style="font-size:10px;font-weight:800;text-transform:uppercase;margin-top:5px;">${isMainUnit ? 'Treasurer / භාණ්ඩාගාරික' : 'SAP CENTER MANAGER / SAP මධ්‍යස්ථාන කළමනාකරු'}</div></div>
                <div style="text-align:center;width:200px;"><div style="letter-spacing:0.3em;color:#aaa;font-size:10px;">...........................</div><div style="font-size:10px;font-weight:800;text-transform:uppercase;margin-top:5px;">Chairman / සභාපති</div></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:45px;">
                <div style="text-align:center;width:200px;"><div style="letter-spacing:0.3em;color:#aaa;font-size:10px;">...........................</div><div style="font-size:10px;font-weight:800;text-transform:uppercase;margin-top:5px;">Secretary / ලේකම්</div></div>
                <div style="text-align:center;width:200px;"><div style="letter-spacing:0.3em;color:#aaa;font-size:10px;">...........................</div><div style="font-size:10px;font-weight:800;text-transform:uppercase;margin-top:5px;">Internal Auditor / විගණක</div></div>
            </div>
            <div style="margin-top:45px;border-top:1px solid #ccc;padding-top:15px;">
                <p style="font-size:9px;color:#999;font-weight:700;">Date / දිනය: ................................</p>
            </div>
        </div>
        <p style="font-size:10px;color:#777;margin-top:30px;font-weight:600;text-transform:uppercase;letter-spacing:0.2em;">Galapitiyagama Sanasa ${isMainUnit ? 'Welfare Division' : 'SAP Center Project'}</p>
        <p style="font-size:9px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;margin-top:3px;">Report Generated by Arunalu Welfare Society Accounting System - Developed by Iraasoft Solution</p>
    </div>`;

    // Combine all pages
    printContainer.innerHTML = coverPage + pageBreak + trialBalancePage + pageBreak + pnlPage + (isMainUnit ? (pageBreak + bsPage) : '') + pageBreak + glSummaryPage + pageBreak + glPage + pageBreak + bankPage + pageBreak + fixedAssetsPage + pageBreak + auditPage;
}

// === STANDALONE MONTHLY BOOK VIEW ===
async function renderMonthlyBook() {
    return `
        <div class="glass-panel p-6 rounded-2xl h-full flex flex-col no-print bg-white text-gray-800">
            <div class="flex justify-between items-center mb-6 no-print">
                <div>
                    <h3 class="text-xl font-bold text-gray-800 flex items-center gap-2"><i class="fa-solid fa-book text-indigo-600"></i> Monthly Financial Report Book</h3>
                    <p class="text-sm text-gray-500">Generate a complete monthly report book for audit</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="window.triggerReportPrint()" class="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-brand-500/30">
                        <i class="fa-solid fa-print"></i> Print Book
                    </button>
                </div>
            </div>
            <div class="mb-6 flex gap-3 no-print items-center">
                <span class="text-sm text-gray-500 font-medium">Select Month:</span>
                <input type="month" id="bookMonth" class="px-4 py-2 rounded-xl border border-gray-200 focus:border-brand-500 bg-white w-48 outline-none">
                <button onclick="generateMonthlyBook()" class="bg-brand-50 text-brand-600 px-5 py-2 rounded-xl border border-brand-100 hover:bg-brand-100 font-medium">Generate Book</button>
            </div>
            <div class="flex-1 overflow-auto bg-white rounded-xl border border-gray-200 p-8 shadow-sm print:border-none print:shadow-none print:p-0 custom-scrollbar">
                <div id="printContainer" class="w-full max-w-4xl mx-auto">
                    <div class="text-center py-20 text-gray-400 no-print">Select a month and click Generate Book to preview.</div>
                </div>
            </div>
        </div>
    `;
}

function mountMonthlyBook() {
    const monthInput = document.getElementById('bookMonth');
    if (monthInput) {
        monthInput.value = new Date().toISOString().slice(0, 7);
    }
}
