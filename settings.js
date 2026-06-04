window.renderSettings = async () => {
    const allSettings = await db.settings.toArray();
    const users = await db.users.toArray();

    const types = [
        { key: 'ඇතුලත්වීමේ ගාස්තු ලැබීම්', label: 'ඇතුලත්වීමේ ගාස්තුව (Entrance Fee)', default: 13000 },
        { key: 'මාසික සාමාජික මුදල් ලැබීම්', label: 'මාසික සාමාජික මුදල (Monthly Membership Fee)', default: 300 },
        { key: 'සුභ සාධක අරමුදල් ලැබීම්', label: 'සුභ සාධක අරමුදල (Funeral)', default: 200 }
    ];

    const today = new Date().toISOString().split('T')[0];
    let ratesHtml = '';
    for (let t of types) {
        const history = allSettings.filter(s => s.type === t.key).sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate));
        const effectiveToday = await window.getEffectiveRate(t.key, today);
        const latestChange = history[0] || { amount: t.default, effectiveDate: 'Default' };
        
        ratesHtml += `
            <div class="glass-panel p-5 rounded-2xl border border-gray-100 flex flex-col h-full bg-white/50">
                <div class="flex justify-between items-start mb-4">
                    <h4 class="font-bold text-gray-800 text-sm">${t.label}</h4>
                    <div class="bg-brand-50 text-brand-600 px-2 py-0.5 rounded font-black">Rs. ${effectiveToday}</div>
                </div>
                <div class="text-[10px] text-gray-400 font-bold mb-4 uppercase">Latest Change: ${window.utils.formatDate(latestChange.effectiveDate)} (${latestChange.amount})</div>
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
                <div class="max-w-4xl">
                    <h4 class="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Local Backup & Restore</h4>
                    
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

                    <!-- Google Drive Sync Section -->
                    <div class="mt-8 border-t border-gray-100 pt-8">
                        <h4 class="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Google Drive Cloud Sync</h4>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <!-- Sync Config Panel -->
                            <div class="p-6 rounded-2xl bg-blue-50 border border-blue-100 space-y-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                                        <i class="fa-brands fa-google-drive text-xl"></i>
                                    </div>
                                    <div>
                                        <h5 class="font-bold text-gray-900">Google Drive Cloud Sync</h5>
                                        <span id="gdriveLastSyncText" class="text-[10px] text-amber-500 font-bold uppercase tracking-wider block">Never Synced</span>
                                    </div>
                                </div>
                                
                                <div class="space-y-3">
                                    <div>
                                        <label class="block text-[11px] font-bold text-gray-500 uppercase mb-1">Google Apps Script Web App URL</label>
                                        <input type="password" id="gdriveScriptUrl" placeholder="https://script.google.com/macros/s/.../exec" class="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:border-blue-500 bg-white">
                                    </div>
                                </div>
                                
                                <div class="flex gap-2 pt-2">
                                    <button onclick="window.testGoogleDriveConnection()" class="flex-1 bg-white hover:bg-gray-50 text-blue-600 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider border border-blue-200 shadow-sm transition-all">Test Connection</button>
                                    <button onclick="window.backupModule.syncToGoogleDrive()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all">Sync Now</button>
                                </div>
                            </div>

                            <!-- Instructions Panel -->
                            <div class="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                                <h5 class="font-bold text-gray-900 flex items-center gap-2 text-sm"><i class="fa-solid fa-circle-question text-slate-500"></i> Setup Guide / උපදෙස් මාලාව</h5>
                                <p class="text-xs text-gray-500 leading-normal">Google Drive එකට දත්ත sync වීමට සැකසීම සඳහා පහත පියවර අනුගමනය කරන්න:</p>
                                
                                <div class="space-y-3 text-[11px] text-gray-600">
                                    <div class="border-b border-gray-200/60 pb-2">
                                        <span class="font-black text-slate-700 block">1. Apps Script එකක් නිර්මාණය කිරීම</span>
                                        <p class="mt-0.5"><a href="https://script.google.com" target="_blank" class="text-blue-600 hover:underline font-bold">script.google.com</a> වෙත ගොස් <strong>"New Project"</strong> ක්ලික් කරන්න.</p>
                                    </div>
                                    <div class="border-b border-gray-200/60 pb-2">
                                        <span class="font-black text-slate-700 block">2. කේතය පිටපත් කිරීම</span>
                                        <p class="mt-0.5">පහත බොත්තම ක්ලික් කර script කේතය කොපි කරගන්න. ඉන්පසු Apps Script Editor එකේ ඇති සියලුම දේ මකා දමා එය paste කරන්න.</p>
                                        <button onclick="window.copyAppsScriptCode()" class="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-lg transition-all shadow-sm">
                                            <i class="fa-solid fa-copy"></i> Copy Script Code
                                        </button>
                                    </div>
                                    <div>
                                        <span class="font-black text-slate-700 block">3. Web App එකක් ලෙස Deploy කිරීම</span>
                                        <p class="mt-0.5"><strong>Deploy -> New Deployment</strong> ක්ලික් කර <strong>Web App</strong> තෝරන්න. 
                                        <strong>Execute as:</strong> Me (ඔබගේ ඊමේල් ලිපිනය), <strong>Who has access:</strong> Anyone ලෙස සකසා Deploy කරන්න. අවසානයේ ලැබෙන Web App URL එක කොපි කර ඉහත URL කොටුවට paste කරන්න.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Google Drive Backups List Section -->
                    <div class="mt-8 border-t border-gray-100 pt-8">
                        <div class="flex justify-between items-center mb-6">
                            <div>
                                <h4 class="text-sm font-black text-gray-400 uppercase tracking-widest">Available Cloud Backups (Google Drive)</h4>
                                <p class="text-xs text-gray-500 mt-1">Select a backup file from Google Drive to restore the system database.</p>
                            </div>
                            <button onclick="window.renderGoogleDriveBackupsList()" class="bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-xs font-black transition-all border border-gray-100 uppercase tracking-widest flex items-center gap-1.5">
                                <i class="fa-solid fa-rotate"></i> Refresh List
                            </button>
                        </div>
                        <div id="gdriveBackupsListContainer">
                            <!-- Populated dynamically -->
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

window.mountSettings = () => {
    // Load Google Drive configurations
    const scriptUrl = localStorage.getItem('google_drive_script_url') || '';
    const lastSync = localStorage.getItem('google_drive_last_sync');

    const urlInput = document.getElementById('gdriveScriptUrl');
    const lastSyncText = document.getElementById('gdriveLastSyncText');

    if (urlInput) {
        urlInput.value = scriptUrl;
        urlInput.addEventListener('input', (e) => {
            localStorage.setItem('google_drive_script_url', e.target.value.trim());
        });
    }

    if (lastSyncText) {
        if (lastSync) {
            lastSyncText.textContent = `Last Sync: ${window.utils.formatDate(lastSync.split('T')[0])} ${new Date(lastSync).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            lastSyncText.className = "text-[10px] text-emerald-600 font-bold uppercase tracking-wider block";
        } else {
            lastSyncText.textContent = "Never Synced";
            lastSyncText.className = "text-[10px] text-amber-500 font-bold uppercase tracking-wider block";
        }
    }

    // Trigger cloud backups list load in the background
    window.renderGoogleDriveBackupsList();
};

