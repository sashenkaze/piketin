import { useState, useEffect } from 'react';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    UserPlus,
    Loader2,
    AlertCircle,
    Download,
    Edit2,
    Trash2,
    GraduationCap
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import MuridFormModal from '../components/MuridFormModal';

// ─── MuridTable ────────────────────────────────────────────────────────────────
// tabel khusus murid — field lebih banyak dari psrayon/kokurikuler
// kolom: nama+nis, email, jadwal piket, minggu ke, hari wc, tugas wc, aksi
function MuridTable({ data, onEdit, onDelete }) {
    if (data.length === 0) {
        return (
            <div className="p-20 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
                    <GraduationCap size={32} />
                </div>
                <p className="text-gray-500 font-medium italic">Tidak ada data murid ditemukan.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Nama & NIS</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Jadwal Piket</th>
                        <th className="px-6 py-4">Minggu Ke</th>
                        <th className="px-6 py-4">Hari WC</th>
                        <th className="px-6 py-4">Tugas WC</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.map((murid) => (
                        <tr key={murid.id} className="hover:bg-gray-50/50 transition-colors group">
                            {/* nama + nis */}
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center font-bold border border-green-100 shrink-0">
                                        {murid.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{murid.name}</p>
                                        <p className="text-xs text-gray-500">{murid.nis}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{murid.email}</td>
                            {/* jadwal piket — badge hijau */}
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                                    {murid.jadwal_piket}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">Minggu {murid.minggu_ke}</td>
                            {/* hari wc — badge biru */}
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                    {murid.hari_wc}
                                </span>
                            </td>
                            {/* tugas wc — badge abu */}
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                    Tugas {murid.tugas_wc}
                                </span>
                            </td>
                            {/* tombol aksi muncul pas hover */}
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onEdit(murid)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit Murid"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(murid)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Hapus Murid"
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

// ─── ManageMurid Page ──────────────────────────────────────────────────────────
// halaman crud murid untuk psrayon
// backend otomatis filter murid sesuai rayon_id psrayon yang login
// endpoint: GET/POST/PUT/DELETE /users
export default function ManageMurid() {
    // state data dan loading
    const [murid, setMurid] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [exportLoading, setExportLoading] = useState(false);

    // state pagination
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0
    });

    // state modal
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedMurid, setSelectedMurid] = useState(null); // null = mode tambah, object = mode edit

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    //* ambil userData dari localStorage buat sidebar
    useEffect(() => {
        const storedUser = localStorage.getItem("userData");
        if (storedUser) setCurrentUser(JSON.parse(storedUser));
    }, []);

    //! fetch ulang kalau page berubah
    useEffect(() => {
        fetchMurid();
    }, [pagination.page]);

    //! ambil data murid dari backend
    // backend otomatis filter by rayon_id psrayon yang login — tidak perlu kirim rayon_id
    // endpoint: GET /users?page=&limit=
    const fetchMurid = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            //* token tanpa "Bearer " — sesuai checkToken di auth.js
            const res = await fetch(
                `http://localhost:3000/users?page=${pagination.page}&limit=${pagination.limit}`,
                { headers: { Authorization: token } }
            );

            const result = await res.json();

            if (result.status === 200) {
                setMurid(result.data.data);
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

    // search — filter di frontend berdasarkan nama
    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchMurid();
    };

    //! export excel — backend kirim file langsung, bukan json
    // cara download: buat blob dari response, buat link sementara, klik otomatis
    const handleExport = async () => {
        setExportLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch('http://localhost:3000/users/export', {
                headers: { Authorization: token }
            });

            if (!res.ok) throw new Error("Gagal export");

            //* ambil blob (binary data) dari response — bukan json
            const blob = await res.blob();

            //* buat URL sementara dari blob, lalu trigger download otomatis
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'daftar-murid.xlsx';
            document.body.appendChild(a);
            a.click();

            //* cleanup — hapus elemen dan URL sementara setelah download
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert("Gagal mengexport data");
        } finally {
            setExportLoading(false);
        }
    };

    //! hapus murid
    const handleDelete = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:3000/users/${selectedMurid.id}`, {
                method: 'DELETE',
                headers: { Authorization: token }
            });

            if (res.ok) {
                setIsDeleteModalOpen(false);
                setSelectedMurid(null);
                fetchMurid(); //* refresh tabel setelah hapus
            } else {
                alert("Gagal menghapus murid");
            }
        } catch (err) {
            alert("Terjadi kesalahan saat menghapus murid");
        }
    };

    //! create atau update murid
    // rayon_id otomatis diisi backend dari token psrayon — tidak perlu dikirim dari frontend
    const handleFormSubmit = async (formData) => {
        const isEdit = !!selectedMurid;
        const url = isEdit
            ? `http://localhost:3000/users/${selectedMurid.id}`
            : `http://localhost:3000/users`;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsFormModalOpen(false);
                setSelectedMurid(null);
                fetchMurid(); //* refresh tabel setelah save
            } else {
                const errData = await res.json();
                alert(errData.message || "Gagal menyimpan data");
            }
        } catch (err) {
            alert("Terjadi kesalahan saat menyimpan data");
        }
    };

    //* filter data di frontend berdasarkan searchTerm (nama murid)
    const filteredMurid = murid.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar user={currentUser} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <main className="flex-1 md:ml-64 p-4 md:p-8">
                {/* Header Halaman */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manage Murid</h1>
                        <p className="text-gray-500 mt-1">Kelola akun murid di rayon kamu.</p>
                    </div>

                    {/* tombol export + tambah murid */}
                    <div className="flex items-center gap-3 self-start md:self-center">
                        <button
                            onClick={handleExport}
                            disabled={exportLoading}
                            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl font-bold border border-gray-200 shadow-sm transition-all active:scale-95 disabled:opacity-60"
                        >
                            {exportLoading
                                ? <Loader2 size={18} className="animate-spin" />
                                : <Download size={18} />
                            }
                            Export Excel
                        </button>
                        <button
                            onClick={() => { setSelectedMurid(null); setIsFormModalOpen(true); }}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all active:scale-95"
                        >
                            <UserPlus size={20} strokeWidth={2.5} />
                            Tambah Murid
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
                            placeholder="Cari nama murid..."
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
                            <button onClick={fetchMurid} className="mt-6 text-green-600 font-bold hover:underline">Coba Lagi</button>
                        </div>
                    ) : (
                        <>
                            <MuridTable
                                data={filteredMurid}
                                onEdit={(m) => { setSelectedMurid(m); setIsFormModalOpen(true); }}
                                onDelete={(m) => { setSelectedMurid(m); setIsDeleteModalOpen(true); }}
                            />

                            {/* Pagination */}
                            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                                <p className="text-sm text-gray-500">
                                    Menampilkan <span className="font-bold text-gray-900">{filteredMurid.length}</span> dari <span className="font-bold text-gray-900">{pagination.total}</span> data
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
                                        disabled={murid.length < pagination.limit}
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
            <MuridFormModal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setSelectedMurid(null); }}
                onSubmit={handleFormSubmit}
                murid={selectedMurid}
            />

            {/* Modal Konfirmasi Hapus */}
            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setSelectedMurid(null); }}
                onConfirm={handleDelete}
                title="Hapus Akun Murid"
                message={`Apakah kamu yakin ingin menghapus akun ${selectedMurid?.name}? Tindakan ini tidak bisa dibatalkan.`}
            />
        </div>
    );
}
