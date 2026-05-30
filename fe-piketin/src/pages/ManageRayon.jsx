import { useState, useEffect } from 'react';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    UserPlus,
    Loader2,
    AlertCircle,
    Edit2,
    Trash2,
    MapPin,
    Download
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

// ─── RayonTable ────────────────────────────────────────────────────────────────
// komponen tabel khusus rayon — gak pakai UserTable karena field nya beda
// rayon cuma punya id dan nama_rayon, gak ada email/role
function RayonTable({ data, onEdit, onDelete }) {
    if (data.length === 0) {
        return (
            <div className="p-20 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
                    <MapPin size={32} />
                </div>
                <p className="text-gray-500 font-medium italic">Tidak ada data rayon ditemukan.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Nama Rayon</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.map((rayon) => (
                        <tr key={rayon.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-6 py-4">
                                <span className="text-sm font-bold text-gray-400">#{rayon.id}</span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    {/* avatar huruf pertama nama rayon */}
                                    <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center font-bold border border-green-100">
                                        {rayon.nama_rayon.charAt(0).toUpperCase()}
                                    </div>
                                    <p className="text-sm font-bold text-gray-900">{rayon.nama_rayon}</p>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                {/* tombol aksi muncul pas hover row */}
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onEdit(rayon)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit Rayon"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(rayon)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Hapus Rayon"
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

// ─── RayonFormModal ────────────────────────────────────────────────────────────
// modal form create/edit rayon — field nya cuma nama_rayon
// mode edit: isi form dari data rayon yg dipilih
// mode create: form kosong
function RayonFormModal({ isOpen, onClose, onSubmit, rayon }) {
    //! isEdit: kalau rayon ada berarti mode edit, kalau null berarti mode create
    const isEdit = !!rayon;
    const [namaRayon, setNamaRayon] = useState('');

    //* sync form ke data rayon yg dipilih pas modal dibuka
    useEffect(() => {
        if (rayon) {
            setNamaRayon(rayon.nama_rayon);
        } else {
            setNamaRayon('');
        }
    }, [rayon, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ nama_rayon: namaRayon });
    };

    if (!isOpen) return null;

    return (
        // overlay gelap di belakang modal
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                {/* header modal */}
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {isEdit ? 'Edit Rayon' : 'Tambah Rayon Baru'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {isEdit ? `Ubah nama rayon "${rayon.nama_rayon}"` : 'Isi nama rayon yang ingin ditambahkan.'}
                    </p>
                </div>

                {/* form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700 ml-1">Nama Rayon</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-green-600 transition-colors">
                                <MapPin size={18} />
                            </div>
                            <input
                                type="text"
                                required
                                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all text-sm"
                                placeholder="Contoh: Rayon Wikrama 1"
                                value={namaRayon}
                                onChange={(e) => setNamaRayon(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* tombol aksi */}
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
                            className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors"
                        >
                            {isEdit ? 'Simpan Perubahan' : 'Tambah Rayon'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── ManageRayon Page ──────────────────────────────────────────────────────────
export default function ManageRayon() {
    // state data dan loading
    const [rayons, setRayons] = useState([]);
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
    const [selectedRayon, setSelectedRayon] = useState(null); // null = mode tambah, object = mode edit

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [exportLoading, setExportLoading] = useState(false);

    //* ambil userData dari localStorage buat sidebar
    useEffect(() => {
        const storedUser = localStorage.getItem("userData");
        if (storedUser) setCurrentUser(JSON.parse(storedUser));
    }, []);

    //! fetch ulang kalau page berubah
    useEffect(() => {
        fetchRayons();
    }, [pagination.page]);

    //! ambil semua data rayon dari backend
    // endpoint: GET /rayon?page=&limit=
    // backend support filter nama_rayon lewat query param
    const fetchRayons = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            //* token dikirim mentah tanpa prefix "Bearer " — sesuai checkToken di auth.js
            const res = await fetch(
                `http://localhost:3000/rayons?page=${pagination.page}&limit=${pagination.limit}`,
                { headers: { Authorization: token } }
            );

            const result = await res.json();

            if (result.status === 200) {
                setRayons(result.data.data);
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

    //! search — filter di frontend karena backend pakai query param nama_rayon
    // kalau mau pindah ke backend search, ganti fetchRayons() tambah &nama_rayon=${searchTerm}
    const handleSearch = (e) => {
        e.preventDefault();
        fetchRayons();
    };

    //! export excel daftar rayon — endpoint: GET /manage-users/export-rayons
    const handleExport = async () => {
        setExportLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch('http://localhost:3000/manage-users/export-rayons', {
                headers: { Authorization: token }
            });
            if (!res.ok) throw new Error("Gagal export");
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'daftar-rayon.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert("Gagal mengexport data");
        } finally {
            setExportLoading(false);
        }
    };

    //! hapus rayon berdasarkan id
    const handleDelete = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:3000/rayons/${selectedRayon.id}`, {
                method: 'DELETE',
                headers: { Authorization: token }
            });

            if (res.ok) {
                setIsDeleteModalOpen(false);
                setSelectedRayon(null);
                fetchRayons(); //* refresh tabel setelah hapus
            } else {
                alert("Gagal menghapus rayon");
            }
        } catch (err) {
            alert("Terjadi kesalahan saat menghapus rayon");
        }
    };

    //! create atau update rayon
    // isEdit ditentukan dari selectedRayon — null = create, ada data = update
    const handleFormSubmit = async ({ nama_rayon }) => {
        const isEdit = !!selectedRayon;
        const url = isEdit
            ? `http://localhost:3000/rayons/${selectedRayon.id}`
            : `http://localhost:3000/rayons`;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token
                },
                body: JSON.stringify({ nama_rayon })
            });

            if (res.ok) {
                setIsFormModalOpen(false);
                setSelectedRayon(null);
                fetchRayons(); //* refresh tabel setelah save
            } else {
                const errData = await res.json();
                alert(errData.message || "Gagal menyimpan data");
            }
        } catch (err) {
            alert("Terjadi kesalahan saat menyimpan data");
        }
    };

    //* filter data di frontend berdasarkan searchTerm
    const filteredRayons = rayons.filter(r =>
        r.nama_rayon.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 flex overflow-hidden">
            <Sidebar user={currentUser} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <main className="flex-1 md:ml-64 p-4 md:p-8 animate-fadeIn">
                {/* Header Halaman */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manage Rayon</h1>
                        <p className="text-gray-500 mt-1">Kelola data rayon yang terdaftar di sistem.</p>
                    </div>

                    <div className="flex items-center gap-3 self-start md:self-center">
                        <button
                            onClick={handleExport}
                            disabled={exportLoading}
                            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl font-bold border border-gray-200 shadow-sm transition-all active:scale-95 disabled:opacity-60"
                        >
                            {exportLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                            Export Excel
                        </button>
                        <button
                            onClick={() => { setSelectedRayon(null); setIsFormModalOpen(true); }}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all active:scale-95"
                        >
                            <UserPlus size={20} strokeWidth={2.5} />
                            Tambah Rayon
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6">
                    <form onSubmit={handleSearch} className="relative w-full max-w-md">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari nama rayon..."
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
                            <button onClick={fetchRayons} className="mt-6 text-green-600 font-bold hover:underline">Coba Lagi</button>
                        </div>
                    ) : (
                        <>
                            <RayonTable
                                data={filteredRayons}
                                onEdit={(rayon) => { setSelectedRayon(rayon); setIsFormModalOpen(true); }}
                                onDelete={(rayon) => { setSelectedRayon(rayon); setIsDeleteModalOpen(true); }}
                            />

                            {/* Pagination */}
                            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                                <p className="text-sm text-gray-500">
                                    Menampilkan <span className="font-bold text-gray-900">{filteredRayons.length}</span> dari <span className="font-bold text-gray-900">{pagination.total}</span> data
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
                                        disabled={rayons.length < pagination.limit}
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
            <RayonFormModal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setSelectedRayon(null); }}
                onSubmit={handleFormSubmit}
                rayon={selectedRayon}
            />

            {/* Modal Konfirmasi Hapus */}
            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setSelectedRayon(null); }}
                onConfirm={handleDelete}
                title="Hapus Rayon"
                message={`Apakah kamu yakin ingin menghapus rayon "${selectedRayon?.nama_rayon}"? Tindakan ini tidak bisa dibatalkan.`}
            />
        </div>
    );
}
