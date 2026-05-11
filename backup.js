// Backup & WhatsApp Share Module
window.backupModule = {
    isProcessing: false,

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

    showBackupReminder() {
        const html = `
            <div class="text-center p-4">
                <div class="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <i class="fa-solid fa-clock-rotate-left text-2xl"></i>
                </div>
                <h3 class="text-xl font-black text-gray-900 uppercase tracking-tighter">දෛනික බැකප් මතක් කිරීම</h3>
                <p class="text-gray-500 text-sm mt-2">සවස 5:00 පසු වී ඇත. කරුණාකර අද දින ගනුදෙනු දත්ත WhatsApp හරහා බැකප් එකක් ලෙස යැවීමට අමතක නොකරන්න.</p>
                <div class="mt-6">
                    <button onclick="window.backupModule.handleBackupFlow()" class="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-2">
                        <i class="fa-brands fa-whatsapp text-lg"></i> Backup & Send Now
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
                        text: `Arunalu System Daily Backup - ${dateStr}`
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
    }
};

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
    window.backupModule.init();
});
