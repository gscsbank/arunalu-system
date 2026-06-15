// Backup & WhatsApp Share Module
window.backupModule = {
    isProcessing: false,
    autoSyncTimeout: null,

    async init() {
        console.log("Backup Module Initialized");
        this.startReminderCheck();
    },

    // Check every minute for the 5:00 PM reminder
    startReminderCheck() {
        setInterval(() => {
            const now = new Date();
            // Show reminder at exactly 5:00 PM (17:00)
            if (now.getHours() === 17 && now.getMinutes() === 0 && !sessionStorage.getItem('daily_backup_reminded')) {
                this.showBackupReminder();
                sessionStorage.setItem('daily_backup_reminded', 'true');
            }
            // Reset at midnight
            if (now.getHours() === 0) {
                sessionStorage.removeItem('daily_backup_reminded');
            }
        }, 60000); // Every minute
    },

    async syncToGoogleDrive(silent = false) {
        const scriptUrl = localStorage.getItem('google_drive_script_url');
        if (!scriptUrl) {
            if (!silent) window.utils.showToast("Google Drive Sync URL is not configured. Please check Settings.", "error");
            return false;
        }

        if (this.isProcessing) return false;
        this.isProcessing = true;

        let modalOpen = false;
        if (!silent) {
            modalOpen = true;
            const modalHtml = `
                <div class="text-center p-6" id="gdriveProgressContainer">
                    <div class="relative w-24 h-24 mx-auto mb-6">
                        <div class="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                        <div id="gdriveSpinner" class="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                        <div class="absolute inset-0 flex items-center justify-center text-blue-600">
                            <i class="fa-brands fa-google-drive text-3xl"></i>
                        </div>
                    </div>
                    <h3 class="text-xl font-black text-gray-900 tracking-tighter uppercase" id="gdriveStatusText">Connecting Google Drive...</h3>
                    <div class="w-full bg-gray-100 h-2 rounded-full mt-6 overflow-hidden">
                        <div id="gdriveProgressBar" class="bg-blue-500 h-full w-0 transition-all duration-500"></div>
                    </div>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-4">Syncing system database</p>
                </div>
            `;
            window.utils.showModal(modalHtml);
        }

        const progressText = document.getElementById('gdriveStatusText');
        const progressBar = document.getElementById('gdriveProgressBar');

        try {
            if (!silent && progressText && progressBar) {
                progressText.textContent = "Collecting system data...";
                progressBar.style.width = "30%";
            }

            // Export all data (raw mapping compatible with restore)
            const backupData = {};
            for (const table of db.tables) {
                backupData[table.name] = await table.toArray();
            }

            if (!silent && progressText && progressBar) {
                progressText.textContent = "Uploading to Google Drive...";
                progressBar.style.width = "70%";
            }

            const response = await fetch(scriptUrl, {
                method: 'POST',
                mode: 'cors',
                redirect: 'follow',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify(backupData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }

            const result = await response.json();
            if (result.status === 'success') {
                if (!silent && progressText && progressBar) {
                    progressBar.style.width = "100%";
                    progressText.textContent = "Sync Complete!";
                    await new Promise(r => setTimeout(r, 600));
                }
                if (!silent) {
                    window.utils.showToast("Database successfully backed up to Google Drive!");
                } else {
                    console.log("Background Google Drive auto-sync completed successfully:", result.fileName);
                }
                localStorage.setItem('google_drive_last_sync', new Date().toISOString());
                // Update UI label if Settings page is open
                const lastSyncEl = document.getElementById('gdriveLastSyncText');
                if (lastSyncEl) {
                    const ls = new Date();
                    lastSyncEl.textContent = `Last Sync: Today ${ls.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                    lastSyncEl.className = "text-[10px] text-emerald-600 font-bold uppercase tracking-wider block";
                }
                // Refresh the backups list if the settings page is open
                if (typeof window.renderGoogleDriveBackupsList === 'function') {
                    window.renderGoogleDriveBackupsList();
                }
                if (modalOpen) window.utils.closeModal();
                return true;
            } else {
                throw new Error(result.message || "Failed to save file.");
            }
        } catch (err) {
            console.error("Google Drive Sync Failed:", err);
            if (!silent) {
                window.utils.showToast("Google Drive Sync failed: " + err.message, "error");
                if (modalOpen) window.utils.closeModal();
            }
            return false;
        } finally {
            this.isProcessing = false;
        }
    },

    showBackupReminder() {
        const html = `
            <div class="text-center p-4">
                <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <i class="fa-solid fa-cloud-arrow-up text-2xl"></i>
                </div>
                <h3 class="text-xl font-black text-gray-900 uppercase tracking-tighter mb-2">බැකප් මතක් කිරීම</h3>
                <p class="text-gray-600 text-sm mb-6 font-medium leading-relaxed">
                    සවස 5:00 පසු වී ඇත. කරුණාකර ඔබගේ සිස්ටම් එකේ <strong>Backup & Sync</strong> වෙත ගොස් බැකප් එක Sync කරන්න.
                </p>
                <div class="flex gap-3">
                    <button onclick="window.utils.closeModal()" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30">
                        හරි (OK)
                    </button>
                </div>
            </div>
        `;
        window.utils.showModal(html);
    },

    async handleBackupFlow() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        const modalHtml = `
            <div class="text-center p-6" id="backupProgressContainer">
                <div class="relative w-24 h-24 mx-auto mb-6">
                    <div class="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                    <div id="backupSpinner" class="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
                    <div class="absolute inset-0 flex items-center justify-center text-green-600">
                        <i class="fa-solid fa-cloud-arrow-up text-3xl"></i>
                    </div>
                </div>
                <h3 class="text-xl font-black text-gray-900 tracking-tighter uppercase" id="backupStatusText">Preparing Backup...</h3>
                <div class="w-full bg-gray-100 h-2 rounded-full mt-6 overflow-hidden">
                    <div id="backupProgressBar" class="bg-green-500 h-full w-0 transition-all duration-500"></div>
                </div>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-4">Processing database records</p>
            </div>
        `;
        window.utils.showModal(modalHtml);

        const progressText = document.getElementById('backupStatusText');
        const progressBar = document.getElementById('backupProgressBar');

        try {
            // Step 1: Collect Data
            progressText.textContent = "Collecting Data...";
            progressBar.style.width = "30%";
            await new Promise(r => setTimeout(r, 800));

            const tables = ['members', 'accounts', 'transactions', 'entries', 'funerals', 'settings', 'users'];
            const exportData = {
                system: "Arunalu Welfare Society",
                exportedAt: new Date().toISOString(),
                version: "2.0.0",
                data: {}
            };

            for (let table of tables) {
                exportData.data[table] = await db[table].toArray();
            }

            // Step 2: Encrypt/Prepare (Simulated)
            progressText.textContent = "Packaging Records...";
            progressBar.style.width = "60%";
            await new Promise(r => setTimeout(r, 800));

            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const dateStr = new Date().toISOString().split('T')[0];
            const fileName = `Arunalu_Backup_${dateStr}.json`;
            const file = new File([blob], fileName, { type: 'application/json' });

            // Step 3: Trigger Share
            progressText.textContent = "Finalizing...";
            progressBar.style.width = "100%";
            await new Promise(r => setTimeout(r, 500));

            if (navigator.share) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Arunalu System Backup',
                        text: `Arunalu System Daily Backup - ${window.utils.formatDate(dateStr)}`
                    });
                    window.utils.showToast("Backup shared successfully!");
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.error("Share failed", err);
                        this.fallbackDownload(blob, fileName);
                    }
                }
            } else {
                // Fallback for desktop/unsupported browsers
                this.fallbackDownload(blob, fileName);
            }

            window.utils.closeModal();
        } catch (err) {
            console.error(err);
            window.utils.showToast("Backup failed!", "error");
            window.utils.closeModal();
        } finally {
            this.isProcessing = false;
        }
    },

    fallbackDownload(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        window.utils.showToast("Backup downloaded (WhatsApp share not supported on this browser)");
    },

    async listGoogleDriveBackups() {
        const scriptUrl = localStorage.getItem('google_drive_script_url');
        if (!scriptUrl) return null;

        try {
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
                return result.files;
            } else {
                throw new Error(result.message || "Failed to fetch file list.");
            }
        } catch (err) {
            console.error("Failed to list Google Drive backups:", err);
            return null;
        }
    },

    async restoreFromGoogleDrive(fileId, fileName) {
        const scriptUrl = localStorage.getItem('google_drive_script_url');
        if (!scriptUrl) {
            window.utils.showToast("Google Drive Sync URL is not configured.", "error");
            return;
        }

        window.utils.showConfirm(
            "Cloud Restore?", 
            `Are you sure you want to restore the system from the backup "${fileName}"? This will completely replace your current local data.`,
            async () => {
                const modalHtml = `
                    <div class="text-center p-6" id="gdriveRestoreProgressContainer">
                        <div class="relative w-16 h-16 mx-auto mb-4 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                        <h3 class="text-sm font-bold text-gray-800 uppercase tracking-wider">Downloading backup content...</h3>
                    </div>
                `;
                window.utils.showModal(modalHtml);

                try {
                    const response = await fetch(`${scriptUrl}?fileId=${fileId}`, {
                        method: 'GET',
                        mode: 'cors',
                        redirect: 'follow'
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error ${response.status}`);
                    }

                    const data = await response.json();
                    
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

                    window.utils.showToast("System successfully restored from Google Drive! Reloading...");
                    setTimeout(() => window.location.reload(), 1500);
                } catch (err) {
                    console.error("Cloud Restore failed:", err);
                    window.utils.showToast("Restore failed: " + err.message, "error");
                }
            }
        );
    }
};

