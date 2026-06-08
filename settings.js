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
                    <button onclick="window.switchSettingsTab('printer')" id="tab-printer" class="px-4 py-2 rounded-lg text-sm font-bold transition-all text-gray-500 hover:text-gray-700"><i class="fa-solid fa-print mr-1"></i>Printer</button>
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

            <!-- Printer Settings Tab -->
            <div id="settings-printer-content" class="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex-1 hidden animate-fade-in">
                <h4 class="text-sm font-black text-gray-400 uppercase tracking-widest mb-6"><i class="fa-solid fa-print mr-2"></i>Printer Settings / Connection</h4>

                <!-- Interface Selector -->
                <div class="mb-6">
                    <p class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Interface / සම්බන්ධතා ක්‍රමය</p>
                    <div class="grid grid-cols-3 gap-3" id="printerInterfaceSelector">
                        <button onclick="window.selectPrinterInterface('bluetooth')" id="iface-bluetooth"
                            class="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-brand-500 bg-brand-50 text-brand-700 font-bold text-sm transition-all">
                            <i class="fa-brands fa-bluetooth text-2xl"></i>
                            Bluetooth
                        </button>
                        <button onclick="window.selectPrinterInterface('wifi')" id="iface-wifi"
                            class="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-500 font-bold text-sm transition-all hover:border-brand-300">
                            <i class="fa-solid fa-wifi text-2xl"></i>
                            WiFi / LAN
                        </button>
                        <button onclick="window.selectPrinterInterface('browser')" id="iface-browser"
                            class="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-500 font-bold text-sm transition-all hover:border-brand-300">
                            <i class="fa-solid fa-print text-2xl"></i>
                            Browser Print
                        </button>
                    </div>
                </div>

                <!-- Bluetooth Panel -->
                <div id="printer-panel-bluetooth" class="">
                    <!-- iOS Warning -->
                    <div class="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3" id="ios-bt-warning" style="display:none !important">
                        <i class="fa-brands fa-apple text-amber-600 text-xl mt-0.5"></i>
                        <div>
                            <div class="font-bold text-amber-800 text-sm">iOS Bluetooth සීමාව</div>
                            <div class="text-xs text-amber-700 mt-1">iPhone/iPad හි Safari browser Bluetooth printing support කරන්නේ නැහැ. MPT-II printer connect කිරීමට <strong>Chrome on Android</strong> හෝ <strong>WiFi/LAN</strong> interface use කරන්න.</div>
                        </div>
                    </div>

                    <!-- Status Bar -->
                    <div id="bt-status-bar" class="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div id="bt-status-dot" class="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                            <span id="bt-status-text" class="text-xs font-bold text-gray-500">Not Connected</span>
                        </div>
                        <span id="bt-device-name" class="text-xs text-gray-400 font-medium">No printer selected</span>
                    </div>

                    <!-- Scan Button -->
                    <button onclick="window.scanBluetoothPrinters()" id="bt-scan-btn"
                        class="w-full mb-4 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-brand-500/20 text-sm">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        Scan for Printers (Bluetooth)
                    </button>

                    <!-- Device List -->
                    <div id="bt-device-list" class="space-y-2 mb-4"></div>

                    <!-- Manual Name Entry -->
                    <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Manual Device Name (අතින් ඇතුල් කරන්න)</p>
                        <div class="flex gap-2">
                            <input type="text" id="bt-manual-name" placeholder="e.g. MPT-II" value=""
                                class="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-brand-500">
                            <button onclick="window.saveBtManualDevice()" class="bg-gray-700 hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-bold text-xs transition-all">
                                Save
                            </button>
                        </div>
                    </div>
                </div>

                <!-- WiFi Panel -->
                <div id="printer-panel-wifi" class="hidden">
                    <div class="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-4 flex gap-3">
                        <i class="fa-solid fa-circle-info text-blue-500 mt-0.5"></i>
                        <div class="text-xs text-blue-700">Printer IP address ඇතුල් කරන්න. Printer සහ Device එකම WiFi network එකේ connect වෙලා ඉන්න ඕනෙ.</div>
                    </div>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-widest">Printer IP Address</label>
                            <input type="text" id="wifi-printer-ip" placeholder="e.g. 192.168.1.100"
                                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-brand-500 text-sm">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-widest">Port</label>
                            <input type="number" id="wifi-printer-port" placeholder="9100" value="9100"
                                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-brand-500 text-sm">
                        </div>
                        <button onclick="window.saveWifiPrinter()" class="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl transition-all text-sm shadow-lg shadow-brand-500/20">
                            <i class="fa-solid fa-floppy-disk mr-2"></i>Save WiFi Printer Settings
                        </button>
                    </div>
                </div>

                <!-- Browser Print Panel -->
                <div id="printer-panel-browser" class="hidden">
                    <div class="p-4 bg-green-50 border border-green-200 rounded-xl flex gap-3">
                        <i class="fa-solid fa-circle-check text-green-500 mt-0.5 text-lg"></i>
                        <div>
                            <div class="font-bold text-green-800 text-sm">Browser Print Mode</div>
                            <div class="text-xs text-green-700 mt-1">Browser ගේ built-in print dialog use කරනවා. Printer PC/Mac ට connected (USB/Network) නම් මෙය use කරන්න. iOS iPhone ටත් හොඳින් work කරනවා.</div>
                        </div>
                    </div>
                </div>

                <!-- Test Print & Save -->
                <div class="mt-6 flex gap-3">
                    <button onclick="window.testPrinterConnection()" class="flex-1 flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-brand-400 text-gray-600 hover:text-brand-600 font-bold py-2.5 rounded-xl transition-all text-sm">
                        <i class="fa-solid fa-vial"></i> Test Print
                    </button>
                    <button onclick="window.savePrinterSettings()" class="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-black text-white font-bold py-2.5 rounded-xl transition-all text-sm shadow-lg">
                        <i class="fa-solid fa-floppy-disk"></i> Save Settings
                    </button>
                </div>
            </div>
        </div>
    `;
};

window.switchSettingsTab = (tab) => {
    document.getElementById('settings-rates-content').classList.toggle('hidden', tab !== 'rates');
    document.getElementById('settings-users-content').classList.toggle('hidden', tab !== 'users');
    document.getElementById('settings-printer-content').classList.toggle('hidden', tab !== 'printer');

    const active = 'px-4 py-2 rounded-lg text-sm font-bold transition-all bg-white shadow-sm text-brand-600';
    const inactive = 'px-4 py-2 rounded-lg text-sm font-bold transition-all text-gray-500 hover:text-gray-700';
    document.getElementById('tab-rates').className = tab === 'rates' ? active : inactive;
    document.getElementById('tab-users').className = tab === 'users' ? active : inactive;
    document.getElementById('tab-printer').className = tab === 'printer' ? active : inactive;

    if (tab === 'printer') window.initPrinterSettingsTab();
};

window.mountSettings = () => {
    // No initialization logic needed for rates and users tabs at the moment
};

// ─── PRINTER SETTINGS LOGIC ──────────────────────────────────────────────────

// Holds the active Web Bluetooth device
window._btPrinterDevice = null;
window._btPrinterCharacteristic = null;

window.initPrinterSettingsTab = () => {
    const saved = window.getPrinterSettings();

    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const iosWarn = document.getElementById('ios-bt-warning');
    if (iosWarn && isIOS) iosWarn.style.removeProperty('display');

    // Restore interface
    window.selectPrinterInterface(saved.interface || 'bluetooth', false);

    // Restore WiFi fields
    if (saved.wifiIp) {
        const ipEl = document.getElementById('wifi-printer-ip');
        if (ipEl) ipEl.value = saved.wifiIp;
    }
    if (saved.wifiPort) {
        const portEl = document.getElementById('wifi-printer-port');
        if (portEl) portEl.value = saved.wifiPort;
    }

    // Restore BT manual name
    if (saved.btDeviceName) {
        const nameEl = document.getElementById('bt-manual-name');
        if (nameEl) nameEl.value = saved.btDeviceName;
        window.updateBtStatus(saved.btConnected ? 'connected' : 'saved', saved.btDeviceName);
    }

    // Show already-connected device if active
    if (window._btPrinterDevice && window._btPrinterDevice.gatt.connected) {
        window.updateBtStatus('connected', window._btPrinterDevice.name);
    }
};

window.selectPrinterInterface = (iface, save = true) => {
    const panels = ['bluetooth', 'wifi', 'browser'];
    panels.forEach(p => {
        const panel = document.getElementById(`printer-panel-${p}`);
        const btn = document.getElementById(`iface-${p}`);
        if (!panel || !btn) return;
        if (p === iface) {
            panel.classList.remove('hidden');
            btn.className = 'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-brand-500 bg-brand-50 text-brand-700 font-bold text-sm transition-all';
        } else {
            panel.classList.add('hidden');
            btn.className = 'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-200 bg-gray-50 text-gray-500 font-bold text-sm transition-all hover:border-brand-300';
        }
    });
    if (save) {
        const s = window.getPrinterSettings();
        s.interface = iface;
        window.savePrinterSettingsData(s);
    }
};

window.updateBtStatus = (state, deviceName = '') => {
    const dot = document.getElementById('bt-status-dot');
    const text = document.getElementById('bt-status-text');
    const nameEl = document.getElementById('bt-device-name');
    if (!dot || !text) return;
    if (state === 'connected') {
        dot.className = 'w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse';
        text.textContent = 'Connected';
        text.className = 'text-xs font-bold text-green-600';
    } else if (state === 'scanning') {
        dot.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping';
        text.textContent = 'Scanning...';
        text.className = 'text-xs font-bold text-amber-600';
    } else if (state === 'saved') {
        dot.className = 'w-2.5 h-2.5 rounded-full bg-blue-400';
        text.textContent = 'Saved (Not Live Connected)';
        text.className = 'text-xs font-bold text-blue-500';
    } else {
        dot.className = 'w-2.5 h-2.5 rounded-full bg-gray-300';
        text.textContent = 'Not Connected';
        text.className = 'text-xs font-bold text-gray-500';
    }
    if (nameEl) nameEl.textContent = deviceName || 'No printer selected';
};

window.scanBluetoothPrinters = async () => {
    // Check Web Bluetooth API availability
    if (!navigator.bluetooth) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
            utils.showToast('iOS Safari does not support Web Bluetooth. Use WiFi or Browser Print mode.', 'error');
        } else {
            utils.showToast('Web Bluetooth not supported in this browser. Use Chrome/Edge.', 'error');
        }
        return;
    }

    const btn = document.getElementById('bt-scan-btn');
    const list = document.getElementById('bt-device-list');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Scanning...'; }
    window.updateBtStatus('scanning');
    if (list) list.innerHTML = '';

    try {
        // Request any Bluetooth device - browser shows system picker
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [
                '000018f0-0000-1000-8000-00805f9b34fb', // Generic printer service
                '00001101-0000-1000-8000-00805f9b34fb', // SPP (Serial Port Profile)
                '00001800-0000-1000-8000-00805f9b34fb', // Generic Access
                'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Common BT printer
            ]
        });

        if (device) {
            window.connectBluetoothPrinter(device);
        }
    } catch (err) {
        if (err.name !== 'NotFoundError') {
            utils.showToast('Bluetooth scan failed: ' + err.message, 'error');
        }
        window.updateBtStatus('disconnected');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-magnifying-glass mr-2"></i>Scan for Printers (Bluetooth)'; }
    }
};

window.connectBluetoothPrinter = async (device) => {
    const list = document.getElementById('bt-device-list');
    window.updateBtStatus('scanning', device.name || 'Unknown');

    try {
        utils.showToast(`Connecting to ${device.name || 'printer'}...`, 'info');
        const server = await device.gatt.connect();
        window._btPrinterDevice = device;

        // Try to find a writable characteristic for printing
        let characteristic = null;
        const serviceUuids = [
            '000018f0-0000-1000-8000-00805f9b34fb',
            'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
            '00001101-0000-1000-8000-00805f9b34fb',
        ];
        for (const uuid of serviceUuids) {
            try {
                const service = await server.getPrimaryService(uuid);
                const chars = await service.getCharacteristics();
                characteristic = chars.find(c => c.properties.write || c.properties.writeWithoutResponse);
                if (characteristic) break;
            } catch (_) { /* try next */ }
        }
        window._btPrinterCharacteristic = characteristic;

        const s = window.getPrinterSettings();
        s.btDeviceName = device.name || 'Unknown';
        s.btConnected = true;
        s.interface = 'bluetooth';
        window.savePrinterSettingsData(s);

        window.updateBtStatus('connected', device.name || 'Unknown');
        utils.showToast(`✅ Connected to ${device.name || 'printer'}!`, 'success');

        // Show in device list
        if (list) {
            list.innerHTML = `
                <div class="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <i class="fa-brands fa-bluetooth text-green-600"></i>
                        </div>
                        <div>
                            <div class="font-bold text-green-800 text-sm">${device.name || 'Unknown Device'}</div>
                            <div class="text-[10px] text-green-600 uppercase font-bold">Connected</div>
                        </div>
                    </div>
                    <button onclick="window.disconnectBtPrinter()" class="text-xs text-red-500 hover:text-red-700 font-bold px-3 py-1 rounded-lg bg-red-50 border border-red-100">
                        Disconnect
                    </button>
                </div>`;
        }

        // Listen for disconnect
        device.addEventListener('gattserverdisconnected', () => {
            window._btPrinterDevice = null;
            window._btPrinterCharacteristic = null;
            window.updateBtStatus('disconnected');
            utils.showToast('Printer disconnected.', 'error');
            if (list) list.innerHTML = '';
        });

    } catch (err) {
        utils.showToast('Connection failed: ' + err.message, 'error');
        window.updateBtStatus('disconnected');
    }
};

window.disconnectBtPrinter = async () => {
    if (window._btPrinterDevice && window._btPrinterDevice.gatt.connected) {
        await window._btPrinterDevice.gatt.disconnect();
    }
    window._btPrinterDevice = null;
    window._btPrinterCharacteristic = null;
    window.updateBtStatus('disconnected');
    const list = document.getElementById('bt-device-list');
    if (list) list.innerHTML = '';
    utils.showToast('Disconnected from printer.', 'info');
};

window.saveBtManualDevice = () => {
    const name = document.getElementById('bt-manual-name')?.value?.trim();
    if (!name) { utils.showToast('Device name ඇතුල් කරන්න.', 'error'); return; }
    const s = window.getPrinterSettings();
    s.btDeviceName = name;
    s.interface = 'bluetooth';
    window.savePrinterSettingsData(s);
    window.updateBtStatus('saved', name);
    utils.showToast(`"${name}" saved as printer.`, 'success');
};

window.saveWifiPrinter = () => {
    const ip = document.getElementById('wifi-printer-ip')?.value?.trim();
    const port = document.getElementById('wifi-printer-port')?.value?.trim() || '9100';
    if (!ip) { utils.showToast('IP address ඇතුල් කරන්න.', 'error'); return; }
    const s = window.getPrinterSettings();
    s.wifiIp = ip;
    s.wifiPort = port;
    s.interface = 'wifi';
    window.savePrinterSettingsData(s);
    utils.showToast(`WiFi Printer saved: ${ip}:${port}`, 'success');
};

window.savePrinterSettings = () => {
    const s = window.getPrinterSettings();
    const iface = ['bluetooth','wifi','browser'].find(i => {
        const btn = document.getElementById(`iface-${i}`);
        return btn && btn.className.includes('brand-500');
    }) || s.interface || 'browser';
    s.interface = iface;

    if (iface === 'wifi') {
        s.wifiIp = document.getElementById('wifi-printer-ip')?.value?.trim() || s.wifiIp;
        s.wifiPort = document.getElementById('wifi-printer-port')?.value?.trim() || s.wifiPort;
    }
    if (iface === 'bluetooth') {
        const name = document.getElementById('bt-manual-name')?.value?.trim();
        if (name) s.btDeviceName = name;
    }
    window.savePrinterSettingsData(s);
    utils.showToast('Printer settings saved!', 'success');
};

window.testPrinterConnection = async () => {
    const s = window.getPrinterSettings();

    if (s.interface === 'bluetooth') {
        if (window._btPrinterCharacteristic) {
            try {
                // ESC/POS test: print a simple line
                const encoder = new TextEncoder();
                const testData = encoder.encode('\x1B@TEST PRINT - ARUNALU\n\n\n');
                await window._btPrinterCharacteristic.writeValue(testData);
                utils.showToast('Test print sent via Bluetooth!', 'success');
            } catch(e) {
                utils.showToast('Test print failed: ' + e.message, 'error');
            }
        } else {
            utils.showToast('Bluetooth printer not live-connected. Please scan and connect first.', 'error');
        }
    } else if (s.interface === 'wifi') {
        utils.showToast(`WiFi Printer: ${s.wifiIp || 'Not set'}:${s.wifiPort || '9100'} - Use browser print for WiFi.`, 'info');
    } else {
        window.print();
    }
};

window.getPrinterSettings = () => {
    try {
        return JSON.parse(localStorage.getItem('printerSettings') || '{}');
    } catch { return {}; }
};

window.savePrinterSettingsData = (data) => {
    localStorage.setItem('printerSettings', JSON.stringify(data));
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
