window.utils = {
    showToast: (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded border shadow-xl transition-all duration-300 translate-y-10 opacity-0 z-[100] flex items-center gap-3 bg-white ${type === 'success' ? 'border-emerald-200' :
                type === 'error' ? 'border-red-200' : 'border-blue-200'
            }`;
        toast.innerHTML = `
            <i class="fa-solid ${type === 'success' ? 'fa-circle-check text-emerald-500' : type === 'error' ? 'fa-circle-xmark text-red-500' : 'fa-circle-info text-blue-500'} text-lg"></i>
            <span class="text-sm font-semibold text-gray-800">${message}</span>
        `;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-10', 'opacity-0');
        });

        setTimeout(() => {
            toast.classList.add('translate-y-10', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    showModal: (htmlContent) => {
        const container = document.getElementById('modal-container');
        container.classList.remove('bg-slate-900/40', 'backdrop-blur-sm');
        container.classList.add('bg-gray-900/60');

        container.innerHTML = `
            <div class="bg-white p-8 rounded shadow-2xl w-full max-w-2xl relative border border-gray-200">
                <button onclick="utils.closeModal()" class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                    <i class="fa-solid fa-xmark text-lg"></i>
                </button>
                <div class="modal-body overflow-y-auto max-h-[85vh] custom-scrollbar">
                    ${htmlContent}
                </div>
            </div>
        `;

        container.classList.remove('hidden');
        requestAnimationFrame(() => {
            container.classList.remove('opacity-0');
            container.classList.add('opacity-100');
        });

        container.onmousedown = (e) => {
            if (e.target === container) {
                utils.closeModal();
            }
        };
    },

    closeModal: () => {
        const container = document.getElementById('modal-container');
        container.classList.remove('opacity-100');
        container.classList.add('opacity-0');
        setTimeout(() => {
            container.classList.add('hidden');
            container.innerHTML = '';
        }, 200);
    }
};
