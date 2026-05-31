import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Droplets,
    Loader2,
    AlertCircle,
    CheckCircle,
    XCircle
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

// ─── AbsenWc ───────────────────────────────────────────────────────────────────
// halaman absen piket WC untuk murid
// backend: POST /piket-wc — application/x-www-form-urlencoded (upload.none())
// field: kondisi (enum: "Bersih dan Rapi" | "Bersih" | "Kurang Bersih")
// validasi hari dan minggu siklus dilakukan di backend
export default function AbsenWc() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const [kondisi, setKondisi] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null); // null | 'success' | 'error'
    const [errorMsg, setErrorMsg] = useState('');

    //* cek apakah hari ini dan minggu ini jadwal piket WC murid ini
    // logika sama persis dengan backend piket-wc.controller.js
    const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const hariIni = namaHari[new Date().getDay()];

    //! hitung minggu ke berapa sekarang dalam siklus 4 minggu
    const getWeekNumber = (date) => {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        return Math.ceil(((date - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    };
    const mingguSekarang = getWeekNumber(new Date());
    const minggukeSiklus = ((mingguSekarang - 1) % 4) + 1;

    const isHariWc = currentUser?.hari_wc === hariIni;
    const isMingguWc = currentUser?.minggu_ke === minggukeSiklus;
    const isJadwalHariIni = isHariWc && isMingguWc;

    //* ambil userData dari localStorage buat sidebar dan cek jadwal
    useEffect(() => {
        const storedUser = localStorage.getItem("userData");
        if (storedUser) setCurrentUser(JSON.parse(storedUser));
    }, []);

    //! submit absen piket WC
    // backend pakai upload.none() — kirim sebagai JSON biasa
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch('http://localhost:3000/piket-wc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token
                },
                body: JSON.stringify({ kondisi })
            });

            const data = await res.json();

            if (res.ok) {
                setResult('success');
            } else {
                setErrorMsg(data.message || "Gagal submit absen WC.");
                setResult('error');
            }
        } catch (err) {
            setErrorMsg("Terjadi kesalahan koneksi ke server.");
            setResult('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex overflow-hidden">
            <Sidebar user={currentUser} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <main className="flex-1 md:ml-64 p-4 md:p-8 animate-fadeIn">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Absen Piket WC</h1>
                    <p className="text-gray-500 mt-1">
                        Jadwal piket WC kamu: <span className="font-bold text-gray-700">{currentUser?.hari_wc || '—'}</span>
                        {' '}· Minggu ke-<span className="font-bold text-gray-700">{currentUser?.minggu_ke || '—'}</span>
                        {' '}· Sekarang minggu ke-<span className="font-bold text-gray-700">{minggukeSiklus}</span>
                    </p>
                </div>

                {/* kalau bukan jadwal piket WC hari ini */}
                {!isJadwalHariIni ? (
                    <div className="bg-white rounded-2xl p-12 shadow-sm border border-orange-200 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-50 text-orange-500 mb-4">
                            <AlertCircle size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-700 mb-2">Bukan Jadwal Piket WC Kamu</h2>
                        {!isHariWc ? (
                            <p className="text-gray-500 text-sm">
                                Hari ini <span className="font-bold">{hariIni}</span>. Jadwal piket WC kamu adalah hari <span className="font-bold">{currentUser?.hari_wc}</span>.
                            </p>
                        ) : (
                            <p className="text-gray-500 text-sm">
                                Hari sudah sesuai, tapi sekarang minggu ke-<span className="font-bold">{minggukeSiklus}</span> dalam siklus.
                                Jadwal piket WC kamu adalah minggu ke-<span className="font-bold">{currentUser?.minggu_ke}</span>.
                            </p>
                        )}
                    </div>
                ) : result === 'success' ? (
                    // tampilkan sukses setelah submit berhasil
                    <div className="bg-white rounded-2xl p-12 shadow-sm border border-green-200 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 text-green-600 mb-4">
                            <CheckCircle size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-700 mb-2">Absen WC Berhasil Dikirim!</h2>
                        <p className="text-gray-500 text-sm mb-6">Absen piket WC kamu sudah dikirim dan menunggu persetujuan Kokurikuler.</p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-colors"
                        >
                            Kembali ke Dashboard
                        </button>
                    </div>
                ) : (
                    // form absen WC
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                                    <Droplets size={20} />
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-900">Form Absen Piket WC</h2>
                                    <p className="text-xs text-gray-500">
                                        Hari ini: {hariIni} · Minggu ke-{minggukeSiklus} — Jadwal kamu
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* error message */}
                            {result === 'error' && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                                    <XCircle size={18} className="shrink-0" />
                                    {errorMsg}
                                </div>
                            )}

                            {/* ── Kondisi Kebersihan WC ── */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700 ml-1">Kondisi Kebersihan WC</label>
                                <select
                                    required
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all text-sm"
                                    value={kondisi}
                                    onChange={(e) => setKondisi(e.target.value)}
                                >
                                    <option value="">-- Pilih Kondisi --</option>
                                    {/* enum di backend: "Bersih dan Rapi" | "Bersih" | "Kurang Bersih" */}
                                    <option value="Bersih dan Rapi">Bersih dan Rapi</option>
                                    <option value="Bersih">Bersih</option>
                                    <option value="Kurang Bersih">Kurang Bersih</option>
                                </select>
                            </div>

                            {/* info tugas WC otomatis dari profil */}
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                                <span className="font-bold">Tugas WC kamu: </span>
                                Tugas {currentUser?.tugas_wc || '—'} — otomatis dari profil, tidak perlu diisi manual.
                            </div>

                            {/* ── Tombol Submit ── */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
                            >
                                {loading
                                    ? <><Loader2 size={18} className="animate-spin" /> Mengirim...</>
                                    : <><Droplets size={18} /> Kirim Absen WC</>
                                }
                            </button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}