window.renderBackupView = async () => {
    return `
        <div class="h-full flex flex-col">
            <div class="mb-4">
                <h3 class="text-2xl font-black text-gray-900 leading-none">Backup & Sync</h3>
                <p class="text-xs text-gray-500 mt-2">Manage local backups and cloud synchronization with Google Drive</p>
            </div>

            <div class="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex-1 animate-fade-in overflow-y-auto">
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
};

window.mountBackupView = () => {
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
    const lines = [
        'function doGet(e) {',
        '  try {',
        "    var folderId = '1sTs_NSqhbRkwG3gv-usZVqsS9moPm55I';",
        '',
        '    // Case 1: Read content of a specific file for restore',
        '    if (e.parameter && e.parameter.fileId) {',
        '      var file = DriveApp.getFileById(e.parameter.fileId);',
        '      var content = file.getAs(MimeType.PLAIN_TEXT).getDataAsString();',
        '      return ContentService.createTextOutput(content)',
        '        .setMimeType(ContentService.MimeType.JSON);',
        '    }',
        '',
        '    // Case 2: List all backup files in the folder',
        '    var folder = DriveApp.getFolderById(folderId);',
        '    var files = folder.getFiles();',
        '    var list = [];',
        '',
        '    while (files.hasNext()) {',
        '      var f = files.next();',
        '      var name = f.getName();',
        "      if (name.indexOf('Arunalu_Backup_') === 0 && name.indexOf('.json') !== -1) {",
        '        list.push({',
        '          id: f.getId(),',
        '          name: name,',
        '          created: f.getDateCreated().toISOString(),',
        '          size: f.getSize()',
        '        });',
        '      }',
        '    }',
        '',
        '    // Sort newest first',
        '    list.sort(function(a, b) { return new Date(b.created) - new Date(a.created); });',
        '',
        "    return ContentService.createTextOutput(JSON.stringify({ status: 'success', files: list }))",
        '      .setMimeType(ContentService.MimeType.JSON);',
        '  } catch (error) {',
        "    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))",
        '      .setMimeType(ContentService.MimeType.JSON);',
        '  }',
        '}',
        '',
        'function doPost(e) {',
        '  try {',
        "    var folderId = '1sTs_NSqhbRkwG3gv-usZVqsS9moPm55I';",
        '    var folder = DriveApp.getFolderById(folderId);',
        '    var data = JSON.parse(e.postData.contents);',
        '',
        '    var now = new Date();',
        "    var dateStr = now.getFullYear() + '-' +",
        "                  pad(now.getMonth() + 1) + '-' +",
        "                  pad(now.getDate()) + '_' +",
        "                  pad(now.getHours()) + '-' +",
        "                  pad(now.getMinutes()) + '-' +",
        '                  pad(now.getSeconds());',
        '',
        "    var fileName = 'Arunalu_Backup_' + dateStr + '.json';",
        '    var file = folder.createFile(fileName, JSON.stringify(data, null, 2), MimeType.PLAIN_TEXT);',
        '',
        '    return ContentService.createTextOutput(JSON.stringify({',
        "      status: 'success',",
        '      fileName: fileName,',
        '      fileId: file.getId()',
        '    })).setMimeType(ContentService.MimeType.JSON);',
        '  } catch (error) {',
        "    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))",
        '      .setMimeType(ContentService.MimeType.JSON);',
        '  }',
        '}',
        '',
        'function pad(num) { return (num < 10 ? \'0\' : \'\') + num; }'
    ];
    const code = lines.join('\n');
    
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
        const response = await fetch(scriptUrl, {
            method: 'GET',
            mode: 'cors',
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error('HTTP error ' + response.status);
        }

        const result = await response.json();
        if (result.status === 'success') {
            const count = result.files ? result.files.length : 0;
            window.utils.showToast('Connection Successful! ' + count + ' backup' + (count !== 1 ? 's' : '') + ' found in Drive.');
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
        a.download = 'arunalu_backup_' + new Date().toISOString().split('T')[0] + '.json';
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

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
    window.backupModule.init();
});
