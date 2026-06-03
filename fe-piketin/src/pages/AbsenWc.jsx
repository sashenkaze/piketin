import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Droplets,
    Loader2,
    AlertCircle,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

// ─── StatusCardWc ──────────────────────────────────────────────────────────────
// tampilkan status submission WC yang sudah ada minggu ini
function StatusCardWc({ submission, onAbsenUlang }) {
    const statusMap = {
        Pending: {
            border: 'border-orange-200',
            bg: 'bg-orange-50',
            icon: <Clock size={32} className="text-orange-500" />,
            title: 'Absen WC Sudah Dikirim — Menunggu Persetujuan',
            desc: 'Absen piket WC kamu sedang menunggu persetujuan Kokurikuler.',
            badge: 'bg-orange-100 text-orange-700',
        },
        Accepted: {
            border: 'border-green-200',
            bg: 'bg-green-50',
            icon: <CheckCircle size={32} className="text-green-600" />,
            title: 'Absen WC Diterima!',
            desc: 'Kokurikuler sudah menyetujui absen piket WC kamu minggu ini.',
            badge: 'bg-green-100 text-green-700',
        },
        Declined: {
            border: 'border-red-200',
            bg: 'bg-red-50',
            icon: <XCircle size={32} className="text-red-500" />,
            title: 'Absen WC Ditolak',
            desc: 'Kokurikuler menolak absen piket WC kamu. Kamu bisa absen ulang.',
            badge: 'bg-red-100 text-red-700',
        },
    };

    const s = statusMap[submission.status] ?? statusMap.Pending;

    return (
        <div className={`bg-white rounded-2xl p-8 shadow-sm border ${s.border} text-center`}>
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${s.bg} mb-4`}>
                {s.icon}
            </div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${s.badge}`}>
                {submission.status}
            </span>
            <h2 className="text-xl font-bold text-gray-700 mb-2">{s.title}</h2>
            <p className="text-gray-500 text-sm mb-4">{s.desc}</p>
            <p className="text-xs text-gray-400 mb-6">Tanggal submit: {submission.tanggal_piket}</p>

            {/* kalau Declined, tampilkan alasan */}
            {submission.status === 'Declined' && submission.alasan_decline && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left mb-6">
                    <p className="text-xs font-bold text-red-600 mb-1">Alasan Penolakan:</p>
                    <p className="text-sm text-red-700">{submission.alasan_decline}</p>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                    onClick={() => window.history.back()}
                    className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
                >
                    Kembali
                </button>
                {/* tombol absen ulang hanya muncul kalau Declined */}
                {submission.status === 'Declined' && (
                    <button
                        onClick={onAbsenUlang}
                        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-colors"
                    >
                        <RefreshCw size={16} />
                        Absen Ulang
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── AbsenWc ───────────────────────────────────────────────────────────────────
export default function AbsenWc() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // state cek submission minggu ini
    const [checkLoading, setCheckLoading] = useState(true);
    const [existingSubmission, setExistingSubmission] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [kondisi, setKondisi] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const hariIni = namaHari[new Date().getDay()];

    //! hitung minggu ke berapa sekarang dalam siklus 4 minggu
    const getWeekNumber = (date) => {
        const startOfYear = new Date(date.getFullYear(), 6, 1);
        return Math.ceil(((date - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    };
    const mingguSekarang = getWeekNumber(new Date());
    const minggukeSiklus = ((mingguSekarang - 1) % 4) + 1;

    const isHariWc = currentUser?.hari_wc === hariIni;
    const isMingguWc = currentUser?.minggu_ke === minggukeSiklus;
    const isJadwalHariIni = isHariWc && isMingguWc;

    //* ambil userData dari localStorage
    useEffect(() => {
        const storedUser = localStorage.getItem("userData");
        if (storedUser) setCurrentUser(JSON.parse(storedUser));
    }, []);

    //! cek apakah sudah ada submission WC minggu ini
    // endpoint: GET /piket-wc/my?page=1&limit=5 — ambil submission terbaru lalu filter minggu ini
    useEffect(() => {
        const checkSubmission = async () => {
            setCheckLoading(true);
            try {
                const token = localStorage.getItem("token");
                const res = await fetch('http://localhost:3000/piket-wc/my?page=1&limit=5', {
                    headers: { Authorization: token }
                });
                const result = await res.json();
                if (result.status === 200) {
                    //* hitung range minggu ini
                    const now = new Date();
                    const dayOfWeek = now.getDay();
                    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                    const startOfWeek = new Date(now);
                    startOfWeek.setDate(now.getDate() + diffToMonday);
                    startOfWeek.setHours(0, 0, 0, 0);
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);

                    //* cari submission minggu ini yang bukan Declined
                    const mingguIniSub = result.data.data.find(s => {
                        const tgl = new Date(s.tanggal_piket);
                        return tgl >= startOfWeek && tgl <= endOfWeek && s.status !== 'Declined';
                    });
                    //* kalau ada yang Declined minggu ini, tampilkan juga
                    const declinedMingguIni = result.data.data.find(s => {
                        const tgl = new Date(s.tanggal_piket);
                        return tgl >= startOfWeek && tgl <= endOfWeek && s.status === 'Declined';
                    });
                    setExistingSubmission(mingguIniSub || declinedMingguIni || null);
                }
            } catch (err) {
                console.error("Gagal cek submission WC:", err);
            } finally {
                setCheckLoading(false);
            }
        };
        checkSubmission();
    }, []);

    //! submit absen piket WC
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSubmitResult(null);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch('http://localhost:3000/piket-wc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: token },
                body: JSON.stringify({ kondisi })
            });
            const data = await res.json();
            if (res.ok) {
                setSubmitResult('success');
                setShowForm(false);
                setExistingSubmission({ ...data.data, status: 'Pending' });
            } else {
                setErrorMsg(data.message || "Gagal submit absen WC.");
                setSubmitResult('error');
            }
        } catch (err) {
            setErrorMsg("Terjadi kesalahan koneksi ke server.");
            setSubmitResult('error');
        } finally {
            setLoading(false);
        }
    };

    //* reset untuk absen ulang
    const handleAbsenUlang = () => {
        setExistingSubmission(null);
        setShowForm(true);
        setSubmitResult(null);
        setKondisi('');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex overflow-hidden">
            <Sidebar user={currentUser} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <main className="flex-1 md:ml-64 p-4 md:p-8 animate-fadeIn">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Absen Piket WC</h1>
                    <p className="text-gray-500 mt-1">
                        Jadwal piket WC kamu: <span className="font-bold text-gray-700">{currentUser?.hari_wc || '—'}</span>
                        {' '}· Minggu ke-<span className="font-bold text-gray-700">{currentUser?.minggu_ke || '—'}</span>
                        {' '}· Sekarang minggu ke-<span className="font-bold text-gray-700">{minggukeSiklus}</span>
                    </p>
                </div>

                {checkLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin text-green-600 mb-4" size={40} />
                        <p className="text-gray-500">Memeriksa status absen...</p>
                    </div>
                ) : !isJadwalHariIni ? (
                    <div className="bg-white rounded-2xl p-12 shadow-sm border border-orange-200 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-50 text-orange-500 mb-4">
                            <AlertCircle size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-700 mb-2">Bukan Jadwal Piket WC Kamu</h2>
                        {!isHariWc ? (
                            <p className="text-gray-500 text-sm">Hari ini <span className="font-bold">{hariIni}</span>. Jadwal piket WC kamu adalah hari <span className="font-bold">{currentUser?.hari_wc}</span>.</p>
                        ) : (
                            <p className="text-gray-500 text-sm">Hari sudah sesuai, tapi sekarang minggu ke-<span className="font-bold">{minggukeSiklus}</span>. Jadwal piket WC kamu minggu ke-<span className="font-bold">{currentUser?.minggu_ke}</span>.</p>
                        )}
                    </div>
                ) : existingSubmission && !showForm ? (
                    <StatusCardWc submission={existingSubmission} onAbsenUlang={handleAbsenUlang} />
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><Droplets size={20} /></div>
                                <div>
                                    <h2 className="font-bold text-gray-900">Form Absen Piket WC</h2>
                                    <p className="text-xs text-gray-500">Hari ini: {hariIni} · Minggu ke-{minggukeSiklus} — Jadwal kamu</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {submitResult === 'error' && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                                    <XCircle size={18} className="shrink-0" />{errorMsg}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700 ml-1">Kondisi Kebersihan WC</label>
                                <select required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all text-sm" value={kondisi} onChange={(e) => setKondisi(e.target.value)}>
                                    <option value="">-- Pilih Kondisi --</option>
                                    <option value="Bersih dan Rapi">Bersih dan Rapi</option>
                                    <option value="Bersih">Bersih</option>
                                    <option value="Kurang Bersih">Kurang Bersih</option>
                                </select>
                            </div>

                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                                <span className="font-bold">Tugas WC kamu: </span>
                                <div className="pb-3">Kode <span className="font-bold">{currentUser?.tugas_wc || '—'}</span></div>
                                <div className="border-t border-blue-200 pt-3">
                                    <p className="font-semibold text-blue-900 mb-2">Keterangan Tugas</p>
                                    <div className="space-y-2 text-xs md:text-sm">
                                        <div className="flex gap-2"><span className="px-2 py-0.5 rounded bg-green-200 text-green-700 font-bold">A</span><span>Membersihkan kloset dan lantai WC</span></div>
                                        <div className="flex gap-2"><span className="px-2 py-0.5 rounded bg-yellow-200 text-yellow-700 font-bold">B</span><span>Membersihkan dinding keramik/pintu dan ember, gayung</span></div>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70">
                                {loading ? <><Loader2 size={18} className="animate-spin" />Mengirim...</> : <><Droplets size={18} />Kirim Absen WC</>}
                            </button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}
