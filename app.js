// Main Application Logic
document.addEventListener('DOMContentLoaded', () => {
    // Current date display in header
    const dateOpts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', dateOpts);

    // Global Accounting Unit State
    window.currentUnit = localStorage.getItem('arunalu_unit') || 'Main';

    window.setAccountingUnit = (unit) => {
        window.currentUnit = unit;
        localStorage.setItem('arunalu_unit', unit);
        
        // Update UI Buttons
        const mainBtn = document.getElementById('unit-main-btn');
        const sapBtn = document.getElementById('unit-sap-btn');
        
        if (unit === 'Main') {
            mainBtn.className = "px-3 py-1.5 rounded-lg text-[10px] font-black tracking-tighter transition-all duration-300 bg-white shadow-sm text-blue-600 ring-1 ring-blue-500/10";
            sapBtn.className = "px-3 py-1.5 rounded-lg text-[10px] font-black tracking-tighter transition-all duration-300 text-gray-500 hover:bg-gray-200 hover:text-gray-700";
            document.body.classList.remove('sap-mode');
        } else {
            sapBtn.className = "px-3 py-1.5 rounded-lg text-[10px] font-black tracking-tighter transition-all duration-300 bg-white shadow-sm text-indigo-600 ring-1 ring-indigo-500/10";
            mainBtn.className = "px-3 py-1.5 rounded-lg text-[10px] font-black tracking-tighter transition-all duration-300 text-gray-500 hover:bg-gray-200 hover:text-gray-700";
            document.body.classList.add('sap-mode');
        }
        
        window.utils.showToast(`Switched to ${unit === 'Main' ? 'Main Society' : 'SAP Center'} mode`);
        if (window.refreshCurrentView) window.refreshCurrentView();
    };

    // Initialize UI for current unit
    setTimeout(() => {
        if (window.currentUnit === 'SAP') {
            window.setAccountingUnit('SAP');
        }
    }, 100);

    // Mobile Menu Hookup
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-active');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                sidebar.classList.remove('mobile-active');
            }
        });
    }

    // Navigation state
    let currentView = 'dashboard';
    const navLinks = document.querySelectorAll('.nav-link');
    const contentArea = document.getElementById('app-content');
    const pageTitle = document.getElementById('page-title');

    // Setup Navigation Listeners
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.currentTarget.dataset.view;
            if (view && view !== currentView) {
                switchView(view);

                // Update active state
                navLinks.forEach(l => {
                    l.classList.remove('active-nav');
                    l.style.borderLeft = 'none';
                });

                e.currentTarget.classList.add('active-nav');

                // Close sidebar on mobile after navigation
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('mobile-active');
                }
            }
        });
    });

    // View Switching Logic
    async function switchView(view) {
        currentView = view;
        if (pageTitle) {
            pageTitle.textContent = view.charAt(0).toUpperCase() + view.slice(1);
        }

        const renderers = {
            'dashboard': renderDashboard,
            'members': typeof renderMembers !== 'undefined' ? renderMembers : async () => `<div class="glass-panel p-6 rounded-2xl">Members under construction...</div>`,
            'accounts': typeof renderAccounts !== 'undefined' ? renderAccounts : async () => `<div class="glass-panel p-6 rounded-2xl">Accounts under construction...</div>`,
            'transactions': typeof renderTransactions !== 'undefined' ? renderTransactions : async () => `<div class="glass-panel p-6 rounded-2xl">Transactions under construction...</div>`,
            'reports': typeof renderReports !== 'undefined' ? renderReports : async () => `<div class="glass-panel p-6 rounded-2xl">Reports under construction...</div>`,
            'monthly_book': typeof renderMonthlyBook !== 'undefined' ? renderMonthlyBook : async () => `<div class="glass-panel p-6 rounded-2xl">Monthly Book under construction...</div>`,
            'settings': typeof renderSettings !== 'undefined' ? renderSettings : async () => `<div class="glass-panel p-6 rounded-2xl">Settings under construction...</div>`,
        };

        const htmlContent = await renderers[view]();

        // Apply fade animation
        contentArea.innerHTML = `<div class="fade-enter">${htmlContent}</div>`;

        // Mounter functions to attach event listeners after DOM injection
        const mounters = {
            'members': typeof mountMembers !== 'undefined' ? mountMembers : () => { },
            'accounts': typeof mountAccounts !== 'undefined' ? mountAccounts : () => { },
            'transactions': typeof mountTransactions !== 'undefined' ? mountTransactions : () => { },
            'reports': typeof mountReports !== 'undefined' ? mountReports : () => { },
            'monthly_book': typeof mountMonthlyBook !== 'undefined' ? mountMonthlyBook : () => { },
            'settings': typeof mountSettings !== 'undefined' ? mountSettings : () => { },
            'dashboard': mountDashboard
        };

        requestAnimationFrame(() => {
            const addedElement = contentArea.querySelector('.fade-enter');
            if (addedElement) {
                mounters[view]();
                addedElement.classList.add('fade-enter-active');
                setTimeout(() => {
                    addedElement.classList.remove('fade-enter', 'fade-enter-active');
                }, 300);
            }
        });
    }

    // Expose for external calls
    window.switchView = switchView;
    window.refreshCurrentView = () => switchView(currentView);

    // Dashboard Mount
    async function mountDashboard() { }

    // Dashboard View Builder
    async function renderDashboard() {
        const isSAP = window.currentUnit === 'SAP';
        const accounts = await db.accounts.toArray();
        const txs = await db.transactions.toArray();
        const activeTxs = txs.filter(t => t.status !== 'Cancelled');
        const unitTxs = activeTxs.filter(t => (t.unit || 'Main') === window.currentUnit);
        
        // Calculate key metrics
        const memberCount = await db.members.count();
        
        // Helper for account balance
        const getBal = async (namePart) => {
            const acc = accounts.find(a => a.accountName && a.accountName.includes(namePart));
            if (!acc) return 0;
            const entries = await db.entries.where('accountId').equals(acc.id).toArray();
            let bal = 0;
            entries.forEach(e => {
                if (acc.accountType === 'Asset' || acc.accountType === 'Expense') {
                    bal += (parseFloat(e.debit) || 0) - (parseFloat(e.credit) || 0);
                } else {
                    bal += (parseFloat(e.credit) || 0) - (parseFloat(e.debit) || 0);
                }
            });
            return bal;
        };

        const welfareBal = await getBal('සුභ සාධක අරමුදල්');
        const funeralBal = await getBal('මරණාධාර');
        const sapCashBal = await getBal('SAP මුදල් පොත');
        const sithuminaBal = await getBal('සිතුමිණ තැන්පත්');

        const recentTxs = unitTxs.reverse().slice(0, 5);
        let recentHtml = '';
        if (recentTxs.length === 0) {
            recentHtml = `
            <div class="text-center py-10 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400">
                <i class="fa-solid fa-folder-open text-3xl mb-3 opacity-20"></i>
                <p class="text-sm font-medium">No recent transactions in this unit.</p>
            </div>`;
        } else {
            recentHtml = `<div class="space-y-3">` + recentTxs.map(tx => `
                <div class="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-brand-200 hover:bg-white hover:shadow-sm transition-all group">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-xl flex flex-shrink-0 items-center justify-center ${tx.type === 'Receipt' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'} transition-transform group-hover:scale-110">
                            <i class="fa-solid ${tx.type === 'Receipt' ? 'fa-arrow-down' : 'fa-arrow-up'} text-sm"></i>
                        </div>
                        <div>
                            <div class="font-bold text-gray-900 text-sm tracking-tight">${tx.reference || 'N/A'} <span class="text-[10px] text-gray-400 ml-1 font-normal uppercase tracking-widest">${tx.type}</span></div>
                            <div class="text-[11px] text-gray-500 font-bold mt-0.5">${tx.date}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-black text-gray-900 text-sm">Rs. ${(tx.totalAmount || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</div>
                        <div class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter truncate max-w-[120px]">${tx.description || '-'}</div>
                    </div>
                </div>
            `).join('') + `</div>`;
        }

        const stats = isSAP ? [
            { label: 'SAP මුදල් ශේෂය', value: sapCashBal, icon: 'fa-wallet', color: 'blue', sub: 'Project Cash' },
            { label: 'සිතුමිණ තැන්පතු', value: sithuminaBal, icon: 'fa-bank', color: 'emerald', sub: 'Fixed Deposit' },
            { label: 'සමස්ත ගනුදෙනු', value: unitTxs.length, icon: 'fa-list-check', color: 'amber', sub: 'Total Records' },
            { label: 'පද්ධති තත්ත්වය', value: 'ACTIVE', icon: 'fa-shield-halved', color: 'slate', sub: 'System Secure' }
        ] : [
            { label: 'මුළු සාමාජිකයින්', value: memberCount, icon: 'fa-users', color: 'blue', sub: 'Active Members' },
            { label: 'සුභසාධක අරමුදල', value: welfareBal, icon: 'fa-hand-holding-heart', color: 'emerald', sub: 'Welfare Fund' },
            { label: 'මරණාධාර අරමුදල', value: funeralBal, icon: 'fa-heart-pulse', color: 'rose', sub: 'Funeral Fund' },
            { label: 'පද්ධති තත්ත්වය', value: 'ONLINE', icon: 'fa-cloud', color: 'slate', sub: 'V2.1 Enterprise' }
        ];

        const statsHtml = stats.map(s => `
            <div class="relative overflow-hidden bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group border-b-4 border-b-${s.color}-500">
                <div class="flex items-center gap-4 relative z-10">
                     <div class="w-12 h-12 bg-${s.color}-50 text-${s.color}-600 rounded-2xl flex items-center justify-center text-lg transition-transform group-hover:rotate-12">
                        <i class="fa-solid ${s.icon}"></i>
                     </div>
                     <div>
                        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block">${s.label}</span>
                        <div class="text-2xl font-black text-gray-900 tracking-tighter">${typeof s.value === 'number' ? 'Rs. ' + s.value.toLocaleString(undefined, {maximumFractionDigits:0}) : s.value}</div>
                        <span class="text-[10px] font-bold text-${s.color}-600/70 uppercase tracking-tighter">${s.sub}</span>
                     </div>
                </div>
                <i class="fa-solid ${s.icon} absolute -right-4 -bottom-4 text-7xl text-gray-50 opacity-0 group-hover:opacity-100 transition-opacity"></i>
            </div>
        `).join('');

        return `
            <div class="space-y-8 animate-fade-in">
                <!-- Welcome Banner -->
                <div class="relative bg-gradient-to-r from-gray-900 to-gray-800 p-8 rounded-3xl overflow-hidden shadow-2xl">
                    <div class="relative z-10">
                        <h2 class="text-2xl font-black text-white tracking-tight">ආයුබෝවන්, <span class="text-brand-400">${(auth && auth.session) ? auth.session.name : 'Arunalu Welfare'}!</span></h2>
                        <p class="text-gray-400 text-sm mt-1 font-medium">මෙය ඔබගේ <span class="text-white font-bold underline decoration-brand-500 underline-offset-4">${isSAP ? 'SAP CENTER' : 'MAIN SOCIETY'}</span> මූල්‍ය පාලක පුවරුවයි.</p>
                    </div>
                    <div class="absolute right-10 top-1/2 -translate-y-1/2 opacity-10 hidden md:block">
                        <i class="fa-solid ${isSAP ? 'fa-building-columns' : 'fa-people-roof'} text-9xl text-white"></i>
                    </div>
                    <div class="absolute -left-10 -bottom-10 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl"></div>
                </div>

                <!-- Stats Row -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    ${statsHtml}
                </div>

                <!-- Main Content Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- Recent Activity Panel -->
                    <div class="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <div class="flex justify-between items-center mb-8">
                            <div>
                                <h3 class="text-lg font-black text-gray-900 tracking-tight">අවසන් ගනුදෙනු</h3>
                                <p class="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Recent Activity (${isSAP ? 'SAP' : 'Main'})</p>
                            </div>
                            <button onclick="switchView('transactions')" class="bg-gray-50 hover:bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-xs font-black transition-all border border-gray-100 uppercase tracking-widest">View All</button>
                        </div>
                        ${recentHtml}
                    </div>

                    <!-- Shortcuts Panel -->
                    <div class="space-y-6">
                        <div class="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                            <h3 class="text-lg font-black text-gray-900 tracking-tight mb-6">ක්‍ෂණික ක්‍රියා</h3>
                            <div class="grid grid-cols-1 gap-3">
                                <button onclick="${isSAP ? "switchView('transactions')" : "openMemberModal()"}" class="flex items-center gap-4 p-4 bg-gray-50 hover:bg-white hover:shadow-lg hover:border-brand-200 border border-transparent rounded-2xl transition-all group">
                                    <div class="w-10 h-10 rounded-xl bg-white text-blue-600 flex items-center justify-center border border-gray-100 shadow-sm transition-transform group-hover:scale-110">
                                        <i class="fa-solid ${isSAP ? 'fa-file-invoice-dollar' : 'fa-user-plus'} text-sm"></i>
                                    </div>
                                    <div class="text-left">
                                        <span class="text-sm font-black text-gray-800 block">${isSAP ? 'Add New Receipt' : 'Add New Member'}</span>
                                        <span class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">${isSAP ? 'Income Entry' : 'Member Registration'}</span>
                                    </div>
                                </button>
                                
                                <button onclick="openTransactionModal('Receipt')" class="flex items-center gap-4 p-4 bg-gray-50 hover:bg-white hover:shadow-lg hover:border-brand-200 border border-transparent rounded-2xl transition-all group">
                                    <div class="w-10 h-10 rounded-xl bg-white text-emerald-600 flex items-center justify-center border border-gray-100 shadow-sm transition-transform group-hover:scale-110">
                                        <i class="fa-solid fa-receipt text-sm"></i>
                                    </div>
                                    <div class="text-left">
                                        <span class="text-sm font-black text-gray-800 block">Record Receipt</span>
                                        <span class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Money Inflow</span>
                                    </div>
                                </button>

                                <button onclick="switchView('reports')" class="flex items-center gap-4 p-4 bg-gray-50 hover:bg-white hover:shadow-lg hover:border-brand-200 border border-transparent rounded-2xl transition-all group">
                                    <div class="w-10 h-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center border border-gray-100 shadow-sm transition-transform group-hover:scale-110">
                                        <i class="fa-solid fa-chart-pie text-sm"></i>
                                    </div>
                                    <div class="text-left">
                                        <span class="text-sm font-black text-gray-800 block">Financial Reports</span>
                                        <span class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Audit & Analysis</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <!-- System Badge -->
                        <div class="bg-brand-600 p-8 rounded-3xl text-center relative overflow-hidden shadow-xl shadow-brand-600/30">
                            <div class="relative z-10">
                                <h4 class="text-xs font-black text-brand-100 uppercase tracking-[0.3em]">System Engine</h4>
                                <p class="text-2xl font-black text-white mt-1">IRAASOFT <span class="opacity-50 font-normal">OS</span></p>
                                <div class="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] text-white font-bold border border-white/20">
                                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    ENTERPRISE V2.1
                                </div>
                            </div>
                            <i class="fa-solid fa-microchip absolute -right-6 -bottom-6 text-8xl text-white opacity-5"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }


    // Search Logic
    const globalSearch = document.getElementById('global-search');
    let searchResultsPanel = null;

    if (globalSearch) {
        globalSearch.addEventListener('input', async (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (query.length < 2) {
                if (searchResultsPanel) searchResultsPanel.remove();
                searchResultsPanel = null;
                return;
            }

            if (!searchResultsPanel) {
                searchResultsPanel = document.createElement('div');
                searchResultsPanel.className = 'absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded shadow-xl p-4 z-50 max-h-[400px] overflow-y-auto custom-scrollbar';
                globalSearch.parentElement.appendChild(searchResultsPanel);
            }

            // Search members & transactions
            const members = await db.members.filter(m => m.name.toLowerCase().includes(query) || m.id.toString().includes(query)).toArray();
            const txs = await db.transactions.filter(t => (t.reference && t.reference.toLowerCase().includes(query))).toArray();

            let resultsHtml = `<div class="space-y-3">`;
            if (members.length === 0 && txs.length === 0) {
                resultsHtml += `<div class="text-center py-4 text-gray-400 text-xs font-semibold uppercase">No records matching "${query}"</div>`;
            } else {
                if (members.length > 0) {
                    resultsHtml += `<div><h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Members</h4>`;
                    resultsHtml += members.map(m => `
                        <div onclick="switchView('members');" class="p-3 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100 transition-all cursor-pointer flex items-center gap-3">
                            <div class="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                                <i class="fa-solid fa-user text-xs"></i>
                            </div>
                            <div>
                                <div class="font-semibold text-gray-900 text-sm">${m.name}</div>
                                <div class="text-[10px] text-gray-500 font-medium">${m.membershipNo || 'ID: ' + m.id}</div>
                            </div>
                        </div>
                    `).join('');
                    resultsHtml += `</div>`;
                }

                if (txs.length > 0) {
                    resultsHtml += `<div class="mt-4"><h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Transactions</h4>`;
                    resultsHtml += txs.map(t => `
                        <div onclick="switchView('transactions');" class="p-3 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100 transition-all cursor-pointer flex items-center gap-3">
                            <div class="w-8 h-8 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <i class="fa-solid fa-receipt text-xs"></i>
                            </div>
                            <div>
                                <div class="font-semibold text-gray-900 text-sm">${t.type} • ${t.reference}</div>
                                <div class="text-[10px] text-gray-500 font-medium">${t.date}</div>
                            </div>
                        </div>
                    `).join('');
                    resultsHtml += `</div>`;
                }
            }
            resultsHtml += `</div>`;
            searchResultsPanel.innerHTML = resultsHtml;
        });

        // Close search on clicks outside
        document.addEventListener('mousedown', (e) => {
            if (searchResultsPanel && !globalSearch.parentElement.contains(e.target)) {
                searchResultsPanel.remove();
                searchResultsPanel = null;
            }
        });

        // Ctrl+K Shortcut
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                globalSearch.focus();
            }
        });
    }

    // Initialize Dashboard
    setTimeout(() => switchView('dashboard'), 100);
});
