import { useState, useEffect } from 'react';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    UserPlus,
    Loader2,
    AlertCircle,
    Download
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import UserTable from '../components/UserTable';
import UserFormModal from '../components/UserFormModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

// ─── ManageKokurikuler Page ────────────────────────────────────────────────────
// sama persis kayak ManagePsRayon, bedanya:
// - filter role=kokurikuler di query param
// - force role 'kokurikuler' pas create/update
// - rayon_id null — kokurikuler gak butuh rayon
export default function ManageKokurikuler() {
    // state data dan loading
    const [users, setUsers] = useState([]);
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
    const [selectedUser, setSelectedUser] = useState(null); // null = mode tambah, object = mode edit

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
        fetchUsers();
    }, [pagination.page]);

    //! ambil data kokurikuler dari backend
    // endpoint: GET /manage-users?role=kokurikuler
    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            //* token tanpa "Bearer " — sesuai checkToken di auth.js
            const res = await fetch(
                `http://localhost:3000/manage-users?page=${pagination.page}&limit=${pagination.limit}&role=kokurikuler`,
                { headers: { Authorization: token } }
            );

            const result = await res.json();

            if (result.status === 200) {
                setUsers(result.data.data);
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
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchUsers();
    };

    //! export excel daftar kokurikuler saja — endpoint: GET /manage-users/export?role=kokurikuler
    const handleExport = async () => {
        setExportLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch('http://localhost:3000/manage-users/export?role=kokurikuler', {
                headers: { Authorization: token }
            });
            if (!res.ok) throw new Error("Gagal export");
            // blob: binary large obj
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob); // buat url palsu
            const a = document.createElement('a'); // bkin tag a html dr js
            a.href = url; // masukin url td ke href
            a.download = 'daftar-kokurikuler.xlsx';
            document.body.appendChild(a); // tempel link ke page html
            a.click(); // autoclick
            a.remove(); 
            window.URL.revokeObjectURL(url); // bersihin memori dr url td
        } catch (err) {
            alert("Gagal mengexport data");
        } finally {
            setExportLoading(false);
        }
    };

    //! hapus user kokurikuler
    const handleDelete = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:3000/manage-users/${selectedUser.id}`, {
                method: 'DELETE',
                headers: { Authorization: token }
            });

            if (res.ok) {
                setIsDeleteModalOpen(false);
                fetchUsers(); //* refresh tabel setelah hapus
            } else {
                alert("Gagal menghapus user");
            }
        } catch (err) {
            alert("Terjadi kesalahan saat menghapus user");
        }
    };

    //! create atau update kokurikuler
    // rayon_id di-force null — kokurikuler gak butuh rayon
    const handleFormSubmit = async (formData) => {
        const isEdit = !!selectedUser;
        const url = isEdit
            ? `http://localhost:3000/manage-users/${selectedUser.id}`
            : `http://localhost:3000/manage-users`;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token
                },
                body: JSON.stringify({
                    ...formData,
                    role: 'kokurikuler', //* force role kokurikuler
                    rayon_id: null       //* kokurikuler gak punya rayon
                })
            });

            if (res.ok) {
                setIsFormModalOpen(false);
                fetchUsers();
            } else {
                const errData = await res.json();
                alert(errData.message || "Gagal menyimpan data");
            }
        } catch (err) {
            alert("Terjadi kesalahan saat menyimpan data");
        }
    };

    //* filter data di frontend berdasarkan searchTerm
    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 flex overflow-hidden">
            <Sidebar user={currentUser} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <main className="flex-1 md:ml-64 p-4 md:p-8 animate-fadeIn">
                {/* Header Halaman */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manage Kokurikuler</h1>
                        <p className="text-gray-500 mt-1">Kelola akun Kokurikuler yang terdaftar di sistem.</p>
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
                            onClick={() => { setSelectedUser(null); setIsFormModalOpen(true); }}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all active:scale-95"
                        >
                            <UserPlus size={20} strokeWidth={2.5} />
                            Tambah Kokurikuler
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
                            placeholder="Cari nama Kokurikuler..."
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
                            <button onClick={fetchUsers} className="mt-6 text-green-600 font-bold hover:underline">Coba Lagi</button>
                        </div>
                    ) : (
                        <>
                            <UserTable
                                data={filteredUsers}
                                onEdit={(user) => { setSelectedUser(user); setIsFormModalOpen(true); }}
                                onDelete={(user) => { setSelectedUser(user); setIsDeleteModalOpen(true); }}
                                showRayon={false}
                            />

                            {/* Pagination */}
                            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                                <p className="text-sm text-gray-500">
                                    Menampilkan <span className="font-bold text-gray-900">{filteredUsers.length}</span> dari <span className="font-bold text-gray-900">{pagination.total}</span> data
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
                                        disabled={users.length < pagination.limit}
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

            {/* Modal Form Create/Edit — role='kokurikuler' supaya field rayon disembunyikan */}
            <UserFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleFormSubmit}
                user={selectedUser}
                role="kokurikuler"
            />

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Hapus Akun Kokurikuler"
                message={`Apakah kamu yakin ingin menghapus akun ${selectedUser?.name}? Tindakan ini tidak bisa dibatalkan.`}
            />
        </div>
    );
}
