// Members Module Logic
async function renderMembers() {
    return `
        <div class="glass-panel p-6 rounded-2xl h-full flex flex-col">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h3 class="text-xl font-bold text-gray-800">Member Management</h3>
                    <p class="text-sm text-gray-500">Manage welfare society members</p>
                </div>
                <button onclick="openMemberModal()" class="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-brand-500/30">
                    <i class="fa-solid fa-plus"></i> Add New Member
                </button>
            </div>
            
            <!-- Quick Search -->
            <div class="mb-6 relative">
                <i class="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input type="text" id="memberSearch" placeholder="Search by name, NIC or Member No..." class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all bg-white/50">
            </div>

            <!-- Members Table -->
            <div class="flex-1 overflow-auto rounded-xl border border-gray-100 bg-white/50 custom-scrollbar">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-gray-50/80 sticky top-0 backdrop-blur-md z-10">
                        <tr>
                            <th class="px-6 py-4 font-semibold text-gray-600 text-sm border-b border-gray-100">Member No</th>
                            <th class="px-6 py-4 font-semibold text-gray-600 text-sm border-b border-gray-100">Name</th>
                            <th class="px-6 py-4 font-semibold text-gray-600 text-sm border-b border-gray-100">NIC</th>
                            <th class="px-6 py-4 font-semibold text-gray-600 text-sm border-b border-gray-100">Phone</th>
                            <th class="px-6 py-4 font-semibold text-gray-600 text-sm border-b border-gray-100 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="membersTableBody" class="divide-y divide-gray-100">
                        <!-- Populated by JS -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function mountMembers() {
    loadMembersTable();

    // Search listener
    const searchInput = document.getElementById('memberSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            loadMembersTable(e.target.value.toLowerCase());
        });
    }
}

async function loadMembersTable(searchQuery = '') {
    const tbody = document.getElementById('membersTableBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading...</td></tr>`;

    try {
        let members = [];
        if (searchQuery) {
            members = await db.members.filter(m =>
                (m.name && m.name.toLowerCase().includes(searchQuery)) ||
                (m.nic && m.nic.toLowerCase().includes(searchQuery)) ||
                (m.memberNo && String(m.memberNo).toLowerCase().includes(searchQuery))
            ).toArray();
        } else {
            const allM = await db.members.toArray();
            members = allM.filter(m => m && typeof m === 'object').reverse();
        }

        if (members.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-gray-400">No members found.</td></tr>`;
            return;
        }

        tbody.innerHTML = members.map(m => {
            const rawName = m.name || 'Unknown';
            const initial = rawName.charAt(0).toUpperCase();
            return `
            <tr class="hover:bg-brand-50/50 transition-colors">
                <td class="px-6 py-4 text-sm font-medium text-gray-800">${m.memberNo || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-600">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xs">
                            ${initial}
                        </div>
                        ${rawName}
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">${m.nic || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-600">${m.phone || '-'}</td>
                <td class="px-6 py-4 text-sm text-right space-x-2">
                    <button onclick="window.viewMemberProfile(${m.id})" class="w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors tooltip" title="Profile/Transactions">
                        <i class="fa-solid fa-user-circle"></i>
                    </button>
                    <button onclick="editMember(${m.id})" class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors tooltip" title="Edit">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button onclick="deleteMember(${m.id})" class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors tooltip" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `}).join('');
    } catch (error) {
        console.error("Error loading members:", error);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-red-500 text-sm"><div class="font-bold flex items-center justify-center gap-2"><i class="fa-solid fa-triangle-exclamation"></i> Error Loading Members</div><div class="mt-2 opacity-80">${error.message || error}</div><div class="mt-1 text-xs opacity-60">${(error.stack || '').split('\\n')[0]}</div></td></tr>`;
    }
}

