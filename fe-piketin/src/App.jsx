import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Activity, TrendingUp, Shield, Menu, Users, ClipboardList, Droplets, ArrowRight, CheckCircle } from 'lucide-react';
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
function AdminDashboard({ userStats, wcData, piketData, recentSubmissions }) {
    const statusColor = { Pending: 'bg-orange-100 text-orange-700', Accepted: 'bg-green-100 text-green-700', Declined: 'bg-red-100 text-red-700' };
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

            {/* Recent Activity — submission terbaru semua murid */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-gray-700">Submission Terbaru</h3>
                    <p className="text-xs text-gray-400 mt-0.5">5 absen piket rayon terbaru dari semua murid</p>
                </div>
                <div className="divide-y divide-gray-100">
                    {!recentSubmissions || recentSubmissions.length === 0 ? (
                        <p className="text-gray-400 text-sm py-6 text-center italic">Belum ada submission</p>
                    ) : recentSubmissions.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between px-6 py-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center font-bold text-sm border border-green-100 shrink-0">
                                    {sub.User?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{sub.User?.name}</p>
                                    <p className="text-xs text-gray-400">{sub.tanggal_piket}</p>
                                </div>
                            </div>
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statusColor[sub.status] ?? statusColor.Pending}`}>
                                {sub.status}
                            </span>
                        </div>
                    ))}
                </div>
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
        const startOfYear = new Date(date.getFullYear(), 6, 1);
        return Math.ceil(((date - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    };
    const mingguSekarang = getWeekNumber(new Date());
    const minggukeSiklus = ((mingguSekarang - 1) % 4) + 1; //* siklus 1-4 berulang

    const isHariPiketRayon = hariIni === user?.jadwal_piket;
    const isHariPiketWc = hariIni === user?.hari_wc && minggukeSiklus === user?.minggu_ke;

    //* state status submission hari ini
    const [sudahAbsenRayon, setSudahAbsenRayon] = useState(false);
    const [sudahAbsenWc, setSudahAbsenWc] = useState(false);

    //! cek status submission hari ini untuk update teks card
    useEffect(() => {
        const cekStatus = async () => {
            try {
                const token = localStorage.getItem("token");
                const tanggalHariIni = new Date().toISOString().split('T')[0];

                //* cek submission rayon hari ini
                if (isHariPiketRayon) {
                    const res = await fetch('http://localhost:3000/submissions/my?page=1&limit=5', {
                        headers: { Authorization: token }
                    });
                    const result = await res.json();
                    if (result.status === 200) {
                        const ada = result.data.data.some(s =>
                            s.tanggal_piket === tanggalHariIni && s.status !== 'Declined'
                        );
                        setSudahAbsenRayon(ada);
                    }
                }

                //* cek submission WC minggu ini
                if (isHariPiketWc) {
                    const res = await fetch('http://localhost:3000/piket-wc/my?page=1&limit=5', {
                        headers: { Authorization: token }
                    });
                    const result = await res.json();
                    if (result.status === 200) {
                        const now = new Date();
                        const dayOfWeek = now.getDay();
                        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                        const startOfWeek = new Date(now);
                        startOfWeek.setDate(now.getDate() + diffToMonday);
                        startOfWeek.setHours(0, 0, 0, 0);
                        const endOfWeek = new Date(startOfWeek);
                        endOfWeek.setDate(startOfWeek.getDate() + 6);

                        const ada = result.data.data.some(s => {
                            const tgl = new Date(s.tanggal_piket);
                            return tgl >= startOfWeek && tgl <= endOfWeek && s.status !== 'Declined';
                        });
                        setSudahAbsenWc(ada);
                    }
                }
            } catch (err) {
                console.error("Gagal cek status submission:", err);
            }
        };
        cekStatus();
    }, [isHariPiketRayon, isHariPiketWc]);

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
                        sudahAbsenRayon ? (
                            <div className="flex items-center gap-2 text-green-600 font-bold text-sm relative z-10">
                                <CheckCircle size={16} />
                                <span>Kamu sudah absen piket rayon hari ini</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-green-600 font-bold text-sm relative z-10">
                                <span>Hari ini jadwal piket kamu — Absen sekarang</span>
                                <ArrowRight size={16} />
                            </div>
                        )
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
                                Minggu ke-{user?.minggu_ke} dalam siklus
                            </p>
                        </div>
                        <div className={`p-3 rounded-xl transition-colors ${isHariPiketWc ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                            <Droplets size={24} />
                        </div>
                    </div>

                    {/* kalau hari ini jadwal piket WC, tampilkan tombol quick access */}
                    {isHariPiketWc ? (
                        sudahAbsenWc ? (
                            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm relative z-10">
                                <CheckCircle size={16} />
                                <span>Kamu sudah absen piket WC minggu ini</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm relative z-10">
                                <span>Hari ini jadwal piket WC kamu — Absen sekarang</span>
                                <ArrowRight size={16} />
                            </div>
                        )
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
// ─── KokurikulerDashboard ─────────────────────────────────────────────────────
// dashboard khusus role kokurikuler
// Props:
//   - kkStats: { stats, murid_minggu_bukan_hari_ini, murid_hari_ini } dari API
function KokurikulerDashboard({ kkStats }) {
    const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const hariIni = namaHari[new Date().getDay()];

    //* sub-komponen baris murid di tabel
    const MuridRow = ({ murid }) => (
        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm border border-purple-100">
                    {murid.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900">{murid.name}</p>
                    <p className="text-xs text-gray-400">{murid.nis}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">{murid.hari_wc}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Tugas {murid.tugas_wc}</span>
            </div>
        </div>
    );

    return (
        <>
            {/* 3 Kartu Statistik */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* kartu 1: total semua murid */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <Droplets className="absolute -right-4 -bottom-4 text-gray-900 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity" size={120} />
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">Total Murid</p>
                            <h3 className="text-3xl font-bold text-gray-900">{kkStats?.stats?.total_murid ?? '—'}</h3>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl text-gray-400 group-hover:text-purple-600 transition-colors">
                            <Users size={24} />
                        </div>
                    </div>
                </div>

                {/* kartu 2: murid terjadwal piket WC minggu ini */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <Droplets className="absolute -right-4 -bottom-4 text-gray-900 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity" size={120} />
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">Piket WC Minggu Ini</p>
                            <h3 className="text-3xl font-bold text-gray-900">{kkStats?.stats?.murid_minggu_ini ?? '—'}</h3>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl text-gray-400 group-hover:text-blue-600 transition-colors">
                            <Droplets size={24} />
                        </div>
                    </div>
                </div>

                {/* kartu 3: murid terjadwal piket WC hari ini */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <Droplets className="absolute -right-4 -bottom-4 text-gray-900 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity" size={120} />
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">Piket WC Hari Ini ({hariIni})</p>
                            <h3 className="text-3xl font-bold text-gray-900">{kkStats?.stats?.murid_hari_ini ?? '—'}</h3>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl text-gray-400 group-hover:text-green-600 transition-colors">
                            <ClipboardList size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2 Seksi Daftar Murid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* seksi kiri: murid terjadwal minggu ini tapi bukan hari ini */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-bold text-gray-700">Jadwal Minggu Ini (Bukan Hari Ini)</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Murid yang piket WC minggu ini selain hari {hariIni}</p>
                    </div>
                    <div className="px-6 py-2 max-h-72 overflow-y-auto">
                        {!kkStats ? (
                            <p className="text-gray-400 text-sm py-4 text-center">Memuat...</p>
                        ) : kkStats.murid_minggu_bukan_hari_ini?.length === 0 ? (
                            <p className="text-gray-400 text-sm py-4 text-center italic">Tidak ada murid terjadwal</p>
                        ) : (
                            kkStats.murid_minggu_bukan_hari_ini?.map(m => <MuridRow key={m.id} murid={m} />)
                        )}
                    </div>
                </div>

                {/* seksi kanan: murid terjadwal hari ini dan minggu ini */}
                <div className="bg-white rounded-2xl shadow-sm border border-green-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-green-100 bg-green-50/50">
                        <h3 className="font-bold text-green-700">Jadwal Hari Ini ({hariIni})</h3>
                        <p className="text-xs text-green-500 mt-0.5">Murid yang piket WC hari ini dan minggu ini</p>
                    </div>
                    <div className="px-6 py-2 max-h-72 overflow-y-auto">
                        {!kkStats ? (
                            <p className="text-gray-400 text-sm py-4 text-center">Memuat...</p>
                        ) : kkStats.murid_hari_ini?.length === 0 ? (
                            <p className="text-gray-400 text-sm py-4 text-center italic">Tidak ada murid terjadwal hari ini</p>
                        ) : (
                            kkStats.murid_hari_ini?.map(m => <MuridRow key={m.id} murid={m} />)
                        )}
                    </div>
                </div>
            </div>

            {/* Submission Pending — perlu perhatian kokurikuler */}
            <div className="bg-white rounded-2xl shadow-sm border border-orange-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-orange-100 bg-orange-50/50 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-orange-700">Submission Pending</h3>
                        <p className="text-xs text-orange-500 mt-0.5">Absen piket WC yang menunggu persetujuan kamu</p>
                    </div>
                    {kkStats?.pending_submissions?.length > 0 && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
                            {kkStats.pending_submissions.length} pending
                        </span>
                    )}
                </div>
                <div className="px-6 py-2 max-h-72 overflow-y-auto">
                    {!kkStats ? (
                        <p className="text-gray-400 text-sm py-4 text-center">Memuat...</p>
                    ) : kkStats.pending_submissions?.length === 0 ? (
                        <p className="text-gray-400 text-sm py-4 text-center italic">Tidak ada submission pending</p>
                    ) : (
                        kkStats.pending_submissions?.map(sub => (
                            <div key={sub.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center font-bold text-sm border border-orange-100">
                                        {sub.User?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{sub.User?.name}</p>
                                        <p className="text-xs text-gray-400">{sub.tanggal_piket} · Tugas {sub.tugas}</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-100">Pending</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

// ─── PsRayonDashboard ──────────────────────────────────────────────────────────
// dashboard khusus role psrayon — mirip admin tapi data sesuai rayon psrayon
// Props:
//   - psStats       : { murid, pending } dari API /users/stats
//   - piketData     : pie chart piket hari ini (rayon ini)
//   - piketWeekData : pie chart piket WC minggu ini (rayon ini)
//   - recentSubmissions : 5 submission terbaru dari murid rayon ini
function PsRayonDashboard({ psStats, piketData, piketWeekData, recentSubmissions }) {
    const statusColor = { Pending: 'bg-orange-100 text-orange-700', Accepted: 'bg-green-100 text-green-700', Declined: 'bg-red-100 text-red-700' };
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
                 * Chart kanan: Rekap Piket WC Minggu Ini — murid rayon ini yang terjadwal WC minggu ini
                 * data dari /piket-wc/stats-rayon — filter rayon_id dan siklus minggu
                 */}
                <PieChartCard
                    title="Piket WC Rayon Minggu Ini"
                    icon={Users}
                    data={piketWeekData}
                    innerRadius={0}
                    unit="%"
                />
            </div>

            {/* Submission Terbaru — 5 absen piket rayon terbaru dari murid rayon ini */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-gray-700">Submission Terbaru</h3>
                    <p className="text-xs text-gray-400 mt-0.5">5 absen piket rayon terbaru dari murid rayon kamu</p>
                </div>
                <div className="divide-y divide-gray-100">
                    {!recentSubmissions || recentSubmissions.length === 0 ? (
                        <p className="text-gray-400 text-sm py-6 text-center italic">Belum ada submission</p>
                    ) : recentSubmissions.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between px-6 py-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center font-bold text-sm border border-green-100 shrink-0">
                                    {sub.User?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{sub.User?.name}</p>
                                    <p className="text-xs text-gray-400">{sub.tanggal_piket}</p>
                                </div>
                            </div>
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statusColor[sub.status] ?? statusColor.Pending}`}>
                                {sub.status}
                            </span>
                        </div>
                    ))}
                </div>
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
    const [psRayonPiketWeekData, setPsRayonPiketWeekData] = useState([
        { name: 'Sudah Piket', value: 0, color: '#22c55e' },
        { name: 'Belum Piket', value: 100, color: '#d1d5db' },
    ]);

    //! state dashboard kokurikuler — dipisah supaya tidak campur
    const [kkStats, setKkStats] = useState(null); //* { stats, murid_minggu_bukan_hari_ini, murid_hari_ini }

    //! state recent submissions — untuk admin dan psrayon
    const [adminRecentSubmissions, setAdminRecentSubmissions] = useState([]);
    const [psRayonRecentSubmissions, setPsRayonRecentSubmissions] = useState([]);

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

                //! Promise.all: fetch 3 endpoint paralel sekaligus
                const [statsRes, wcRes, piketWeekRes, recentRes] = await Promise.all([
                    fetch("http://localhost:3000/manage-users/stats", { headers }),
                    fetch("http://localhost:3000/piket-wc/stats", { headers }),
                    fetch("http://localhost:3000/submissions/piket-stats-week", { headers }),
                    fetch("http://localhost:3000/submissions?page=1&limit=5", { headers }),
                ]);

                if (!statsRes.ok) throw new Error(`user stats HTTP ${statsRes.status}`);
                if (!wcRes.ok) throw new Error(`wc stats HTTP ${wcRes.status}`);
                if (!piketWeekRes.ok) throw new Error(`piket week stats HTTP ${piketWeekRes.status}`);

                const statsJson = await statsRes.json();
                const wcJson = await wcRes.json();
                const piketWeekJson = await piketWeekRes.json();
                const recentJson = recentRes.ok ? await recentRes.json() : null;

                //* update kartu statistik user
                setUserStats(statsJson.data);

                //* update pie chart WC dengan data real dari backend
                setWcData([
                    { name: 'Pending', value: wcJson.data.pending, color: '#f97316' },
                    { name: 'Accepted', value: wcJson.data.accepted, color: '#22c55e' },
                    { name: 'Declined', value: wcJson.data.declined, color: '#ef4444' },
                ]);

                //* update pie chart piket rayon minggu ini — semua murid
                const totalWeek = piketWeekJson.data.total || 1;
                const pctSudahWeek = Math.round((piketWeekJson.data.sudah_piket / totalWeek) * 100);
                setPiketData([
                    { name: 'Sudah Piket', value: pctSudahWeek, color: '#22c55e' },
                    { name: 'Belum Piket', value: 100 - pctSudahWeek, color: '#d1d5db' },
                ]);

                //* update recent submissions admin
                if (recentJson?.status === 200) setAdminRecentSubmissions(recentJson.data.data);
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

                //! Promise.all: fetch stats, piket-stats (hari ini), dan stats-rayon WC (mingguan) paralel
                const [statsRes, piketRes, wcRayonRes] = await Promise.all([
                    fetch("http://localhost:3000/users/stats", { headers }),
                    fetch("http://localhost:3000/users/piket-stats", { headers }),
                    fetch("http://localhost:3000/piket-wc/stats-rayon", { headers }),
                ]);

                if (!statsRes.ok) throw new Error(`ps stats HTTP ${statsRes.status}`);
                if (!piketRes.ok) throw new Error(`piket stats HTTP ${piketRes.status}`);
                if (!wcRayonRes.ok) throw new Error(`wc rayon stats HTTP ${wcRayonRes.status}`);

                const statsJson = await statsRes.json();
                const piketJson = await piketRes.json();
                const wcRayonJson = await wcRayonRes.json();

                //* update 2 kartu statistik psrayon
                setPsStats(statsJson.data);

                //* chart kiri: piket rayon hari ini (rayon ini)
                const total = piketJson.data.total || 1;
                const pctSudah = Math.round((piketJson.data.sudah_piket / total) * 100);

                //* chart kanan: piket WC minggu ini — murid terjadwal di rayon ini
                const totalWc = wcRayonJson.data.total || 1;
                const pctSudahWc = Math.round((wcRayonJson.data.sudah_wc / totalWc) * 100);

                setPsRayonPiketData([
                    { name: 'Sudah Piket', value: pctSudah, color: '#22c55e' },
                    { name: 'Belum Piket', value: 100 - pctSudah, color: '#d1d5db' },
                ]);
                setPsRayonPiketWeekData([
                    { name: 'Sudah WC', value: pctSudahWc, color: '#3b82f6' },
                    { name: 'Belum WC', value: 100 - pctSudahWc, color: '#d1d5db' },
                ]);
                //* update recent submissions psrayon — 5 terbaru dari rayon ini
                const recentRes = await fetch("http://localhost:3000/submissions?page=1&limit=5", { headers });
                const recentJson = recentRes.ok ? await recentRes.json() : null;
                if (recentJson?.status === 200) setPsRayonRecentSubmissions(recentJson.data.data);
            } catch (err) {
                console.error("Gagal fetch psrayon dashboard data:", err);
            }
        };

        fetchPsRayonData();
    }, [user]); //* dependency: user — jalan setelah user terisi

    //! useEffect #4 — fetch data dashboard kokurikuler
    // hanya jalan kalau user sudah ada dan role kokurikuler
    useEffect(() => {
        if (!user || user.role !== 'kokurikuler') return;

        const fetchKkData = async () => {
            try {
                const token = localStorage.getItem("token");
                const headers = { Authorization: token };

                const res = await fetch("http://localhost:3000/piket-wc/dashboard-stats", { headers });
                if (!res.ok) throw new Error(`kk dashboard HTTP ${res.status}`);

                const json = await res.json();
                //* set semua data sekaligus — stats + dua daftar murid
                setKkStats(json.data);
            } catch (err) {
                console.error("Gagal fetch kokurikuler dashboard data:", err);
            }
        };

        fetchKkData();
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
                        recentSubmissions={adminRecentSubmissions}
                    />
                );
            case 'psrayon':
                return (
                    <PsRayonDashboard
                        psStats={psStats}
                        piketData={psRayonPiketData}
                        piketWeekData={psRayonPiketWeekData}
                        recentSubmissions={psRayonRecentSubmissions}
                    />
                );
            case 'murid':
                //* pass navigate supaya MuridDashboard bisa redirect ke halaman absen
                return <MuridDashboard user={user} onNavigate={navigate} />;
            case 'kokurikuler':
                return <KokurikulerDashboard kkStats={kkStats} />;
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
                            {' · Minggu ke-'}
                            {(() => {
                                const now = new Date();
                                const startOfYear = new Date(now.getFullYear(), 0, 1);
                                const weekNum = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
                                return ((weekNum - 1) % 4) + 1;
                            })()}
                        </span>
                    </div>
                </div>

                {/* Dashboard Content */}
                {renderDashboard()}
            </main>
        </div>
    );
}