window.renderGoogleDriveBackupsList = async () => {
    const listContainer = document.getElementById('gdriveBackupsListContainer');
    if (!listContainer) return;

    const scriptUrl = localStorage.getItem('google_drive_script_url');
    if (!scriptUrl) {
        listContainer.innerHTML = `
            <div class="text-center py-6 text-gray-400 text-xs font-semibold uppercase">
                Google Drive URL is not configured
            </div>
        `;
        return;
    }

    listContainer.innerHTML = `
        <div class="flex justify-center items-center py-8">
            <div class="w-8 h-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
    `;

    const files = await window.backupModule.listGoogleDriveBackups();

    if (!files || files.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center py-8 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400">
                <i class="fa-solid fa-cloud-open text-3xl mb-3 opacity-20"></i>
                <p class="text-xs font-medium">No cloud backups found in folder</p>
            </div>
        `;
        return;
    }

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = 2;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    let tableRows = files.map(file => {
        const localDate = new Date(file.created);
        const dateStr = `${window.utils.formatDate(file.created.split('T')[0])} ${localDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        
        return `
            <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td class="py-3 px-4 text-sm font-semibold text-gray-800">${file.name}</td>
                <td class="py-3 px-4 text-xs text-gray-500">${dateStr}</td>
                <td class="py-3 px-4 text-xs text-gray-500">${formatBytes(file.size)}</td>
                <td class="py-3 px-4 text-right flex gap-2 justify-end">
                    <button onclick="window.backupModule.restoreFromGoogleDrive('${file.id}', '${file.name}')" class="text-blue-600 hover:text-blue-800 font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1">
                        <i class="fa-solid fa-cloud-arrow-down"></i> Restore
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    listContainer.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead>
                    <tr class="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                        <th class="py-3 px-4">Backup File Name</th>
                        <th class="py-3 px-4">Created Date & Time</th>
                        <th class="py-3 px-4">Size</th>
                        <th class="py-3 px-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;
};

window.copyAppsScriptCode = () => {
    const code = `function doGet(e) {
  try {
    var folderId = '1sTs_NSqhbRkwG3gv-usZVqsS9moPm55I';

    // Case 1: Read content of a specific file for restore
    if (e.parameter && e.parameter.fileId) {
      var file = DriveApp.getFileById(e.parameter.fileId);
      var content = file.getAs(MimeType.PLAIN_TEXT).getDataAsString();
      return ContentService.createTextOutput(content)
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Case 2: List all backup files in the folder
    var folder = DriveApp.getFolderById(folderId);
    var files = folder.getFiles();
    var list = [];

    while (files.hasNext()) {
      var f = files.next();
      var name = f.getName();
      if (name.indexOf('Arunalu_Backup_') === 0 && name.indexOf('.json') !== -1) {
        list.push({
          id: f.getId(),
          name: name,
          created: f.getDateCreated().toISOString(),
          size: f.getSize()
        });
      }
    }

    // Sort newest first
    list.sort(function(a, b) { return new Date(b.created) - new Date(a.created); });

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', files: list }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var folderId = '1sTs_NSqhbRkwG3gv-usZVqsS9moPm55I';
    var folder = DriveApp.getFolderById(folderId);
    var data = JSON.parse(e.postData.contents);

    var now = new Date();
    var dateStr = now.getFullYear() + '-' +
                  pad(now.getMonth() + 1) + '-' +
                  pad(now.getDate()) + '_' +
                  pad(now.getHours()) + '-' +
                  pad(now.getMinutes()) + '-' +
                  pad(now.getSeconds());

    var fileName = 'Arunalu_Backup_' + dateStr + '.json';
    var file = folder.createFile(fileName, JSON.stringify(data, null, 2), MimeType.PLAIN_TEXT);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      fileName: fileName,
      fileId: file.getId()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function pad(num) { return (num < 10 ? '0' : '') + num; }`;
    
    navigator.clipboard.writeText(code).then(() => {
        window.utils.showToast("Apps Script code copied to clipboard!");
    }).catch(err => {
        console.error("Clipboard copy failed:", err);
        window.utils.showToast("Failed to copy code. Please copy manually.", "error");
    });
};

window.testGoogleDriveConnection = async () => {
    const scriptUrl = localStorage.getItem('google_drive_script_url');
    if (!scriptUrl) {
        window.utils.showToast("Please enter a Web App URL first.", "error");
        return;
    }

    const testModalHtml = `
        <div class="text-center p-6" id="testProgressContainer">
            <div class="relative w-16 h-16 mx-auto mb-4 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <h3 class="text-sm font-bold text-gray-800 uppercase tracking-wider">Testing connection...</h3>
        </div>
    `;
    window.utils.showModal(testModalHtml);

    try {
        // Use GET to list files - tests connection without creating dummy files
        const response = await fetch(scriptUrl, {
            method: 'GET',
            mode: 'cors',
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        const result = await response.json();
        if (result.status === 'success') {
            const count = result.files ? result.files.length : 0;
            window.utils.showToast(`Connection Successful! ${count} backup${count !== 1 ? 's' : ''} found in Drive.`);
            window.renderGoogleDriveBackupsList();
        } else {
            throw new Error(result.message || "Drive folder access failed");
        }
    } catch (err) {
        console.error("Test connection failed:", err);
        window.utils.showToast("Connection failed: " + err.message, "error");
    } finally {
        window.utils.closeModal();
    }
};

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
    window.utils.showConfirm(
        "Delete User?", 
        "Are you sure you want to delete this user? They will no longer be able to access the system.",
        async () => {
            await db.users.delete(userId);
            utils.showToast("User deleted.");
            window.refreshCurrentView();
        },
        "Confirm Delete",
        "warning"
    );
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
    utils.showToast("Rate updated successfully! Reloading...");
    utils.closeModal();
    setTimeout(() => window.location.reload(), 1000);
};

// Global helper to get effective rate
window.getEffectiveRate = async (type, date) => {
    const settings = await db.settings.where('type').equals(type).toArray();
    if (settings.length === 0) {
        // Defaults if no setting found
        if (type === 'ඇතුලත්වීමේ ගාස්තු ලැබීම්') return 13000;
        if (type === 'මාසික සාමාජික මුදල් ලැබීම්') return 300;
        if (type === 'සුභ සාධක අරමුදල් ලැබීම්') return 200;
        return 0;
    }

    // Sort by date descending, then by ID descending
    settings.sort((a, b) => {
        const d1 = new Date(a.effectiveDate);
        const d2 = new Date(b.effectiveDate);
        if (d1.getTime() !== d2.getTime()) return d2 - d1;
        return (b.id || 0) - (a.id || 0);
    });

    // Find the first setting where effectiveDate <= date
    const effective = settings.find(s => s.effectiveDate <= date);
    if (effective) return effective.amount;

    // If no setting found <= date, it means the date is BEFORE all our records.
    // Return the hardcoded default for that type.
    if (type === 'ඇතුලත්වීමේ ගාස්තු ලැබීම්') return 13000;
    if (type === 'මාසික සාමාජික මුදල් ලැබීම්') return 300;
    if (type === 'සුභ සාධක අරමුදල් ලැබීම්') return 200;

    return settings[settings.length - 1].amount; // Fallback to oldest if defaults not matched
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

    window.utils.showConfirm(
        "Restore Data?", 
        "This will completely replace your current data with the backup file. Are you sure you want to continue?",
        async () => {
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
        },
        "Confirm Restore",
        "warning"
    );
};
