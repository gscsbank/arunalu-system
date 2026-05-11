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

    logout() {
        this.session = null;
        localStorage.removeItem('arunalu_session');
        location.reload(); // Hard reload to clear all states
    },

    updateUI() {
        const container = document.getElementById('user-profile-nav');
        if (container && this.session) {
            container.innerHTML = `
                <div class="flex items-center gap-3 px-3 py-4 border-t border-gray-800 mt-4">
                    <div class="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center font-bold text-white shadow-lg">
                        ${this.session.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="flex-1 overflow-hidden">
                        <div class="font-bold text-sm truncate">${this.session.name}</div>
                        <div class="text-xs text-gray-500 truncate">${this.session.role}</div>
                    </div>
                    <button onclick="auth.logout()" class="text-gray-500 hover:text-red-400 p-2 transition-colors tooltip" title="Logout">
                        <i class="fa-solid fa-power-off"></i>
                    </button>
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
