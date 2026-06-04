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
        const hasDrive = !!localStorage.getItem('google_drive_script_url');
        const driveHtml = hasDrive ? `
            <button onclick="window.utils.closeModal(); window.backupModule.syncToGoogleDrive()" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 mb-3">
                <i class="fa-brands fa-google-drive text-lg"></i> Sync to Google Drive
            </button>
        ` : `
            <div class="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-left flex gap-2.5 items-start">
                <i class="fa-solid fa-lightbulb text-blue-600 mt-0.5"></i>
                <p class="text-[11px] text-blue-800 font-medium leading-relaxed">
                    <strong>ක්‍ෂණික උපදෙසක්:</strong> ඔබට මෙම දත්ත Google Drive එකට sync කිරීමට සැකසිය හැක. <strong>Settings -> Backup</strong> වෙත ගොස් Google Drive සම්බන්ධ කරන්න.
                </p>
            </div>
        `;

        const html = `
            <div class="text-center p-4">
                <div class="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <i class="fa-solid fa-clock-rotate-left text-2xl"></i>
                </div>
                <h3 class="text-xl font-black text-gray-900 uppercase tracking-tighter mb-2">දෛනික බැකප් මතක් කිරීම</h3>
                <p class="text-gray-500 text-sm mb-5">සවස 5:00 පසු වී ඇත. කරුණාකර අද දින දත්ත සුරක්ෂිතව තබා ගැනීමට බැකප් එකක් ලබා ගන්න.</p>
                
                ${driveHtml}

                <div class="space-y-2">
                    <button onclick="window.utils.closeModal(); window.backupModule.handleBackupFlow()" class="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-2">
                        <i class="fa-brands fa-whatsapp text-lg"></i> Backup & Share (WhatsApp)
                    </button>
                    <button onclick="window.utils.closeModal()" class="w-full mt-3 text-gray-400 text-xs font-bold uppercase tracking-widest">Later</button>
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
                    window.utils.closeModal();
                }
            },
            "Confirm Cloud Restore",
            "warning"
        );
    }
};

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
    window.backupModule.init();
});
