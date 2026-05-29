import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Activity, TrendingUp, Shield, Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import UserStatsCards from './components/UserStatsCards';
import PieChartCard from './components/PieChartCard';

// ─── Dashboard per Role ────────────────────────────────────────────────────────

/**
 * AdminDashboard — konten dashboard khusus role administrator.
 * 
 * Props:
 *   - user      : objek user dari localStorage
 *   - userStats : { psrayon, kokurikuler, murid } dari API
 *   - wcData    : array for pie chart status piket WC (dari API)
 *   - piketData : array for pie chart status piket rayon (persentase, static dulu)
 * 
 * Asal: dipecah dari renderDashboard() di App.jsx lama.
 * Gunanya: isolasi konten admin supaya App.jsx tidak penuh logika UI.
 */
function AdminDashboard({ userStats, wcData, piketData }) {
    return (
        <>
            {/* 3 Kartu Statistik User */}
            <UserStatsCards userStats={userStats} />

            {/* 2 Pie Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/*
                 * Chart kiri: Status Piket WC — data dari API /piket-wc/stats
                 * unit="" karena ini jumlah submission, bukan persentase
                 */}
                <PieChartCard
                    title="Status Piket WC"
                    icon={Activity}
                    data={wcData}
                    innerRadius={55}
                    unit=""
                />
                {/*
                 * Chart kanan: Status Piket Rayon — data masih static (persentase)
                 * unit="%" supaya tooltip tampilkan "75%" bukan "75"
                 */}
                <PieChartCard
                    title="Status Piket Rayon Minggu Ini"
                    icon={TrendingUp}
                    data={piketData}
                    innerRadius={0}
                    unit="%"
                />
            </div>

            {/* Recent Activity — TODO: dibangun setelah semua role selesai */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 border-dashed">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-400">Recent Activity</h3>
                    <span className="text-xs text-gray-300 font-medium">— coming soon</span>
                </div>
                <p className="text-gray-300 text-sm">-</p>
            </div>
        </>
    );
}

/**
 * PlaceholderDashboard — konten sementara untuk role selain administrator.
 * 
 * Props:
 *   - role: string role user (misal 'psrayon', 'kokurikuler', 'murid')
 * 
 * Gunanya: mencegah role lain melihat data admin, sambil menunggu
 *          dashboard masing-masing role dibangun.
 */
function PlaceholderDashboard({ role }) {
    const info = {
        psrayon: {
            label: 'PS Rayon',
            desc: 'Kelola data murid di rayon kamu dan lihat jadwal piket.',
            color: 'bg-blue-50 border-blue-200 text-blue-700',
        },
        kokurikuler: {
            label: 'Kokurikuler',
            desc: 'Review dan setujui pengajuan absen piket WC.',
            color: 'bg-purple-50 border-purple-200 text-purple-700',
        },
        murid: {
            label: 'Murid',
            desc: 'Ajukan absen piket harian atau piket WC kamu di sini.',
            color: 'bg-orange-50 border-orange-200 text-orange-700',
        },
    };

    const current = info[role] ?? { label: role, desc: 'Dashboard sedang dalam pengembangan.', color: 'bg-gray-50 border-gray-200 text-gray-700' };

    return (
        <div className={`rounded-2xl border-2 border-dashed p-12 text-center ${current.color}`}>
            <h2 className="text-2xl font-bold mb-2">Dashboard {current.label}</h2>
            <p className="text-sm opacity-80">{current.desc}</p>
            <p className="text-xs mt-4 opacity-60">Fitur ini sedang dalam pengembangan.</p>
        </div>
    );
}

// ─── App (Root Component) ──────────────────────────────────────────────────────

export default function App() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    //! data dari API — null berarti belum ada / fetch belum selesai
    const [userStats, setUserStats] = useState(null);

    /**
     * wcData — state untuk pie chart status piket WC.
     * 
     * Dipisah dari userStats karena ini data dari endpoint berbeda (/piket-wc/stats).
     * Format: [{ name, value, color }] sesuai kebutuhan recharts.
     * Nilai awal 0 supaya chart tidak crash sebelum data datang.
     */
    const [wcData, setWcData] = useState([
        { name: 'Pending', value: 0, color: '#f97316' },
        { name: 'Accepted', value: 0, color: '#22c55e' },
        { name: 'Declined', value: 0, color: '#ef4444' },
    ]);

    //* piketData masih static (persentase) — belum ada endpoint untuk ini
    // unit="%" di PieChartCard supaya tooltip tampilkan "75%" bukan "75"
    const piketData = [
        { name: 'Selesai', value: 75, color: '#22c55e' },
        { name: 'Belum', value: 25, color: '#d1d5db' },
    ];

    /**
     * useEffect #1 — Proteksi Route & Auth Check.
     * 
     * Flow:
     *   1. Cek token dan userData di localStorage
     *   2. Kalau tidak ada → redirect ke /login (proteksi route)
     *   3. Kalau ada tapi gagal parse → hapus data rusak, redirect ke /login
     *   4. Kalau valid → set user ke state, lanjut render dashboard
     * 
     * Kenapa di useEffect, bukan langsung di render?
     *   Karena localStorage hanya bisa diakses di browser (client-side),
     *   bukan saat server-side rendering. useEffect jalan setelah komponen mount.
     */
    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("userData");

        //! tidak ada token atau userData → belum login → paksa ke /login
        if (!token || !storedUser) {
            navigate("/login");
            return;
        }

        try {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
        } catch (e) {
            //* data di localStorage rusak → bersihkan dan redirect
            console.error("Gagal parse userData:", e);
            localStorage.removeItem("token");
            localStorage.removeItem("userData");
            navigate("/login");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    /**
     * useEffect #2 — Fetch semua data dashboard admin secara paralel.
     * 
     * Hanya jalan kalau:
     *   1. user sudah ada (auth selesai dicek)
     *   2. role adalah 'administrator'
     * 
     * Flow:
     *   1. Ambil token dari localStorage
     *   2. Fetch paralel: /manage-users/stats dan /piket-wc/stats
     *   3. Update state masing-masing setelah data datang
     *   4. Kalau gagal → log error, state tetap nilai awal
     * 
     * Kenapa dipisah dari useEffect #1?
     *   useEffect #1 set state `user`. State update di React tidak langsung —
     *   kalau digabung, `user` masih null saat fetch jalan.
     *   Dengan dependency [user], useEffect #2 baru jalan setelah user terisi.
     */
    useEffect(() => {
        if (!user || user.role !== 'administrator') return;

        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem("token");

                //! headers yang sama dipakai untuk semua fetch
                // Backend baca req.header("Authorization") secara mentah (tanpa strip "Bearer ")
                // Jadi token dikirim langsung tanpa prefix — sesuai cara checkToken di auth.js
                const headers = { Authorization: token };

                //! Promise.all: fetch 2 endpoint paralel sekaligus, lebih efisien dari serial
                const [statsRes, wcRes] = await Promise.all([
                    fetch("http://localhost:3000/manage-users/stats", { headers }),
                    fetch("http://localhost:3000/piket-wc/stats", { headers }),
                ]);

                if (!statsRes.ok) throw new Error(`user stats HTTP ${statsRes.status}`);
                if (!wcRes.ok) throw new Error(`wc stats HTTP ${wcRes.status}`);

                const statsJson = await statsRes.json();
                const wcJson = await wcRes.json();

                //* update kartu statistik user
                setUserStats(statsJson.data);

                //* update pie chart WC dengan data real dari backend
                setWcData([
                    { name: 'Pending', value: wcJson.data.pending, color: '#f97316' },
                    { name: 'Accepted', value: wcJson.data.accepted, color: '#22c55e' },
                    { name: 'Declined', value: wcJson.data.declined, color: '#ef4444' },
                ]);
            } catch (err) {
                console.error("Gagal fetch dashboard data:", err);
            }
        };

        fetchDashboardData();
    }, [user]); //* dependency: user — jalankan ulang kalau user berubah

    //* tampilkan spinner selama auth check berjalan
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
    );

    /**
     * renderDashboard — pilih konten dashboard berdasarkan role user.
     * 
     * Ini bukan middleware — ini hanya conditional render di sisi React.
     * Proteksi sesungguhnya ada di useEffect #1 (redirect kalau tidak login)
     * dan di backend (checkRole di setiap endpoint).
     */
    const renderDashboard = () => {
        switch (user?.role) {
            case 'administrator':
                return (
                    <AdminDashboard
                        userStats={userStats}
                        wcData={wcData}
                        piketData={piketData}
                    />
                );
            default:
                //* psrayon, kokurikuler, murid → placeholder dulu
                return <PlaceholderDashboard role={user?.role} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar user={user} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <main className="flex-1 md:ml-64 p-4 md:p-8">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="bg-green-600 p-1.5 rounded-lg text-white">
                            <Shield size={20} />
                        </div>
                        <span className="font-bold text-xl text-gray-900 tracking-tight">Piketin</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 bg-white rounded-lg border border-gray-200"
                    >
                        <Menu size={24} />
                    </button>
                </div>

                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight capitalize">
                            {user?.role} Overview
                        </h1>
                        <p className="text-gray-600 mt-1">Halo {user?.name}, selamat datang kembali!</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm self-start">
                        <Calendar size={18} className="text-green-600" />
                        <span className="text-sm font-semibold text-gray-700">
                            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                </div>

                {/* Dashboard Content */}
                {renderDashboard()}
            </main>
        </div>
    );
}
