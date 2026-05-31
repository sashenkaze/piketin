import { useState, useEffect } from 'react';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Plus,
    Loader2,
    AlertCircle,
    Edit2,
    Trash2,
    Briefcase,
    X,
    Save
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

// ─── JpTable ──────────────────────────────────────────────────────────────────
// tabel daftar jenis pekerjaan — field: id dan nama_pekerjaan
function JpTable({ data, onEdit, onDelete }) {
    if (data.length === 0) {
        return (
            <div className="p-20 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
                    <Briefcase size={32} />
                </div>
                <p className="text-gray-500 font-medium italic">Belum ada jenis pekerjaan.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Nama Pekerjaan</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.map((jp) => (
                        <tr key={jp.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-6 py-4">
                                <span className="text-sm font-bold text-gray-400">#{jp.id}</span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center font-bold border border-green-100">
                                        {jp.nama_pekerjaan.charAt(0).toUpperCase()}
                                    </div>
                                    <p className="text-sm font-bold text-gray-900">{jp.nama_pekerjaan}</p>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                {/* tombol aksi muncul pas hover row */}
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onEdit(jp)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit Pekerjaan"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(jp)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Hapus Pekerjaan"
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
}

// ─── JpFormModal ──────────────────────────────────────────────────────────────
// modal form create/edit jenis pekerjaan — field cuma nama_pekerjaan
function JpFormModal({ isOpen, onClose, onSubmit, jp }) {
    //! isEdit: kalau jp ada berarti mode edit, kalau null berarti mode create
    const isEdit = !!jp;
    const [namaPekerjaan, setNamaPekerjaan] = useState('');

    //* sync form ke data jp yang dipilih pas modal dibuka
    useEffect(() => {
        setNamaPekerjaan(jp ? jp.nama_pekerjaan : '');
    }, [jp, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ nama_pekerjaan: namaPekerjaan });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                {/* header modal */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900">
                        {isEdit ? 'Edit Jenis Pekerjaan' : 'Tambah Jenis Pekerjaan'}
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700 ml-1">Nama Pekerjaan</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-green-600 transition-colors">
                                <Briefcase size={18} />
                            </div>
                            <input
                                type="text"
                                required
                                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all text-sm"
                                placeholder="Contoh: Menyapu Lantai"
                                value={namaPekerjaan}
                                onChange={(e) => setNamaPekerjaan(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            <Save size={16} />
                            {isEdit ? 'Simpan Perubahan' : 'Tambah'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── ManageJenisPekerjaan Page ─────────────────────────────────────────────────
// halaman crud jenis pekerjaan untuk psrayon
// endpoint: GET/POST/PUT/DELETE /jenis-pekerjaan
export default function ManageJenisPekerjaan() {
    // state data dan loading
    const [jenisPekerjaan, setJenisPekerjaan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // state pagination
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0
    });

    // state modal
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedJp, setSelectedJp] = useState(null); // null = mode tambah, object = mode edit

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    //* ambil userData dari localStorage buat sidebar
    useEffect(() => {
        const storedUser = localStorage.getItem("userData");
        if (storedUser) setCurrentUser(JSON.parse(storedUser));
    }, []);

    //! fetch ulang kalau page berubah
    useEffect(() => {
        fetchJp();
    }, [pagination.page]);

    //! ambil semua jenis pekerjaan dari backend
    // endpoint: GET /jenis-pekerjaan?page=&limit=
    const fetchJp = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            //* token tanpa "Bearer " — sesuai checkToken di auth.js
            const res = await fetch(
                `http://localhost:3000/jenis-pekerjaan?page=${pagination.page}&limit=${pagination.limit}`,
                { headers: { Authorization: token } }
            );

            const result = await res.json();

            if (result.status === 200) {
                setJenisPekerjaan(result.data.data);
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

    // search — filter di frontend
    const handleSearch = (e) => {
        e.preventDefault();
        fetchJp();
    };

    //! hapus jenis pekerjaan
    const handleDelete = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:3000/jenis-pekerjaan/${selectedJp.id}`, {
                method: 'DELETE',
                headers: { Authorization: token }
            });

            if (res.ok) {
                setIsDeleteModalOpen(false);
                setSelectedJp(null);
                fetchJp(); //* refresh tabel setelah hapus
            } else {
                alert("Gagal menghapus jenis pekerjaan");
            }
        } catch (err) {
            alert("Terjadi kesalahan saat menghapus");
        }
    };

    //! create atau update jenis pekerjaan
    const handleFormSubmit = async ({ nama_pekerjaan }) => {
        const isEdit = !!selectedJp;
        const url = isEdit
            ? `http://localhost:3000/jenis-pekerjaan/${selectedJp.id}`
            : `http://localhost:3000/jenis-pekerjaan`;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token
                },
                body: JSON.stringify({ nama_pekerjaan })
            });

            if (res.ok) {
                setIsFormModalOpen(false);
                setSelectedJp(null);
                fetchJp(); //* refresh tabel setelah save
            } else {
                const errData = await res.json();
                alert(errData.message || "Gagal menyimpan data");
            }
        } catch (err) {
            alert("Terjadi kesalahan saat menyimpan data");
        }
    };

    //* filter data di frontend berdasarkan searchTerm
    const filteredJp = jenisPekerjaan.filter(jp =>
        jp.nama_pekerjaan.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 flex overflow-hidden">
            <Sidebar user={currentUser} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <main className="flex-1 md:ml-64 p-4 md:p-8 animate-fadeIn">
                {/* Header Halaman */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Jenis Pekerjaan</h1>
                        <p className="text-gray-500 mt-1">Kelola daftar pekerjaan yang bisa dilakukan saat piket rayon.</p>
                    </div>

                    <button
                        onClick={() => { setSelectedJp(null); setIsFormModalOpen(true); }}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all active:scale-95 self-start md:self-center"
                    >
                        <Plus size={20} strokeWidth={2.5} />
                        Tambah Pekerjaan
                    </button>
                </div>

                {/* Search Bar */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6">
                    <form onSubmit={handleSearch} className="relative w-full max-w-md">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari nama pekerjaan..."
                            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </form>
                </div>

                {/* Tabel */}
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
                            <button onClick={fetchJp} className="mt-6 text-green-600 font-bold hover:underline">Coba Lagi</button>
                        </div>
                    ) : (
                        <>
                            <JpTable
                                data={filteredJp}
                                onEdit={(jp) => { setSelectedJp(jp); setIsFormModalOpen(true); }}
                                onDelete={(jp) => { setSelectedJp(jp); setIsDeleteModalOpen(true); }}
                            />

                            {/* Pagination */}
                            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                                <p className="text-sm text-gray-500">
                                    Menampilkan <span className="font-bold text-gray-900">{filteredJp.length}</span> dari <span className="font-bold text-gray-900">{pagination.total}</span> data
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
                                        disabled={jenisPekerjaan.length < pagination.limit}
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

            {/* Modal Form Create/Edit */}
            <JpFormModal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setSelectedJp(null); }}
                onSubmit={handleFormSubmit}
                jp={selectedJp}
            />

            {/* Modal Konfirmasi Hapus */}
            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setSelectedJp(null); }}
                onConfirm={handleDelete}
                title="Hapus Jenis Pekerjaan"
                message={`Apakah kamu yakin ingin menghapus "${selectedJp?.nama_pekerjaan}"? Tindakan ini tidak bisa dibatalkan.`}
            />
        </div>
    );
}
