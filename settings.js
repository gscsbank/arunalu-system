// Settings Module - Handle dynamic dues rates
async function renderSettings() {
    const allSettings = await db.settings.toArray();
    const users = await db.users.toArray();

    const types = [
        { key: 'ඇතුලත්වීමේ ගාස්තු ලැබීම්', label: 'ඇතුලත්වීමේ ගාස්තුව (Entrance Fee)', default: 13000 },
        { key: 'දායක අරමුදල් ලැබීම්', label: 'දායක අරමුදල (Contribution - Rs. 100)', default: 100 },
        { key: 'සාමාජික අරමුදල් ලැබීම්', label: 'සාමාජික අරමුදල (Membership - Rs. 200)', default: 200 },
        { key: 'සුභ සාධක අරමුදල් ලැබීම්', label: 'සුභ සාධක අරමුදල (Funeral - Rs. 200)', default: 200 }
    ];

    let ratesHtml = '';
    for (let t of types) {
        const history = allSettings.filter(s => s.type === t.key).sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate));
        const current = history[0] || { amount: t.default, effectiveDate: 'Default' };
        ratesHtml += `
            <div class="glass-panel p-5 rounded-2xl border border-gray-100 flex flex-col h-full bg-white/50">
                <div class="flex justify-between items-start mb-4">
                    <h4 class="font-bold text-gray-800 text-sm">${t.label}</h4>
                    <div class="bg-brand-50 text-brand-600 px-2 py-0.5 rounded font-black">Rs. ${current.amount}</div>
                </div>
                <div class="text-[10px] text-gray-400 font-bold mb-4 uppercase">VALID FROM: ${current.effectiveDate}</div>
                <button onclick="window.openRateChangeModal('${t.key}', '${t.label}')" class="mt-auto w-full bg-gray-50 text-gray-600 hover:bg-brand-50 hover:text-brand-600 py-2 rounded-xl text-xs font-bold transition-all border border-gray-100 uppercase tracking-tighter">Change Rate</button>
            </div>
        `;
    }

    let usersRows = users.map(u => `
        <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <td class="py-3 px-4 text-sm font-medium text-gray-800">${u.name}</td>
            <td class="py-3 px-4 text-sm text-gray-600">${u.username}</td>
            <td class="py-3 px-4 text-right flex gap-2 justify-end">
                <button onclick="window.openUserModal(${u.id})" class="text-brand-600 hover:text-brand-800 font-bold text-xs uppercase tracking-widest px-3 py-1 rounded bg-brand-50 transition-colors">Edit</button>
                <button onclick="window.deleteUser(${u.id})" class="text-red-500 hover:text-red-700 font-bold text-xs uppercase tracking-widest px-3 py-1 rounded bg-red-50 transition-colors">Delete</button>
            </td>
        </tr>
    `).join('');

    return `
        <div class="h-full flex flex-col">
            <div class="mb-4 flex justify-between items-end">
                <div>
                    <h3 class="text-2xl font-black text-gray-900 leading-none">System Settings</h3>
                    <p class="text-xs text-gray-500 mt-2">Manage organizational rates and system access</p>
                </div>
                <div class="flex gap-2 p-1 bg-gray-100 rounded-xl no-print">
                    <button onclick="window.switchSettingsTab('rates')" id="tab-rates" class="px-4 py-2 rounded-lg text-sm font-bold transition-all bg-white shadow-sm text-brand-600">Rates</button>
                    <button onclick="window.switchSettingsTab('users')" id="tab-users" class="px-4 py-2 rounded-lg text-sm font-bold transition-all text-gray-500 hover:text-gray-700">Users</button>
                    <button onclick="window.switchSettingsTab('backup')" id="tab-backup" class="px-4 py-2 rounded-lg text-sm font-bold transition-all text-gray-500 hover:text-gray-700">Backup</button>
                </div>
            </div>

            <!-- Rates Tab -->
            <div id="settings-rates-content" class="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex-1 animate-fade-in">
                <h4 class="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Financial Dues Rates</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    ${ratesHtml}
                </div>
                <div class="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 items-center">
                    <i class="fa-solid fa-circle-info text-amber-600"></i>
                    <p class="text-xs text-amber-800 font-medium">Historical rates are maintained. The system automatically applies the correct rate based on the billing month.</p>
                </div>
            </div>

            <!-- Users Tab -->
            <div id="settings-users-content" class="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex-1 hidden animate-fade-in">
                <div class="flex justify-between items-center mb-6">
                    <h4 class="text-sm font-black text-gray-400 uppercase tracking-widest">User Management</h4>
                    <button onclick="window.openUserModal()" class="bg-brand-600 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-lg shadow-brand-500/30 uppercase tracking-widest"><i class="fa-solid fa-user-plus mr-2"></i> Add New User</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                <th class="py-3 px-4">Full Name</th>
                                <th class="py-3 px-4">Username</th>
                                <th class="py-3 px-4">Role</th>
                                <th class="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>${usersRows}</tbody>
                    </table>
                </div>
            </div>
            <!-- Backup Tab -->
            <div id="settings-backup-content" class="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex-1 hidden animate-fade-in">
                <div class="max-w-2xl">
                    <h4 class="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Backup & Restore System</h4>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <!-- Export -->
                        <div class="p-6 rounded-2xl bg-brand-50 border border-brand-100 space-y-4">
                            <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-brand-600 shadow-sm">
                                <i class="fa-solid fa-cloud-arrow-down text-xl"></i>
                            </div>
                            <div>
                                <h5 class="font-bold text-gray-900">Backup Data</h5>
                                <p class="text-xs text-gray-500 mt-1">Download a full copy of all members, transactions, and accounts to your device.</p>
                            </div>
                            <button onclick="window.exportSystemData()" class="w-full bg-brand-600 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all">Create Full Backup</button>
                        </div>

                        <!-- Import -->
                        <div class="p-6 rounded-2xl bg-amber-50 border border-amber-100 space-y-4">
                            <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
                                <i class="fa-solid fa-cloud-arrow-up text-xl"></i>
                            </div>
                            <div>
                                <h5 class="font-bold text-gray-900">Restore Data</h5>
                                <p class="text-xs text-gray-500 mt-1">Restore your system from a previous backup file. <span class="text-red-500 font-bold">Warning: Current data will be replaced.</span></p>
                            </div>
                            <label class="block">
                                <span class="sr-only">Choose backup file</span>
                                <input type="file" id="restoreFile" accept=".json" onchange="window.importSystemData(event)" class="block w-full text-xs text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer"/>
                            </label>
                        </div>
                    </div>

                    <div class="mt-12 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                        <h5 class="text-xs font-black text-gray-400 uppercase mb-3">Security Note</h5>
                        <ul class="text-[11px] text-gray-500 space-y-2 list-disc pl-4">
                            <li>Backups are saved as JSON files and are not encrypted. Keep them in a secure location.</li>
                            <li>Restoring data will completely erase the current database and replace it with the backup content.</li>
                            <li>We recommend creating a backup before making major system changes.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
}

window.switchSettingsTab = (tab) => {
    document.getElementById('settings-rates-content').classList.toggle('hidden', tab !== 'rates');
    document.getElementById('settings-users-content').classList.toggle('hidden', tab !== 'users');
    document.getElementById('settings-backup-content').classList.toggle('hidden', tab !== 'backup');

    document.getElementById('tab-rates').className = tab === 'rates' ? 'px-4 py-2 rounded-lg text-sm font-bold transition-all bg-white shadow-sm text-brand-600' : 'px-4 py-2 rounded-lg text-sm font-bold transition-all text-gray-500 hover:text-gray-700';
    document.getElementById('tab-users').className = tab === 'users' ? 'px-4 py-2 rounded-lg text-sm font-bold transition-all bg-white shadow-sm text-brand-600' : 'px-4 py-2 rounded-lg text-sm font-bold transition-all text-gray-500 hover:text-gray-700';
    document.getElementById('tab-backup').className = tab === 'backup' ? 'px-4 py-2 rounded-lg text-sm font-bold transition-all bg-white shadow-sm text-brand-600' : 'px-4 py-2 rounded-lg text-sm font-bold transition-all text-gray-500 hover:text-gray-700';
};

function mountSettings() { }

window.openUserModal = async (userId = null) => {
    let user = { name: '', username: '', role: 'User', password: '' };
    if (userId) {
        user = await db.users.get(userId);
    }

    const html = `
        <div class="mb-6">
            <h3 class="text-xl font-bold text-gray-800">${userId ? 'Edit User / Reset Password' : 'Add New User'}</h3>
            <p class="text-sm text-gray-500">Manage system access credentials.</p>
        </div>
        <form id="userForm" class="space-y-4" onsubmit="event.preventDefault(); window.saveUser(${userId})">
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input type="text" id="userName" required value="${user.name}" class="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-brand-500">
            </div>
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                <input type="text" id="userUsername" required value="${user.username}" ${userId ? 'readonly' : ''} class="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-brand-500 ${userId ? 'bg-gray-50' : ''}">
            </div>
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Role</label>
                <select id="userRole" required class="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-brand-500">
                    <option value="Admin" ${user.role === 'Admin' ? 'selected' : ''}>Admin</option>
                    <option value="User" ${user.role === 'User' ? 'selected' : ''}>User</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">${userId ? 'New Password (Leave blank to keep current)' : 'Password'}</label>
                <input type="password" id="userPassword" ${userId ? '' : 'required'} class="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-brand-500">
            </div>
            <div class="flex gap-3 pt-4">
                <button type="button" onclick="utils.closeModal()" class="flex-1 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 font-medium tracking-tight">Cancel</button>
                <button type="submit" class="flex-1 bg-brand-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-500/30 uppercase tracking-widest text-xs">Save User</button>
            </div>
        </form>
    `;
    utils.showModal(html);
};

window.saveUser = async (userId = null) => {
    const name = document.getElementById('userName').value;
    const username = document.getElementById('userUsername').value;
    const role = document.getElementById('userRole').value;
    const password = document.getElementById('userPassword').value;

    if (userId) {
        const updateData = { name, role };
        if (password) updateData.password = password;
        await db.users.update(userId, updateData);
        utils.showToast("User updated successfully!");
    } else {
        // Check if username unique
        const existing = await db.users.where('username').equals(username).first();
        if (existing) {
            utils.showToast("Username already exists!", "error");
            return;
        }
        await db.users.add({ name, username, role, password });
        utils.showToast("User created successfully!");
    }

    utils.closeModal();
    window.refreshCurrentView();
};

window.deleteUser = async (userId) => {
    if (window.auth.session && window.auth.session.id === userId) {
        utils.showToast("You cannot delete yourself!", "error");
        return;
    }
    if (confirm("Are you sure you want to delete this user?")) {
        await db.users.delete(userId);
        utils.showToast("User deleted.");
        window.refreshCurrentView();
    }
};

window.openRateChangeModal = (key, label) => {
    const html = `
        <div class="mb-6">
            <h3 class="text-xl font-bold text-gray-800 tracking-tighter">Update ${label}</h3>
            <p class="text-xs text-gray-500">Set a new amount and the date it becomes active.</p>
        </div>
        <form id="rateForm" class="space-y-4" onsubmit="event.preventDefault(); window.saveRateChange()">
            <input type="hidden" id="rateKey" value="${key}">
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">New Amount (Rs.)</label>
                <input type="number" id="rateAmount" required class="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-brand-500">
            </div>
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Effective Date</label>
                <input type="date" id="rateDate" required class="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-brand-500">
            </div>
            <div class="flex gap-3 pt-4">
                <button type="button" onclick="utils.closeModal()" class="flex-1 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 font-medium text-xs uppercase">Cancel</button>
                <button type="submit" class="flex-1 bg-brand-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-500/30 text-xs uppercase">Save Changes</button>
            </div>
        </form>
    `;
    utils.showModal(html);
    document.getElementById('rateDate').value = new Date().toISOString().split('T')[0];
};

window.saveRateChange = async () => {
    const type = document.getElementById('rateKey').value;
    const amount = parseFloat(document.getElementById('rateAmount').value);
    const effectiveDate = document.getElementById('rateDate').value;

    if (!amount || !effectiveDate) return;

    await db.settings.add({ type, amount, effectiveDate });
    utils.showToast("Rate updated successfully!");
    utils.closeModal();
    window.refreshCurrentView();
};

// Global helper to get effective rate
window.getEffectiveRate = async (type, date) => {
    const settings = await db.settings.where('type').equals(type).toArray();
    if (settings.length === 0) {
        // Defaults if no setting found
        if (type === 'ඇතුලත්වීමේ ගාස්තු ලැබීම්') return 13000;
        if (type === 'දායක අරමුදල් ලැබීම්') return 100;
        if (type === 'සාමාජික අරමුදල් ලැබීම්') return 200;
        if (type === 'සුභ සාධක අරමුදල් ලැබීම්') return 200;
        return 0;
    }

    // Sort by date descending
    settings.sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate));

    // Find the first setting where effectiveDate <= date
    const effective = settings.find(s => s.effectiveDate <= date);
    return effective ? effective.amount : settings[settings.length - 1].amount; // Return oldest if none found <= date
};

// System Backup Functionality
window.exportSystemData = async () => {
    try {
        const backupData = {};
        for (const table of db.tables) {
            backupData[table.name] = await table.toArray();
        }
        
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `arunalu_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        window.utils.showToast("Backup file downloaded successfully!");
    } catch (err) {
        console.error("Backup failed:", err);
        window.utils.showToast("Failed to create backup.", "error");
    }
};

window.importSystemData = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm("This will completely replace your current data with the backup file. Are you sure you want to continue?")) {
        event.target.value = '';
        return;
    }

    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Simple validation check
                if (!data.members || !data.accounts || !data.transactions) {
                    throw new Error("Invalid backup file format.");
                }

                await db.transaction('rw', db.tables, async () => {
                    for (const table of db.tables) {
                        if (data[table.name]) {
                            await table.clear();
                            await table.bulkAdd(data[table.name]);
                        }
                    }
                });

                window.utils.showToast("System restored successfully! Reloading...");
                setTimeout(() => window.location.reload(), 1500);
            } catch (err) {
                console.error("Import error:", err);
                window.utils.showToast("Error processing backup file: " + err.message, "error");
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    } catch (err) {
        console.error("File read error:", err);
        window.utils.showToast("Failed to read the backup file.", "error");
        event.target.value = '';
    }
};
