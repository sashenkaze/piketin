import { useState, useEffect } from 'react';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle,
    CheckCircle,
    XCircle,
    Clock,
    Droplets,
    X
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

//* status submission badge 
const StatusBadge = ({ status }) => {
    const map = {
        Pending:  { color: 'bg-orange-50 text-orange-700 border-orange-100', icon: <Clock size={12} /> },
        Accepted: { color: 'bg-green-50 text-green-700 border-green-100',   icon: <CheckCircle size={12} /> },
        Declined: { color: 'bg-red-50 text-red-700 border-red-100',         icon: <XCircle size={12} /> },
    };
    const s = map[status] ?? map.Pending;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${s.color}`}>
            {s.icon}{status}
        </span>
    );
};

//* modal input alasan decline
function DeclineModal({ isOpen, onClose, onConfirm }) {
    const [alasan, setAlasan] = useState('');

    useEffect(() => { if (!isOpen) setAlasan(''); }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900">Alasan Decline</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700 ml-1">Alasan Decline <span className="text-red-500">*</span></label>
                        <textarea
                            rows={3}
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-sm resize-none"
                            placeholder="Tulis alasan decline di sini..."
                            value={alasan}
                            onChange={(e) => setAlasan(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                            Batal
                        </button>
                        <button
                            type="button"
                            disabled={!alasan.trim()}
                            onClick={() => onConfirm(alasan)}
                            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                        >
                            Decline
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

//* page manage submission piket wc utk kokurikuler
export default function ManagePiketWc() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState(''); //* status submission

    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

    // state modal decline
    const [declineTarget, setDeclineTarget] = useState(null); //* submission yg fi decline
    const [actionLoading, setActionLoading] = useState(null); // id submission

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    //* ambil userData dr localStorage buat sidebar
    useEffect(() => {
        const storedUser = localStorage.getItem("userData");
        if (storedUser) setCurrentUser(JSON.parse(storedUser));
    }, []);

    //! fetch ulang kl page atau filter status berubah
    useEffect(() => {
        fetchSubmissions();
    }, [pagination.page, filterStatus]);

    //! ambil semua submission piket wc dr be
    const fetchSubmissions = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const statusParam = filterStatus ? `&status=${filterStatus}` : '';
            const res = await fetch(
                `http://localhost:3000/piket-wc?page=${pagination.page}&limit=${pagination.limit}${statusParam}`,
                { headers: { Authorization: token } }
            );
            const result = await res.json();
            if (result.status === 200) {
                setSubmissions(result.data.data);
                setPagination(prev => ({ ...prev, total: result.data.total }));
            } else {
                setError(result.message || "Gagal mengambil data");
            }
        } catch (err) {
            console.error("Fetch Error:", err);
            setError("Terjadi kesalahan koneksi ke server.");
        } finally {
            setLoading(false);
        }
    };

    //! accept submission langsung tanpa modal — kondisi default 'Bersih' sesuai kebutuhan kokurikuler
    const handleAccept = async (id) => {
        setActionLoading(id);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:3000/piket-wc/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: token },
                body: JSON.stringify({ action: 'accept', kondisi: 'Bersih' })
            });
            if (res.ok) fetchSubmissions();
            else {
                const err = await res.json();
                alert(err.message || "Gagal accept");
            }
        } catch { alert("Terjadi kesalahan"); }
        finally { setActionLoading(null); }
    };

    //! decline submission. buka modal dulu untuk input alasan
    const handleDeclineConfirm = async (alasan) => {
        setActionLoading(declineTarget.id);
        setDeclineTarget(null);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:3000/piket-wc/${declineTarget.id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: token },
                body: JSON.stringify({ action: 'decline', alasan_decline: alasan })
            });
            if (res.ok) fetchSubmissions();
            else {
                const err = await res.json();
                alert(err.message || "Gagal decline");
            }
        } catch { alert("Terjadi kesalahan"); }
        finally { setActionLoading(null); }
    };

    //* filter di frontend berdasarkan nama murid
    const filtered = submissions.filter(s =>
        s.User?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 flex overflow-hidden">
            <Sidebar user={currentUser} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <main className="flex-1 md:ml-64 p-4 md:p-8 animate-fadeIn">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manage Piket WC</h1>
                    <p className="text-gray-500 mt-1">Review dan setujui pengajuan absen piket WC murid.</p>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari nama murid..."
                            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                    >
                        <option value="">Semua Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Declined">Declined</option>
                    </select>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="animate-spin text-green-600 mb-4" size={40} />
                            <p className="text-gray-500 font-medium">Memuat data...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                            <AlertCircle className="text-red-500 mb-4" size={40} />
                            <p className="text-gray-900 font-bold text-lg mb-2">Gagal Memuat Data</p>
                            <p className="text-gray-500 max-w-xs">{error}</p>
                            <button onClick={fetchSubmissions} className="mt-6 text-green-600 font-bold hover:underline">Coba Lagi</button>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Droplets className="text-gray-300 mb-4" size={40} />
                            <p className="text-gray-400 font-medium italic">Tidak ada submission ditemukan.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                            <th className="px-6 py-4">Murid</th>
                                            <th className="px-6 py-4">Tanggal</th>
                                            <th className="px-6 py-4">Tugas</th>
                                            <th className="px-6 py-4">Kondisi</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Alasan Decline</th>
                                            <th className="px-6 py-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filtered.map((sub) => (
                                            <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm border border-purple-100 shrink-0">
                                                            {sub.User?.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900">{sub.User?.name}</p>
                                                            <p className="text-xs text-gray-400">{sub.User?.nis}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{sub.tanggal_piket}</td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">Tugas {sub.tugas}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{sub.kondisi || '—'}</td>
                                                <td className="px-6 py-4"><StatusBadge status={sub.status} /></td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{sub.alasan_decline || '—'}</td>
                                                <td className="px-6 py-4 text-right">
                                                    {/* tombol aksi hanya tampil kalau masih Pending */}
                                                    {sub.status === 'Pending' && (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleAccept(sub.id)}
                                                                disabled={actionLoading === sub.id}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
                                                            >
                                                                {actionLoading === sub.id
                                                                    ? <Loader2 size={12} className="animate-spin" />
                                                                    : <CheckCircle size={14} />
                                                                }
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={() => setDeclineTarget(sub)}
                                                                disabled={actionLoading === sub.id}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
                                                            >
                                                                <XCircle size={14} />
                                                                Decline
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                                <p className="text-sm text-gray-500">
                                    Menampilkan <span className="font-bold text-gray-900">{filtered.length}</span> dari <span className="font-bold text-gray-900">{pagination.total}</span> data
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={pagination.page === 1}
                                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                        className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <span className="text-sm font-bold px-3">Halaman {pagination.page}</span>
                                    <button
                                        disabled={submissions.length < pagination.limit}
                                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                        className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            <DeclineModal
                isOpen={!!declineTarget}
                onClose={() => setDeclineTarget(null)}
                onConfirm={handleDeclineConfirm}
            />
        </div>
    );
}
