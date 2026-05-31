import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Activity, TrendingUp, Shield, Menu, Users, ClipboardList, Droplets, ArrowRight } from 'lucide-react';
import Sidebar from './components/Sidebar';
import UserStatsCards from './components/UserStatsCards';
import PsRayonStatsCards from './components/PsRayonStatsCards';
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
        kokurikuler: {
            label: 'Kokurikuler',
            desc: 'Review dan setujui pengajuan absen piket WC.',
            color: 'bg-purple-50 border-purple-200 text-purple-700',
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

// ─── MuridDashboard ───────────────────────────────────────────────────────────
// dashboard khusus role murid
// Props:
//   - user: objek user dari localStorage (punya jadwal_piket, hari_wc, minggu_ke)
// Logic:
//   - cek apakah hari ini = jadwal_piket → tampilkan tombol quick access ke /absen-rayon
//   - cek apakah hari ini = hari_wc → tampilkan tombol quick access ke /absen-wc
//   - kalau bukan hari ini, tampilkan info jadwal saja tanpa tombol
function MuridDashboard({ user, onNavigate }) {
    const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const hariIni = namaHari[new Date().getDay()];

    //! hitung minggu ke berapa sekarang dalam siklus 4 minggu
    // sama persis dengan logika di piket-wc.controller.js
    const getWeekNumber = (date) => {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        return Math.ceil(((date - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    };
    const mingguSekarang = getWeekNumber(new Date());
    const minggukeSiklus = ((mingguSekarang - 1) % 4) + 1; //* siklus 1-4 berulang

    const isHariPiketRayon = hariIni === user?.jadwal_piket;
    const isHariPiketWc = hariIni === user?.hari_wc && minggukeSiklus === user?.minggu_ke;

    return (
        <>
            {/* 2 Kartu Jadwal — piket rayon & piket WC */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* ── Card Piket Rayon ── */}
                <div
                    onClick={() => isHariPiketRayon && onNavigate('/absen-rayon')}
                    className={`bg-white rounded-2xl p-6 shadow-sm border transition-all relative overflow-hidden group
                        ${isHariPiketRayon
                            ? 'border-green-200 hover:shadow-md hover:-translate-y-1 cursor-pointer'
                            : 'border-gray-200 cursor-default'
                        }`}
                >
                    {/* ikon dekoratif latar belakang */}
                    <ClipboardList className="absolute -right-4 -bottom-4 text-gray-900 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity" size={120} />

                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">Jadwal Piket Rayon</p>
                            <h3 className="text-3xl font-bold text-gray-900">{user?.jadwal_piket || '—'}</h3>
                        </div>
                        <div className={`p-3 rounded-xl transition-colors ${isHariPiketRayon ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                            <ClipboardList size={24} />
                        </div>
                    </div>

                    {/* kalau hari ini jadwal piket, tampilkan tombol quick access */}
                    {isHariPiketRayon ? (
                        <div className="flex items-center gap-2 text-green-600 font-bold text-sm relative z-10">
                            <span>Hari ini jadwal piket kamu — Absen sekarang</span>
                            <ArrowRight size={16} />
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm relative z-10">Bukan hari piket rayon kamu hari ini</p>
                    )}
                </div>

                {/* ── Card Piket WC ── */}
                <div
                    onClick={() => isHariPiketWc && onNavigate('/absen-wc')}
                    className={`bg-white rounded-2xl p-6 shadow-sm border transition-all relative overflow-hidden group
                        ${isHariPiketWc
                            ? 'border-blue-200 hover:shadow-md hover:-translate-y-1 cursor-pointer'
                            : 'border-gray-200 cursor-default'
                        }`}
                >
                    {/* ikon dekoratif latar belakang */}
                    <Droplets className="absolute -right-4 -bottom-4 text-gray-900 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity" size={120} />

                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">Jadwal Piket WC</p>
                            <h3 className="text-3xl font-bold text-gray-900">{user?.hari_wc || '—'}</h3>
                            {/* info minggu ke berapa */}
                            <p className="text-xs text-gray-400 mt-1">
                                Minggu ke-{user?.minggu_ke} dalam siklus &nbsp;·&nbsp; Sekarang minggu ke-{minggukeSiklus}
                            </p>
                        </div>
                        <div className={`p-3 rounded-xl transition-colors ${isHariPiketWc ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                            <Droplets size={24} />
                        </div>
                    </div>

                    {/* kalau hari ini jadwal piket WC, tampilkan tombol quick access */}
                    {isHariPiketWc ? (
                        <div className="flex items-center gap-2 text-blue-600 font-bold text-sm relative z-10">
                            <span>Hari ini jadwal piket WC kamu — Absen sekarang</span>
                            <ArrowRight size={16} />
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm relative z-10">Bukan hari piket WC kamu hari ini</p>
                    )}
                </div>
            </div>

            {/* Info tambahan — coming soon */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 border-dashed">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-400">Riwayat Absen</h3>
                    <span className="text-xs text-gray-300 font-medium">— coming soon</span>
                </div>
                <p className="text-gray-300 text-sm">-</p>
            </div>
        </>
    );
}
// dashboard khusus role psrayon — mirip admin tapi data sesuai rayon psrayon
// Props:
//   - psStats   : { murid, pending } dari API /users/stats
//   - piketData : [{ name, value, color }] untuk pie chart piket hari ini
function PsRayonDashboard({ psStats, piketData }) {
    return (
        <>
            {/* 2 Kartu Statistik */}
            <PsRayonStatsCards stats={psStats} />

            {/* 2 Pie Chart — sama persis posisi dan style kayak admin */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/*
                 * Chart kiri: Status Piket Hari Ini — murid rayon ini yang sudah/belum piket
                 * unit="%" karena ini persentase kehadiran
                 */}
                <PieChartCard
                    title="Status Piket Hari Ini"
                    icon={TrendingUp}
                    data={piketData}
                    innerRadius={55}
                    unit="%"
                />
                {/*
                 * Chart kanan: Distribusi Piket — placeholder dulu
                 * TODO: bisa diisi data mingguan nanti
                 */}
                <PieChartCard
                    title="Rekap Piket Minggu Ini"
                    icon={Users}
                    data={piketData}
                    innerRadius={0}
                    unit="%"
                />
            </div>

            {/* Recent Submission — TODO: dibangun setelah halaman submission selesai */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 border-dashed">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-400">Submission Terbaru</h3>
                    <span className="text-xs text-gray-300 font-medium">— coming soon</span>
                </div>
                <p className="text-gray-300 text-sm">-</p>
            </div>
        </>
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

    //* piketData — pie chart piket rayon hari ini, semua murid
    // nilai awal 0 supaya chart tidak crash sebelum data datang
    const [piketData, setPiketData] = useState([
        { name: 'Sudah Piket', value: 0, color: '#22c55e' },
        { name: 'Belum Piket', value: 0, color: '#d1d5db' },
    ]);

    //! state dashboard psrayon — dipisah dari admin supaya tidak campur
    const [psStats, setPsStats] = useState(null); //* { murid, pending }
    const [psRayonPiketData, setPsRayonPiketData] = useState([
        { name: 'Sudah Piket', value: 0, color: '#22c55e' },
        { name: 'Belum Piket', value: 100, color: '#d1d5db' },
    ]);

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

    //! useEffect #3 — fetch data dashboard psrayon
    // hanya jalan kalau user sudah ada dan role psrayon
    useEffect(() => {
        if (!user || user.role !== 'psrayon') return;

        const fetchPsRayonData = async () => {
            try {
                const token = localStorage.getItem("token");
                const headers = { Authorization: token };

                //! Promise.all: fetch stats dan piket-stats paralel
                const [statsRes, piketRes] = await Promise.all([
                    fetch("http://localhost:3000/users/stats", { headers }),
                    fetch("http://localhost:3000/users/piket-stats", { headers }),
                ]);

                if (!statsRes.ok) throw new Error(`ps stats HTTP ${statsRes.status}`);
                if (!piketRes.ok) throw new Error(`piket stats HTTP ${piketRes.status}`);

                const statsJson = await statsRes.json();
                const piketJson = await piketRes.json();

                //* update 2 kartu statistik psrayon
                setPsStats(statsJson.data);

                //* hitung persentase untuk pie chart
                // kalau total 0 (belum ada murid), tampilkan 0% supaya chart tidak crash
                const total = piketJson.data.total || 1;
                const pctSudah = Math.round((piketJson.data.sudah_piket / total) * 100);
                const pctBelum = 100 - pctSudah;

                setPsRayonPiketData([
                    { name: 'Sudah Piket', value: pctSudah, color: '#22c55e' },
                    { name: 'Belum Piket', value: pctBelum, color: '#d1d5db' },
                ]);
            } catch (err) {
                console.error("Gagal fetch psrayon dashboard data:", err);
            }
        };

        fetchPsRayonData();
    }, [user]); //* dependency: user — jalan setelah user terisi

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
            case 'psrayon':
                return (
                    <PsRayonDashboard
                        psStats={psStats}
                        piketData={psRayonPiketData}
                    />
                );
            case 'murid':
                //* pass navigate supaya MuridDashboard bisa redirect ke halaman absen
                return <MuridDashboard user={user} onNavigate={navigate} />;
            default:
                //* kokurikuler → placeholder dulu
                return <PlaceholderDashboard role={user?.role} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex overflow-hidden">
            <Sidebar user={user} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <main className="flex-1 md:ml-64 p-4 md:p-8 animate-fadeIn">
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
