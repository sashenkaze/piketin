import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Shield,
    GraduationCap,
    Calendar,
    Activity,
    TrendingUp,
    Menu,
    X
} from 'lucide-react';
import {
    PieChart,
    Pie,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';
import Sidebar from './components/Sidebar';

/**
 * StatCard Component
 * Komponen reusable untuk menampilkan metrik utama dengan indikator tren.
 */
const StatCard = ({ title, value, icon: Icon, trend }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl text-gray-400 group-hover:text-green-600 transition-colors">
                <Icon size={24} />
            </div>
        </div>
        {trend && (
            <div className="flex items-center gap-1.5">
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {trend}
                </span>
                <span className="text-gray-400 text-xs">vs last month</span>
            </div>
        )}
        {/* Ikon Latar Belakang Dekoratif */}
        <Icon className="absolute -right-4 -bottom-4 text-gray-900 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity" size={120} />
    </div>
);

export default function App() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    /**
     * userStats — state untuk menyimpan jumlah user per role dari backend.
     * 
     * Nilai awal null dipakai sebagai penanda "belum ada data".
     * Setelah fetch berhasil, isinya: { psrayon: number, kokurikuler: number, murid: number }
     * Kalau fetch gagal, tetap null dan StatCard akan tampilkan "—" sebagai fallback.
     */
    const [userStats, setUserStats] = useState(null);

    // Data chart distribusi role — diisi ulang setelah userStats tersedia (lihat useEffect kedua)
    // Nilai awal pakai 0 supaya chart tidak crash sebelum data datang
    const [roleData, setRoleData] = useState([
        { name: 'PS Rayon', value: 0, color: '#2563eb' },
        { name: 'Kokurikuler', value: 0, color: '#9333ea' },
        { name: 'Murid', value: 0, color: '#f97316' },
    ]);

    const statusData = [
        { name: 'Selesai', value: 75, color: '#22c55e' },
        { name: 'Belum', value: 25, color: '#d1d5db' },
    ];

    const activities = [
        { id: 1, text: "Penambahan 12 murid baru di Rayon Cisarua 3", time: "10 menit yang lalu", icon: GraduationCap, color: "text-blue-600" },
        { id: 2, text: "Update jadwal piket kokurikuler minggu ke-4", time: "1 jam yang lalu", icon: Calendar, color: "text-green-600" },
        { id: 3, text: "Laporan absensi PS Rayon telah dieksport", time: "3 jam yang lalu", icon: Activity, color: "text-purple-600" },
        { id: 4, text: "Perubahan hak akses akun kokurikuler - Ahmad", time: "Kemarin", icon: Shield, color: "text-orange-600" },
    ];

    // useEffect #1 — cek auth dari localStorage, sama seperti sebelumnya
    useEffect(() => {
        const storedUser = localStorage.getItem("userData");
        const token = localStorage.getItem("token");

        if (storedUser && token) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Gagal parse userData:", e);
                navigate("/login");
            }
        } else {
            setUser({ name: "Administrator", email: "admin@piketin.com", role: "administrator" });
        }
        setLoading(false);
    }, [navigate]);

    /**
     * useEffect #2 — fetch jumlah user per role dari backend.
     * 
     * Hanya dijalankan kalau:
     *   1. `user` sudah terisi (tidak null) — artinya auth sudah selesai dicek
     *   2. Role user adalah 'administrator' — endpoint /manage-users/stats hanya bisa diakses admin
     * 
     * Flow:
     *   1. Ambil token dari localStorage
     *   2. Fetch ke GET /manage-users/stats dengan header Authorization: Bearer <token>
     *   3. Kalau berhasil (status 200), simpan data ke state `userStats`
     *   4. Update `roleData` untuk chart pie supaya ikut angka real
     *   5. Kalau gagal, log error — StatCard tetap tampil dengan nilai "—"
     * 
     * Kenapa dipisah dari useEffect #1?
     *   Karena fetch ini butuh `user` sudah ada dulu (untuk cek role).
     *   Kalau digabung, `user` masih null saat fetch pertama kali jalan.
     */
    useEffect(() => {
        if (!user || user.role !== 'administrator') return;

        const fetchUserStats = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:3000/manage-users/stats", {
                    headers: {
                        // Authorization: Bearer <token> — format standar JWT
                        // Token ini dikirim ke backend, lalu dicek oleh middleware checkToken
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

                const json = await res.json();
                // json.data berisi { psrayon, kokurikuler, murid } sesuai format response.formatter backend
                setUserStats(json.data);

                // Sinkronkan roleData chart dengan angka real dari backend
                setRoleData([
                    { name: 'PS Rayon', value: json.data.psrayon, color: '#2563eb' },
                    { name: 'Kokurikuler', value: json.data.kokurikuler, color: '#9333ea' },
                    { name: 'Murid', value: json.data.murid, color: '#f97316' },
                ]);
            } catch (err) {
                console.error("Gagal fetch user stats:", err);
                // Biarkan userStats tetap null — StatCard akan tampilkan "—"
            }
        };

        fetchUserStats();
    }, [user]); // dependency: user — jalankan ulang kalau user berubah

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Komponen Sidebar */}
            <Sidebar user={user} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            {/* Area Konten Utama */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 animate-fadeIn">
                {/* Mobile Header Toggle */}
                <div className="md:hidden flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="bg-green-600 p-1.5 rounded-lg text-white">
                            <Shield size={20} />
                        </div>
                        <span className="font-bold text-xl text-gray-900 tracking-tight">Piketin</span>
                    </div>
                    <button onClick={() => setSidebarOpen(true)} className="p-2 bg-white rounded-lg border border-gray-200">
                        <Menu size={24} />
                    </button>
                </div>

                {/* Header Halaman */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Administrator Overview</h1>
                        <p className="text-gray-600 mt-1">Halo {user?.name}, selamat datang kembali!</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm self-start">
                        <Calendar size={18} className="text-green-600" />
                        <span className="text-sm font-semibold text-gray-700">
                            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                </div>

                {/* Grid Kartu Statistik */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard title="Total PS Rayon" value="48" icon={Users} trend="+12%" />
                    <StatCard title="Total Kokurikuler" value="36" icon={Shield} trend="+5%" />
                    <StatCard title="Total Murid" value="1,432" icon={GraduationCap} trend="+8%" />
                </div>

                {/* Bagian Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Chart Distribusi Role */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-gray-900">Distribusi User by Role</h3>
                            <Activity size={18} className="text-gray-400" />
                        </div>
                        <div className="h-75 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={roleData}
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {roleData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Chart Status Piket */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-gray-900">Status Piket Minggu Ini</h3>
                            <TrendingUp size={18} className="text-gray-400" />
                        </div>
                        <div className="h-75 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Bagian Aktivitas Terbaru */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-900">Recent Activity</h3>
                        <button className="text-green-600 text-sm font-bold hover:underline">Lihat Semua</button>
                    </div>
                    <div className="space-y-6">
                        {activities.map((item) => (
                            <div key={item.id} className="flex gap-4">
                                <div className={`p-2 rounded-lg bg-gray-50 ${item.color}`}>
                                    <item.icon size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-800 text-sm font-medium">{item.text}</p>
                                    <p className="text-gray-400 text-xs mt-0.5">{item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
