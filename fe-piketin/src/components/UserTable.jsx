import React from 'react';
import { Edit2, Trash2, ShieldCheck, User } from 'lucide-react';

/**
 * UserTable Component
 * Reusable table for displaying user data (PS Rayon, Kokurikuler, Murid).
 */
const UserTable = ({ data, onEdit, onDelete, showRayon = true }) => {
    if (data.length === 0) {
        return (
            <div className="p-20 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
                    <User size={32} />
                </div>
                <p className="text-gray-500 font-medium italic">Tidak ada data ditemukan.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Nama & Email</th>
                        {showRayon && <th className="px-6 py-4">Rayon</th>}
                        <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center font-bold border border-green-100">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                            </td>
                            {showRayon && (
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 capitalize">
                                            {user.Rayon?.nama_rayon || user.rayon_id || 'N/A'}
                                        </span>
                                    </div>
                                </td>
                            )}
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onEdit(user)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit User"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(user)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Hapus User"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserTable;