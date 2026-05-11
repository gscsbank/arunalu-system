// Main Application Logic
document.addEventListener('DOMContentLoaded', () => {
    // Current date display in header
    const dateOpts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', dateOpts);

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
        const memberCount = await db.members.count();
        const accountCount = await db.accounts.count();
        const txCount = await db.transactions.count();

        const recentTxs = (await db.transactions.toArray()).reverse().slice(0, 5);
        let recentHtml = '';
        if (recentTxs.length === 0) {
            recentHtml = `
            <div class="text-center py-10 border-2 border-dashed border-gray-100 rounded-lg text-gray-400">
                <p class="text-sm">No recent activity detected.</p>
            </div>`;
        } else {
            recentHtml = `<div class="border border-gray-200 rounded-lg overflow-hidden">` + recentTxs.map(tx => `
                <div class="flex items-center justify-between p-4 bg-white border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <div class="flex items-center gap-4">
                        <div class="w-8 h-8 rounded flex flex-shrink-0 items-center justify-center ${tx.type === 'Receipt' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}">
                            <i class="fa-solid ${tx.type === 'Receipt' ? 'fa-arrow-down' : 'fa-arrow-up'} text-xs"></i>
                        </div>
                        <div>
                            <div class="font-semibold text-gray-900 text-sm">${tx.type} • ${tx.reference || 'N/A'}</div>
                            <div class="text-[11px] text-gray-500 font-medium">${tx.date}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold text-gray-900 text-sm">Rs. ${(tx.totalAmount || 0).toFixed(2)}</div>
                    </div>
                </div>
            `).join('') + `</div>`;
        }

        return `
            <div class="space-y-6">
                <!-- Stats Row -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="card p-5">
                        <div class="flex items-center gap-4 mb-2">
                             <div class="w-10 h-10 bg-blue-50 text-blue-600 rounded flex items-center justify-center"><i class="fa-solid fa-users"></i></div>
                             <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Members</span>
                        </div>
                        <div class="text-2xl font-bold text-gray-900 ml-14">${memberCount}</div>
                    </div>
                    
                    <div class="card p-5">
                        <div class="flex items-center gap-4 mb-2">
                             <div class="w-10 h-10 bg-emerald-50 text-emerald-600 rounded flex items-center justify-center"><i class="fa-solid fa-folder"></i></div>
                             <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Accounts</span>
                        </div>
                        <div class="text-2xl font-bold text-gray-900 ml-14">${accountCount}</div>
                    </div>

                    <div class="card p-5">
                        <div class="flex items-center gap-4 mb-2">
                             <div class="w-10 h-10 bg-amber-50 text-amber-600 rounded flex items-center justify-center"><i class="fa-solid fa-clock-rotate-left"></i></div>
                             <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Activity</span>
                        </div>
                        <div class="text-2xl font-bold text-gray-900 ml-14">${txCount}</div>
                    </div>

                    <div class="card p-5">
                        <div class="flex items-center gap-4 mb-2">
                             <div class="w-10 h-10 bg-slate-100 text-slate-600 rounded flex items-center justify-center"><i class="fa-solid fa-check"></i></div>
                             <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">System Status</span>
                        </div>
                        <div class="text-sm font-semibold text-emerald-600 ml-14 mt-1">ONLINE</div>
                    </div>
                </div>

                <!-- Main Content Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Recent Activity Panel -->
                    <div class="lg:col-span-2 card p-6">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-base font-bold text-gray-900">Recent Transactions</h3>
                            <button onclick="switchView('transactions')" class="text-xs font-semibold text-blue-600 hover:underline">View All</button>
                        </div>
                        ${recentHtml}
                    </div>

                    <!-- Shortcuts Panel -->
                    <div class="card p-6">
                        <h3 class="text-base font-bold text-gray-900 mb-6">Standard Actions</h3>
                        <div class="flex flex-col gap-2">
                            <button onclick="openMemberModal()" class="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-all">
                                <div class="w-8 h-8 rounded bg-white text-blue-600 flex items-center justify-center border border-gray-200 shadow-sm">
                                    <i class="fa-solid fa-user-plus text-xs"></i>
                                </div>
                                <span class="text-sm font-semibold text-gray-700">Add New Member</span>
                            </button>
                            <button onclick="openTransactionModal('Receipt')" class="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-all">
                                <div class="w-8 h-8 rounded bg-white text-emerald-600 flex items-center justify-center border border-gray-200 shadow-sm">
                                    <i class="fa-solid fa-plus text-xs"></i>
                                </div>
                                <span class="text-sm font-semibold text-gray-700">Record Receipt</span>
                            </button>
                            <button onclick="switchView('reports')" class="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-all">
                                <div class="w-8 h-8 rounded bg-white text-indigo-600 flex items-center justify-center border border-gray-200 shadow-sm">
                                    <i class="fa-solid fa-file-lines text-xs"></i>
                                </div>
                                <span class="text-sm font-semibold text-gray-700">View Reports</span>
                            </button>
                        </div>
                        
                        <div class="mt-8 bg-blue-50 border border-blue-100 p-4 rounded text-center">
                            <h4 class="text-xs font-bold text-blue-800 uppercase tracking-tighter">System Version</h4>
                            <p class="text-[10px] text-blue-600 font-bold mt-1">V2.1 ENTERPRISE EDITION</p>
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
