import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

/**
 * DeleteConfirmModal Component
 * Reusable simple confirmation modal for deletions.
 */
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
            {/* Overlay Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-fadeIn"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-scaleIn p-6 border border-gray-100">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
                        <AlertTriangle size={32} />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                        {message}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="w-full py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors order-2 sm:order-1"
                        >
                            Batal
                        </button>
                        <button
                            onClick={onConfirm}
                            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-2 active:scale-95 order-1 sm:order-2"
                        >
                            <Trash2 size={18} />
                            Ya, Hapus Data
                        </button>
                    </div>
                </div>

                {/* Close Icon (Top Right) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;