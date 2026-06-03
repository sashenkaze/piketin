import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ClipboardCheck,
    Upload,
    CheckSquare,
    Loader2,
    AlertCircle,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

// ─── StatusCard ────────────────────────────────────────────────────────────────
// tampilkan status submission yang sudah ada hari ini
// kalau Declined, tampilkan alasan + tombol absen ulang
function StatusCard({ submission, onAbsenUlang }) {
    const statusMap = {
        Pending: {
            border: 'border-orange-200',
            bg: 'bg-orange-50',
            icon: <Clock size={32} className="text-orange-500" />,
            title: 'Absen Sudah Dikirim — Menunggu Persetujuan',
            desc: 'Absen piket rayon kamu sedang menunggu persetujuan PS Rayon.',
            badge: 'bg-orange-100 text-orange-700',
        },
        Accepted: {
            border: 'border-green-200',
            bg: 'bg-green-50',
            icon: <CheckCircle size={32} className="text-green-600" />,
            title: 'Absen Diterima!',
            desc: 'PS Rayon sudah menyetujui absen piket rayon kamu hari ini.',
            badge: 'bg-green-100 text-green-700',
        },
        Declined: {
            border: 'border-red-200',
            bg: 'bg-red-50',
            icon: <XCircle size={32} className="text-red-500" />,
            title: 'Absen Ditolak',
            desc: 'PS Rayon menolak absen piket rayon kamu. Kamu bisa absen ulang.',
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

// ─── AbsenPiketRayon ───────────────────────────────────────────────────────────
export default function AbsenPiketRayon() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // state cek submission hari ini
    const [checkLoading, setCheckLoading] = useState(true);
    const [existingSubmission, setExistingSubmission] = useState(null); // null = belum ada
    const [showForm, setShowForm] = useState(false); // true = paksa tampilkan form (absen ulang)

    // state form
    const [formData, setFormData] = useState({ status_piket: '', kondisi: '', catatan: '' });
    const [fotoSebelum, setFotoSebelum] = useState(null);
    const [fotoSesudah, setFotoSesudah] = useState(null);
    const [selectedPekerjaan, setSelectedPekerjaan] = useState([]);
    const [jenisPekerjaanList, setJenisPekerjaanList] = useState([]);
    const [jpLoading, setJpLoading] = useState(true);

    // state submit
    const [loading, setLoading] = useState(false);
    const [submitResult, setSubmitResult] = useState(null); // null | 'success' | 'error'
    const [errorMsg, setErrorMsg] = useState('');

    const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const hariIni = namaHari[new Date().getDay()];
    const tanggalHariIni = new Date().toISOString().split('T')[0];

    //* ambil userData dari localStorage
    useEffect(() => {
        const storedUser = localStorage.getItem("userData");
        if (storedUser) setCurrentUser(JSON.parse(storedUser));
    }, []);

    //! cek apakah sudah ada submission hari ini
    // endpoint: GET /submissions/my?page=1&limit=5 — ambil submission terbaru lalu filter tanggal hari ini
    useEffect(() => {
        const checkSubmission = async () => {
            setCheckLoading(true);
            try {
                const token = localStorage.getItem("token");
                const res = await fetch('http://localhost:3000/submissions/my?page=1&limit=5', {
                    headers: { Authorization: token }
                });
                const result = await res.json();
                if (result.status === 200) {
                    //* cari submission hari ini yang bukan Declined
                    const hariIniSub = result.data.data.find(s =>
                        s.tanggal_piket === tanggalHariIni && s.status !== 'Declined'
                    );
                    //* kalau ada yang Declined hari ini, tampilkan juga supaya bisa absen ulang
                    const declinedHariIni = result.data.data.find(s =>
                        s.tanggal_piket === tanggalHariIni && s.status === 'Declined'
                    );
                    setExistingSubmission(hariIniSub || declinedHariIni || null);
                }
            } catch (err) {
                console.error("Gagal cek submission:", err);
            } finally {
                setCheckLoading(false);
            }
        };
        checkSubmission();
    }, []);

    //! fetch daftar jenis pekerjaan
    useEffect(() => {
        const fetchJp = async () => {
            setJpLoading(true);
            try {
                const token = localStorage.getItem("token");
                const res = await fetch('http://localhost:3000/jenis-pekerjaan?page=1&limit=100', {
                    headers: { Authorization: token }
                });
                const result = await res.json();
                if (result.status === 200) setJenisPekerjaanList(result.data.data);
            } catch (err) {
                console.error("Gagal fetch jenis pekerjaan:", err);
            } finally {
                setJpLoading(false);
            }
        };
        fetchJp();
    }, []);

    const isJadwalHariIni = currentUser?.jadwal_piket === hariIni;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const togglePekerjaan = (id) => {
        setSelectedPekerjaan(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    //! submit absen piket rayon
    const handleSubmit = async (e) => {
        e.preventDefault();
        const tidakPiket = formData.status_piket === 'Tidak Piket';

        //* kalau Piket, foto dan pekerjaan wajib. kalau Tidak Piket, skip validasi keduanya
        if (!tidakPiket) {
            if (!fotoSebelum || !fotoSesudah) { setErrorMsg("Foto sebelum dan sesudah wajib diupload."); setSubmitResult('error'); return; }
            if (selectedPekerjaan.length === 0) { setErrorMsg("Pilih minimal 1 jenis pekerjaan."); setSubmitResult('error'); return; }
        }

        setLoading(true);
        setSubmitResult(null);
        try {
            const token = localStorage.getItem("token");
            const fd = new FormData();
            fd.append('status_piket', formData.status_piket);
            if (formData.catatan) fd.append('catatan', formData.catatan);

            //* kalau Piket, append kondisi, foto, dan pekerjaan. kalau Tidak Piket, skip
            if (!tidakPiket) {
                fd.append('kondisi', formData.kondisi);
                fd.append('foto_sebelum', fotoSebelum);
                fd.append('foto_sesudah', fotoSesudah);
                selectedPekerjaan.forEach(id => fd.append('pekerjaan_ids', id));
            } else {
                //! backend tetap butuh kondisi dan foto — kirim placeholder kalau Tidak Piket
                // backend validasi kondisi dan foto wajib ada, tapi untuk Tidak Piket
                // kita kirim nilai default supaya tidak error di validasi
                fd.append('kondisi', 'Kurang');
            }

            const res = await fetch('http://localhost:3000/submissions', {
                method: 'POST',
                headers: { Authorization: token },
                body: fd
            });
            const data = await res.json();

            if (res.ok) {
                setSubmitResult('success');
                setShowForm(false);
                //* refresh cek submission setelah berhasil submit
                setExistingSubmission({ ...data.data, status: 'Pending' });
            } else {
                setErrorMsg(data.message || "Gagal submit absen.");
                setSubmitResult('error');
            }
        } catch (err) {
            setErrorMsg("Terjadi kesalahan koneksi ke server.");
            setSubmitResult('error');
        } finally {
            setLoading(false);
        }
    };

    //* reset form untuk absen ulang
    const handleAbsenUlang = () => {
        setExistingSubmission(null);
        setShowForm(true);
        setSubmitResult(null);
        setFormData({ status_piket: '', kondisi: '', catatan: '' });
        setFotoSebelum(null);
        setFotoSesudah(null);
        setSelectedPekerjaan([]);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex overflow-hidden">
            <Sidebar user={currentUser} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <main className="flex-1 md:ml-64 p-4 md:p-8 animate-fadeIn">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Absen Piket Rayon</h1>
                    <p className="text-gray-500 mt-1">
                        Jadwal piket rayon kamu: <span className="font-bold text-gray-700">{currentUser?.jadwal_piket || '—'}</span>
                    </p>
                </div>

                {checkLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin text-green-600 mb-4" size={40} />
                        <p className="text-gray-500">Memeriksa status absen...</p>
                    </div>
                ) : !isJadwalHariIni ? (
                    // bukan hari jadwal piket
                    <div className="bg-white rounded-2xl p-12 shadow-sm border border-orange-200 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-50 text-orange-500 mb-4">
                            <AlertCircle size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-700 mb-2">Bukan Jadwal Piket Kamu Hari Ini</h2>
                        <p className="text-gray-500 text-sm">
                            Hari ini <span className="font-bold">{hariIni}</span>. Jadwal piket rayon kamu adalah hari <span className="font-bold">{currentUser?.jadwal_piket}</span>.
                        </p>
                    </div>
                ) : existingSubmission && !showForm ? (
                    // sudah ada submission hari ini — tampilkan status card
                    <StatusCard submission={existingSubmission} onAbsenUlang={handleAbsenUlang} />
                ) : (
                    // form absen
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 rounded-xl text-green-600"><ClipboardCheck size={20} /></div>
                                <div>
                                    <h2 className="font-bold text-gray-900">Form Absen Piket Rayon</h2>
                                    <p className="text-xs text-gray-500">Hari ini: {hariIni} — Jadwal kamu</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {submitResult === 'error' && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                                    <XCircle size={18} className="shrink-0" />{errorMsg}
                                </div>
                            )}

                            {/* ── Status Piket ── */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700 ml-1">Status Piket</label>
                                <select name="status_piket" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all text-sm" value={formData.status_piket} onChange={handleChange}>
                                    <option value="">-- Pilih Status --</option>
                                    <option value="Piket">Piket</option>
                                    <option value="Tidak Piket">Tidak Piket</option>
                                </select>
                            </div>

                            {/*
                             * kalau "Tidak Piket" dipilih:
                             * - kondisi, pekerjaan, foto sebelum/sesudah di-disable dan diberi opacity rendah
                             * - catatan menjadi wajib (required)
                             * catatan: disabled tidak reset value, tapi backend tidak akan butuh field ini
                             */}
                            {(() => {
                                const tidakPiket = formData.status_piket === 'Tidak Piket';
                                return (
                                    <>
                                        {/* ── Kondisi Kebersihan — disabled kalau Tidak Piket ── */}
                                        <div className={`space-y-1.5 transition-opacity ${tidakPiket ? 'opacity-40 pointer-events-none' : ''}`}>
                                            <label className="text-sm font-bold text-gray-700 ml-1">
                                                Kondisi Kebersihan
                                                {tidakPiket && <span className="text-xs text-gray-400 font-normal ml-1">(tidak diperlukan)</span>}
                                            </label>
                                            <select name="kondisi" required={!tidakPiket} disabled={tidakPiket} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all text-sm disabled:cursor-not-allowed" value={tidakPiket ? '' : formData.kondisi} onChange={handleChange}>
                                                <option value="">-- Pilih Kondisi --</option>
                                                <option value="Bersih dan Rapi">Bersih dan Rapi</option>
                                                <option value="Bersih">Bersih</option>
                                                <option value="Kurang">Kurang</option>
                                            </select>
                                        </div>

                                        {/* ── Pekerjaan — disabled kalau Tidak Piket ── */}
                                        <div className={`space-y-2 transition-opacity ${tidakPiket ? 'opacity-40 pointer-events-none' : ''}`}>
                                            <label className="text-sm font-bold text-gray-700 ml-1">
                                                Pekerjaan yang Dilakukan
                                                {tidakPiket
                                                    ? <span className="text-xs text-gray-400 font-normal ml-1">(tidak diperlukan)</span>
                                                    : <span className="text-gray-400 font-normal ml-1">(pilih semua yang sesuai)</span>
                                                }
                                            </label>
                                            {jpLoading ? (
                                                <div className="flex items-center gap-2 text-gray-400 text-sm p-3"><Loader2 size={16} className="animate-spin" />Memuat daftar pekerjaan...</div>
                                            ) : jenisPekerjaanList.length === 0 ? (
                                                <p className="text-gray-400 text-sm p-3">Belum ada jenis pekerjaan. Hubungi PS Rayon kamu.</p>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {jenisPekerjaanList.map(jp => (
                                                        <label key={jp.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${tidakPiket ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400' : selectedPekerjaan.includes(jp.id) ? 'cursor-pointer border-green-500 bg-green-50 text-green-700' : 'cursor-pointer border-gray-200 bg-gray-50 text-gray-700 hover:border-green-300'}`}>
                                                            <input type="checkbox" className="hidden" checked={!tidakPiket && selectedPekerjaan.includes(jp.id)} onChange={() => !tidakPiket && togglePekerjaan(jp.id)} />
                                                            <CheckSquare size={18} className={!tidakPiket && selectedPekerjaan.includes(jp.id) ? 'text-green-600' : 'text-gray-300'} />
                                                            <span className="text-sm font-medium">{jp.nama_pekerjaan}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* ── Catatan — wajib kalau Tidak Piket, opsional kalau Piket ── */}
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-gray-700 ml-1">
                                                Catatan{' '}
                                                {tidakPiket
                                                    ? <span className="text-red-500">*</span>
                                                    : <span className="text-gray-400 font-normal">(opsional)</span>
                                                }
                                            </label>
                                            <textarea
                                                name="catatan" rows={3}
                                                required={tidakPiket}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all text-sm resize-none"
                                                placeholder={tidakPiket ? 'Wajib isi alasan tidak piket...' : 'Tambahkan catatan jika ada...'}
                                                value={formData.catatan}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        {/* ── Foto — disabled kalau Tidak Piket ── */}
                                        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity ${tidakPiket ? 'opacity-40 pointer-events-none' : ''}`}>
                                            {[{ label: 'Foto Sebelum', state: fotoSebelum, setter: setFotoSebelum }, { label: 'Foto Sesudah', state: fotoSesudah, setter: setFotoSesudah }].map(({ label, state, setter }) => (
                                                <div key={label} className="space-y-1.5">
                                                    <label className="text-sm font-bold text-gray-700 ml-1">
                                                        {label}
                                                        {tidakPiket && <span className="text-xs text-gray-400 font-normal ml-1">(tidak diperlukan)</span>}
                                                    </label>
                                                    <label className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl transition-all ${tidakPiket ? 'cursor-not-allowed border-gray-200 bg-gray-50' : state ? 'cursor-pointer border-green-400 bg-green-50' : 'cursor-pointer border-gray-200 bg-gray-50 hover:border-green-300'}`}>
                                                        <Upload size={24} className={state && !tidakPiket ? 'text-green-600' : 'text-gray-400'} />
                                                        <span className="text-xs font-medium text-center text-gray-500">{state && !tidakPiket ? state.name : tidakPiket ? 'Tidak diperlukan' : `Klik untuk upload ${label.toLowerCase()}`}</span>
                                                        {!tidakPiket && <input type="file" accept="image/*" className="hidden" onChange={(e) => setter(e.target.files[0])} />}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                );
                            })()}

                            <button type="submit" disabled={loading} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70">
                                {loading ? <><Loader2 size={18} className="animate-spin" />Mengirim...</> : <><ClipboardCheck size={18} />Kirim Absen</>}
                            </button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}