window.viewMemberProfile = async (id) => {
    const member = await db.members.get(id);
    if (!member) return;

    // Fetch transactions strictly for this member
    const txs = (await db.transactions.where('memberId').equals(id).toArray()).reverse();

    let txHtml = '';
    if (txs.length === 0) {
        txHtml = `<div class="text-center py-8 text-gray-400 border border-gray-100 rounded-xl bg-gray-50"><i class="fa-solid fa-folder-open mb-2 text-2xl duration-200"></i><br>No transactions associated with this member.</div>`;
    } else {
        txHtml = `
            <div class="overflow-x-auto rounded-xl border border-gray-100 mb-4 max-h-64 custom-scrollbar">
                <table class="w-full text-left border-collapse text-sm">
                    <thead class="bg-gray-50/80 sticky top-0 backdrop-blur-md border-b border-gray-100">
                        <tr>
                            <th class="px-4 py-2.5 font-semibold text-gray-600 border-b border-gray-100">Date</th>
                            <th class="px-4 py-2.5 font-semibold text-gray-600 border-b border-gray-100">Type</th>
                            <th class="px-4 py-2.5 font-semibold text-gray-600 border-b border-gray-100">Ref</th>
                            <th class="px-4 py-2.5 font-semibold text-gray-600 border-b border-gray-100 text-right">Amount</th>
                            <th class="px-4 py-2.5 font-semibold text-gray-600 border-b border-gray-100 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">
                        ${(await Promise.all(txs.map(async tx => {
            const entryDebits = await db.entries.where('transactionId').equals(tx.id).toArray();
            const amt = entryDebits.reduce((acc, curr) => acc + (parseFloat(curr.debit) || 0), 0);
            return `
                                <tr class="hover:bg-gray-50 transition-colors">
                                    <td class="px-4 py-3 text-gray-600">${tx.date}</td>
                                    <td class="px-4 py-3"><span class="px-2 py-0.5 rounded text-xs font-semibold ${tx.type === 'Receipt' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">${tx.type}</span></td>
                                    <td class="px-4 py-3 text-gray-800">${tx.reference || '-'}</td>
                                    <td class="px-4 py-3 font-bold text-gray-800 text-right">${amt.toFixed(2)}</td>
                                    <td class="px-4 py-3 text-center">
                                        <button onclick="window.viewTransaction(${tx.id})" title="View Details" class="text-brand-600 hover:text-brand-800 p-1.5 rounded-md hover:bg-brand-50 transition-colors tooltip">
                                            <i class="fa-solid fa-eye text-sm"></i>
                                        </button>
                                    </td>
                                </tr>
                            `;
        }))).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    const rawName = member.name || 'Unknown';
    const initial = rawName.charAt(0).toUpperCase();

    // Calculate dues
    const dues = await window.getMemberDues(id);
    const totalDue = dues.entranceDue + dues.monthlyDue + dues.funeralDue;

    const html = `
        <h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-lg">
                ${initial}
            </div>
            Member Profile
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-gray-50 rounded-xl p-5 border border-gray-100 shadow-sm col-span-2">
                <h4 class="text-sm font-semibold text-brand-600 mb-3 uppercase tracking-wide border-b border-gray-200 pb-2">About Member</h4>
                <div class="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                    <p class="flex items-start"><span class="text-gray-500 w-28 shrink-0">Member No:</span> <span class="font-medium text-gray-800">${member.memberNo || '-'}</span></p>
                    <p class="flex items-start"><span class="text-gray-500 w-28 shrink-0">Joined Date:</span> <span class="font-medium text-gray-800">${member.joinedDate || '-'}</span></p>
                    <p class="flex items-start col-span-2"><span class="text-gray-500 w-28 shrink-0">Full Name:</span> <span class="font-medium text-gray-800">${rawName}</span></p>
                    <p class="flex items-start"><span class="text-gray-500 w-28 shrink-0">NIC:</span> <span class="font-medium text-gray-800">${member.nic || '-'}</span></p>
                    <p class="flex items-start"><span class="text-gray-500 w-28 shrink-0">Phone:</span> <span class="font-medium text-gray-800">${member.phone || '-'}</span></p>
                    <p class="flex items-start col-span-2"><span class="text-gray-500 w-28 shrink-0">Address:</span> <span class="font-medium text-gray-800">${member.address || '-'}</span></p>
                </div>
            </div>
            <div class="bg-brand-900 rounded-xl p-5 border border-brand-800 shadow-xl text-white">
                 <h4 class="text-xs font-black text-brand-300 mb-4 uppercase tracking-widest flex items-center gap-2">
                    <i class="fa-solid fa-wallet"></i> Outstanding Dues
                 </h4>
                 <div class="space-y-3">
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-brand-300">Entrance:</span>
                        <span class="font-bold">${dues.entranceDue.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-brand-300">Monthly:</span>
                        <span class="font-bold">${dues.monthlyDue.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-brand-300">Funerals:</span>
                        <span class="font-bold">${dues.funeralDue.toFixed(2)}</span>
                    </div>
                    <div class="pt-3 border-t border-brand-800 flex justify-between items-end">
                        <span class="text-[10px] font-bold text-brand-400">TOTAL DUE</span>
                        <span class="text-xl font-black text-white">Rs. ${totalDue.toFixed(2)}</span>
                    </div>
                 </div>
                 ${totalDue > 0 ? `
                    <button onclick="window.utils.closeModal(); openTransactionModal('Receipt'); setTimeout(() => { document.getElementById('txPayerInput').value = '${member.memberNo} - ${rawName}'; window.handleTxMemberSelection('${member.memberNo} - ${rawName}'); }, 300)" class="w-full mt-4 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-xs font-bold transition-all border border-white/10">
                        Collect Payment Now
                    </button>
                 ` : ''}
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div class="bg-gray-50 rounded-xl p-5 border border-gray-100 shadow-sm">
                 <h4 class="text-sm font-semibold text-brand-600 mb-3 uppercase tracking-wide border-b border-gray-200 pb-2">Family & Nominees</h4>
                 <div class="space-y-2.5 text-sm">
                    <p class="flex items-start"><span class="text-gray-500 w-28 shrink-0">Marital Status:</span> <span class="font-medium text-gray-800">${member.maritalStatus || 'Married'}</span></p>
                    <p class="flex items-start"><span class="text-gray-500 w-28 shrink-0">Nominees:</span> <span class="font-medium text-gray-800 bg-brand-100 text-brand-700 px-2 py-0.5 rounded text-xs">${(member.nominees || []).length} Saved</span></p>
                    <p class="flex items-start"><span class="text-gray-500 w-28 shrink-0">Death Ben.:</span> <span class="font-medium text-gray-800">${member.benName || '-'}</span></p>
                 </div>
            </div>
        </div>

        <div class="border-t border-gray-200 pt-5">
            <h4 class="text-sm font-semibold text-brand-600 mb-3 uppercase tracking-wide">Transaction History</h4>
            ${txHtml}
        </div>

        <div class="pt-4 flex justify-end gap-3 mt-4 border-t border-gray-100">
            <button type="button" onclick="window.utils.closeModal()" class="px-5 py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors border border-gray-200">Close</button>
            <button type="button" onclick="window.editMember(${member.id})" class="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-brand-500/30">
                <i class="fa-solid fa-pen mr-2"></i> Edit Member Details
            </button>
        </div>
    `;

    // Special injection for a wider profile modal
    const container = document.getElementById('modal-container');
    container.innerHTML = `
        <div class="glass-panel p-6 rounded-2xl w-full max-w-3xl shadow-2xl relative animate-scale-up">
            <button onclick="utils.closeModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                <i class="fa-solid fa-xmark text-xl"></i>
            </button>
            ${html}
        </div>
    `;
    container.classList.remove('hidden');
    container.classList.add('flex');
    requestAnimationFrame(() => {
        container.classList.remove('opacity-0');
        container.classList.add('opacity-100');
    });
    container.onmousedown = (e) => {
        if (e.target === container) {
            utils.closeModal();
        }
    };
};

window.addNomineeRow = (nominee = { name: '', relation: '', address: '', dob: '' }) => {
    const container = document.getElementById('nomineesContainer');
    if (!container) return;

    const row = document.createElement('div');
    row.className = "p-4 bg-gray-50 rounded-xl border border-gray-200 relative mb-4";
    row.innerHTML = `
        <button type="button" onclick="this.parentElement.remove()" class="absolute top-2 right-2 text-red-400 hover:text-red-500 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors">
            <i class="fa-solid fa-trash"></i>
        </button>
        <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nominee Name</label>
                <input type="text" name="nomName[]" value="${nominee.name}" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                <input type="text" name="nomRelation[]" value="${nominee.relation}" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all">
            </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea name="nomAddress[]" rows="2" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all resize-none">${nominee.address}</textarea>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input type="date" name="nomDob[]" value="${nominee.dob}" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all">
            </div>
        </div>
    `;
    container.appendChild(row);
};

window.openMemberModal = async (id = null) => {
    let member = {
        memberNo: '', name: '', nic: '', phone: '', joinedDate: new Date().toISOString().split('T')[0],
        dob: '', address: '', maritalStatus: 'Married',
        benName: '', benAddress: '', benPhone: '',
        openingEntrancePaid: 0, openingPaidUntil: '',
        nominees: [] // array replacing single flat attributes
    };
    let isEdit = false;

    if (id) {
        const found = await db.members.get(id);
        if (found) {
            member = { ...member, ...found };
            isEdit = true;
            // Legacy Migration map single properties directly to first item in nominees list
            if (member.nominees.length === 0 && (member.nomName || member.nomRelation || member.nomAddress)) {
                member.nominees = [{
                    name: member.nomName || '',
                    address: member.nomAddress || '',
                    dob: member.nomDob || '',
                    relation: member.nomRelation || ''
                }];
                // Cleanup old properties to avoid confusion (not strictly needed but good practice)
                delete member.nomName; delete member.nomAddress; delete member.nomDob; delete member.nomRelation;
            }
        }
    }

    const html = `
        <h3 class="text-xl font-bold text-gray-800 mb-6">${isEdit ? 'Edit Member' : 'Add New Member'}</h3>
        <form id="memberForm" class="space-y-6 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar" onsubmit="window.saveMember(event, ${id})">
            
            <!-- Basic Information -->
            <div>
                <h4 class="text-lg font-semibold text-brand-600 mb-3 border-b pb-2">Basic Details</h4>
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Member Number <span class="text-red-500">*</span></label>
                        <input type="text" id="mNo" required value="${member.memberNo}" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Joined Date <span class="text-red-500">*</span></label>
                        <input type="date" id="mJoined" required value="${member.joinedDate}" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all">
                    </div>
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Full Name <span class="text-red-500">*</span></label>
                    <input type="text" id="mName" required value="${member.name}" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all">
                </div>
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">NIC <span class="text-red-500">*</span></label>
                        <input type="text" id="mNic" required value="${member.nic}" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input type="date" id="mDob" value="${member.dob}" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all">
                    </div>
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Permanent Address</label>
                    <textarea id="mAddress" rows="2" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all resize-none">${member.address}</textarea>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input type="text" id="mPhone" value="${member.phone}" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                        <select id="mMarital" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all bg-white">
                            <option value="Married" ${member.maritalStatus === 'Married' ? 'selected' : ''}>Married (විවාහක)</option>
                            <option value="Single" ${member.maritalStatus === 'Single' ? 'selected' : ''}>Single (අවිවාහක)</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Death Beneficiary Details -->
            <div>
                <h4 class="text-lg font-semibold text-brand-600 mb-3 border-b pb-2">Death Beneficiary (<span class="text-sm font-normal">මිය ගිය විට ප්‍රතිලාභ ලබන්නා</span>)</h4>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Beneficiary Full Name</label>
                    <input type="text" id="mBenName" value="${member.benName}" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Permanent Address</label>
                        <textarea id="mBenAddress" rows="2" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all resize-none">${member.benAddress}</textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input type="text" id="mBenPhone" value="${member.benPhone}" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all">
                    </div>
                </div>
            </div>

            <!-- Opening Balances / Initial State -->
            <div>
                <h4 class="text-lg font-semibold text-amber-600 mb-3 border-b pb-2 flex items-center gap-2">
                    <i class="fa-solid fa-clock-rotate-left"></i> Opening Balances / Initial State
                </h4>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Initial Entrance Fee Paid (Rs.)</label>
                        <input type="number" id="mOpeningEntrance" value="${member.openingEntrancePaid || 0}" step="0.01" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder-gray-400">
                        <p class="text-[10px] text-gray-500 mt-1">Amount paid before system migration (System max is 13,000)</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Monthly Payments Done Until</label>
                        <input type="month" id="mOpeningPaidUntil" value="${member.openingPaidUntil || ''}" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all">
                        <p class="text-[10px] text-gray-500 mt-1">Select the last month the member fully paid for.</p>
                    </div>
                </div>
            </div>

            <!-- Nominee Details -->
            <div>
                <div class="flex justify-between items-center mb-3 border-b pb-2">
                    <h4 class="text-lg font-semibold text-brand-600">General Nominees (<span class="text-sm font-normal">ප්‍රතිලාභ සඳහා නම් කරන අය</span>)</h4>
                    <button type="button" onclick="window.addNomineeRow()" class="text-xs text-brand-600 font-medium hover:text-brand-700 bg-brand-50 hover:bg-brand-100 flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors border border-brand-100">
                        <i class="fa-solid fa-plus"></i> Add Nominee
                    </button>
                </div>
                
                <div id="nomineesContainer">
                    <!-- Dynamically injected nominee rows -->
                </div>
            </div>
            
            <div class="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white/90 backdrop-blur-md pb-2 mt-4 border-t border-gray-100">
                <button type="button" onclick="window.utils.closeModal()" class="px-5 py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors">Cancel</button>
                <button type="submit" class="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-brand-500/30">
                    <i class="fa-solid fa-save mr-2"></i> Save Member
                </button>
            </div>
        </form>
    `;

    window.utils.showModal(html);

    // Mount initial rows
    requestAnimationFrame(() => {
        if (member.nominees.length === 0) {
            window.addNomineeRow();
        } else {
            member.nominees.forEach(n => window.addNomineeRow(n));
        }
    });
};

window.saveMember = async (e, id) => {
    e.preventDefault();

    try {
        // Collect Dynamic Nominee arrays
        const nomNames = Array.from(document.getElementsByName('nomName[]')).map(el => el.value);
        const nomRelations = Array.from(document.getElementsByName('nomRelation[]')).map(el => el.value);
        const nomAddresses = Array.from(document.getElementsByName('nomAddress[]')).map(el => el.value);
        const nomDobs = Array.from(document.getElementsByName('nomDob[]')).map(el => el.value);

        const nomineesList = [];
        for (let i = 0; i < nomNames.length; i++) {
            if (nomNames[i] || nomRelations[i] || nomAddresses[i] || nomDobs[i]) {
                nomineesList.push({
                    name: nomNames[i] || '',
                    relation: nomRelations[i] || '',
                    address: nomAddresses[i] || '',
                    dob: nomDobs[i] || ''
                });
            }
        }

        const payload = {
            memberNo: document.getElementById('mNo').value,
            name: document.getElementById('mName').value,
            nic: document.getElementById('mNic').value,
            phone: document.getElementById('mPhone').value,
            joinedDate: document.getElementById('mJoined').value,
            dob: document.getElementById('mDob').value,
            address: document.getElementById('mAddress').value,
            maritalStatus: document.getElementById('mMarital').value,
            benName: document.getElementById('mBenName').value,
            benAddress: document.getElementById('mBenAddress').value,
            benPhone: document.getElementById('mBenPhone').value,
            openingEntrancePaid: parseFloat(document.getElementById('mOpeningEntrance').value) || 0,
            openingPaidUntil: document.getElementById('mOpeningPaidUntil').value,
            nominees: nomineesList
        };

        if (id) {
            await db.members.update(id, payload);
            window.utils.showToast('Member updated successfully');
        } else {
            // Check if member already exists by NIC or No
            const existing = await db.members.where('memberNo').equals(payload.memberNo).or('nic').equals(payload.nic).first();
            if (existing && existing.id !== id) {
                window.utils.showToast('Member Number or NIC already exists!', 'error');
                return;
            }
            await db.members.add(payload);
            window.utils.showToast('Member added successfully');
        }

        window.utils.closeModal();
        loadMembersTable();
        if (window.refreshCurrentView) window.refreshCurrentView();
    } catch (err) {
        console.error(err);
        window.utils.showToast('Error saving member', 'error');
    }
};

window.editMember = (id) => {
    window.openMemberModal(id);
};

window.deleteMember = async (id) => {
    if (confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
        try {
            await db.members.delete(id);
            window.utils.showToast('Member deleted successfully');
            loadMembersTable();
            if (window.refreshCurrentView) window.refreshCurrentView();
        } catch (err) {
            window.utils.showToast('Error deleting member', 'error');
        }
    }
};
