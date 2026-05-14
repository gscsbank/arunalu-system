// Auth Module - Handle user login and session
window.auth = {
    session: null,

    async init() {
        const sessionData = localStorage.getItem('arunalu_session');
        if (sessionData) {
            this.session = JSON.parse(sessionData);
            this.updateUI();
        } else {
            this.showLogin();
        }
    },

    async login(username, password) {
        const user = await db.users.where('username').equals(username).first();
        if (user && user.password === password) {
            this.session = { id: user.id, username: user.username, name: user.name, role: user.role };
            localStorage.setItem('arunalu_session', JSON.stringify(this.session));
            utils.showToast(`Welcome back, ${user.name}!`);
            utils.closeModal();
            this.updateUI();
            if (window.refreshCurrentView) window.refreshCurrentView();
            return true;
        }
        utils.showToast("Invalid username or password", "error");
        return false;
    },

    async verifyAdmin(password) {
        const admin = await db.users.where('role').equals('Admin').toArray();
        const matched = admin.find(u => u.password === password);
        return !!matched;
    },

    logout() {
        this.session = null;
        localStorage.removeItem('arunalu_session');
        location.reload(); // Hard reload to clear all states
    },

    updateUI() {
        const container = document.getElementById('user-profile-nav');
        if (container && this.session) {
            container.innerHTML = `
                <div class="mt-auto px-4 pb-6">
                    <div class="bg-gray-50 border border-gray-100 p-4 rounded-3xl shadow-sm group transition-all hover:shadow-md hover:bg-white hover:border-brand-200">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-black text-white shadow-lg shadow-brand-500/20 text-lg transition-transform group-hover:scale-110">
                                ${this.session.name.charAt(0).toUpperCase()}
                            </div>
                            <div class="flex-1 overflow-hidden">
                                <div class="font-black text-sm text-gray-900 tracking-tight truncate">${this.session.name}</div>
                                <div class="text-[10px] text-brand-600 font-black uppercase tracking-[0.15em] mt-0.5">${this.session.role}</div>
                            </div>
                        </div>
                        <div class="mt-4 pt-4 border-t border-gray-100 space-y-3">
                            <button onclick="window.backupModule.handleBackupFlow()" class="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2.5 rounded-xl font-bold transition-all border border-emerald-100 flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider shadow-sm">
                                <i class="fa-solid fa-shield-halved"></i> Secure Backup
                            </button>
                            <div class="flex justify-between items-center">
                                <div class="flex items-center gap-2">
                                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">System Active</span>
                                </div>
                                <button onclick="auth.logout()" class="w-8 h-8 rounded-xl bg-gray-200/50 text-gray-500 hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center justify-center group/btn shadow-sm">
                                    <i class="fa-solid fa-power-off text-xs transition-transform group-hover/btn:rotate-90"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    },

    showLogin() {
        const html = `
            <div class="text-center mb-8">
                <img src="logo.png" alt="Arunalu Logo" class="w-56 h-auto mx-auto -mb-8 drop-shadow-2xl hover:scale-105 transition-transform duration-500 relative z-10">
                <h2 class="text-2xl font-black text-gray-900 uppercase tracking-tighter">System Login</h2>
                <p class="text-gray-500 text-sm mt-1 font-medium italic">Arunalu Welfare Society Account System</p>
            </div>
            <form id="loginForm" class="space-y-5" onsubmit="event.preventDefault(); auth.handleLoginSubmit()">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                    <div class="relative">
                        <i class="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input type="text" id="loginUsername" required class="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all shadow-sm">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                    <div class="relative">
                        <i class="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input type="password" id="loginPassword" required class="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all shadow-sm">
                    </div>
                </div>
                <button type="submit" class="w-full bg-brand-600 hover:bg-brand-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-xl shadow-brand-500/30 flex items-center justify-center gap-2">
                    Access System <i class="fa-solid fa-chevron-right text-xs"></i>
                </button>
                <div class="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-widest font-bold">
                    Developed by Iraasoft Solution
                </div>
            </form>
        `;

        // Inject into modal
        const container = document.getElementById('modal-container');
        container.innerHTML = `
            <div class="glass-panel p-8 rounded-3xl w-full max-w-md shadow-2xl relative animate-scale-up border border-white/20">
                ${html}
            </div>
        `;
        container.classList.remove('hidden');
        container.classList.add('flex');
        requestAnimationFrame(() => {
            container.classList.remove('opacity-0');
            container.classList.add('opacity-100');
        });

        // Prevent closing login modal by clicking outside
        container.onmousedown = null;
    },

    handleLoginSubmit() {
        const u = document.getElementById('loginUsername').value;
        const p = document.getElementById('loginPassword').value;
        this.login(u, p);
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Check if users exist, otherwise create default admin
    db.on('ready', async () => {
        const count = await db.users.count();
        if (count === 0) {
            await db.users.add({
                username: 'admin',
                password: 'admin',
                role: 'Admin',
                name: 'System Administrator'
            });
            console.log("Default admin account created.");
        }
        auth.init();
    });
});
