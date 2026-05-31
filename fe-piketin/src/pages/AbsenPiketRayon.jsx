import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ClipboardCheck,
    Upload,
    CheckSquare,
    Loader2,
    AlertCircle,
    CheckCircle,
    XCircle
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

// ─── AbsenPiketRayon ───────────────────────────────────────────────────────────
// halaman absen piket rayon untuk murid
// backend: POST /submissions — multipart/form-data
// field: status_piket, kondisi, catatan, pekerjaan_ids[], foto_sebelum, foto_sesudah
// validasi jadwal dilakukan di backend — kalau bukan hari piket, backend tolak
export default function AbsenPiketRayon() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // state form
    const [formData, setFormData] = useState({
        status_piket: '',
        kondisi: '',
        catatan: '',
    });
    const [fotoSebelum, setFotoSebelum] = useState(null);
    const [fotoSesudah, setFotoSesudah] = useState(null);

    //* pekerjaan_ids — array id jenis pekerjaan yang dipilih (bisa lebih dari 1)
    const [selectedPekerjaan, setSelectedPekerjaan] = useState([]);
    const [jenisPekerjaanList, setJenisPekerjaanList] = useState([]);
    const [jpLoading, setJpLoading] = useState(true);

    // state submit
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null); // null | 'success' | 'error'
    const [errorMsg, setErrorMsg] = useState('');

    //* cek apakah hari ini jadwal piket rayon murid ini
    const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const hariIni = namaHari[new Date().getDay()];
    const isJadwalHariIni = currentUser?.jadwal_piket === hariIni;

    //* ambil userData dari localStorage buat sidebar dan cek jadwal
    useEffect(() => {
        const storedUser = localStorage.getItem("userData");
        if (storedUser) setCurrentUser(JSON.parse(storedUser));
    }, []);

    //! fetch daftar jenis pekerjaan untuk dropdown pilihan
    // endpoint: GET /jenis-pekerjaan — diakses murid juga karena butuh daftar ini
    // note: backend route /jenis-pekerjaan pakai checkRole('psrayon')
    // kalau murid tidak bisa akses, perlu tambah role murid di route atau buat endpoint publik
    useEffect(() => {
        const fetchJp = async () => {
            setJpLoading(true);
            try {
                const token = localStorage.getItem("token");
                const res = await fetch('http://localhost:3000/jenis-pekerjaan?page=1&limit=100', {
                    headers: { Authorization: token }
                });
                const result = await res.json();
                if (result.status === 200) {
                    setJenisPekerjaanList(result.data.data);
                }
            } catch (err) {
                console.error("Gagal fetch jenis pekerjaan:", err);
            } finally {
                setJpLoading(false);
            }
        };
        fetchJp();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    //! toggle pilihan pekerjaan — kalau sudah ada di array, hapus. kalau belum, tambah
    const togglePekerjaan = (id) => {
        setSelectedPekerjaan(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    //! submit absen piket rayon
    // pakai FormData karena ada file upload (foto_sebelum dan foto_sesudah)
    // Content-Type tidak di-set manual — browser otomatis set multipart/form-data + boundary
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!fotoSebelum || !fotoSesudah) {
            setErrorMsg("Foto sebelum dan sesudah wajib diupload.");
            setResult('error');
            return;
        }
        if (selectedPekerjaan.length === 0) {
            setErrorMsg("Pilih minimal 1 jenis pekerjaan.");
            setResult('error');
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const token = localStorage.getItem("token");

            //! FormData — wajib untuk upload file
            const fd = new FormData();
            fd.append('status_piket', formData.status_piket);
            fd.append('kondisi', formData.kondisi);
            if (formData.catatan) fd.append('catatan', formData.catatan);
            fd.append('foto_sebelum', fotoSebelum);
            fd.append('foto_sesudah', fotoSesudah);

            //! pekerjaan_ids dikirim sebagai array — append tiap id satu per satu
            // backend: Array.isArray(pekerjaan_ids) ? pekerjaan_ids : [pekerjaan_ids]
            selectedPekerjaan.forEach(id => fd.append('pekerjaan_ids', id));

            const res = await fetch('http://localhost:3000/submissions', {
                method: 'POST',
                headers: { Authorization: token },
                //* JANGAN set Content-Type manual — biarkan browser yang set multipart/form-data
                body: fd
            });

            const data = await res.json();

            if (res.ok) {
                setResult('success');
            } else {
                setErrorMsg(data.message || "Gagal submit absen.");
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
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Absen Piket Rayon</h1>
                    <p className="text-gray-500 mt-1">
                        Jadwal piket rayon kamu: <span className="font-bold text-gray-700">{currentUser?.jadwal_piket || '—'}</span>
                    </p>
                </div>

                {/* kalau bukan hari jadwal piket, tampilkan info saja */}
                {!isJadwalHariIni ? (
                    <div className="bg-white rounded-2xl p-12 shadow-sm border border-orange-200 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-50 text-orange-500 mb-4">
                            <AlertCircle size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-700 mb-2">Bukan Jadwal Piket Kamu Hari Ini</h2>
                        <p className="text-gray-500 text-sm">
                            Hari ini <span className="font-bold">{hariIni}</span>. Jadwal piket rayon kamu adalah hari <span className="font-bold">{currentUser?.jadwal_piket}</span>.
                        </p>
                    </div>
                ) : result === 'success' ? (
                    // tampilkan sukses setelah submit berhasil
                    <div className="bg-white rounded-2xl p-12 shadow-sm border border-green-200 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 text-green-600 mb-4">
                            <CheckCircle size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-700 mb-2">Absen Berhasil Dikirim!</h2>
                        <p className="text-gray-500 text-sm mb-6">Absen piket rayon kamu sudah dikirim dan menunggu persetujuan PS Rayon.</p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-colors"
                        >
                            Kembali ke Dashboard
                        </button>
                    </div>
                ) : (
                    // form absen
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 rounded-xl text-green-600">
                                    <ClipboardCheck size={20} />
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-900">Form Absen Piket Rayon</h2>
                                    <p className="text-xs text-gray-500">Hari ini: {hariIni} — Jadwal kamu</p>
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

                            {/* ── Status Piket ── */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700 ml-1">Status Piket</label>
                                <select
                                    name="status_piket"
                                    required
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all text-sm"
                                    value={formData.status_piket}
                                    onChange={handleChange}
                                >
                                    <option value="">-- Pilih Status --</option>
                                    <option value="Piket">Piket</option>
                                    <option value="Tidak Piket">Tidak Piket</option>
                                </select>
                            </div>

                            {/* ── Kondisi ── */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700 ml-1">Kondisi Kebersihan</label>
                                <select
                                    name="kondisi"
                                    required
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all text-sm"
                                    value={formData.kondisi}
                                    onChange={handleChange}
                                >
                                    <option value="">-- Pilih Kondisi --</option>
                                    <option value="Bersih dan Rapi">Bersih dan Rapi</option>
                                    <option value="Bersih">Bersih</option>
                                    <option value="Kurang">Kurang</option>
                                </select>
                            </div>

                            {/* ── Jenis Pekerjaan — multi-select via checkbox ── */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 ml-1">
                                    Pekerjaan yang Dilakukan
                                    <span className="text-gray-400 font-normal ml-1">(pilih semua yang sesuai)</span>
                                </label>
                                {jpLoading ? (
                                    <div className="flex items-center gap-2 text-gray-400 text-sm p-3">
                                        <Loader2 size={16} className="animate-spin" />
                                        Memuat daftar pekerjaan...
                                    </div>
                                ) : jenisPekerjaanList.length === 0 ? (
                                    <p className="text-gray-400 text-sm p-3">Belum ada jenis pekerjaan. Hubungi PS Rayon kamu.</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {jenisPekerjaanList.map(jp => (
                                            <label
                                                key={jp.id}
                                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                                                    ${selectedPekerjaan.includes(jp.id)
                                                        ? 'border-green-500 bg-green-50 text-green-700'
                                                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-green-300'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={selectedPekerjaan.includes(jp.id)}
                                                    onChange={() => togglePekerjaan(jp.id)}
                                                />
                                                <CheckSquare
                                                    size={18}
                                                    className={selectedPekerjaan.includes(jp.id) ? 'text-green-600' : 'text-gray-300'}
                                                />
                                                <span className="text-sm font-medium">{jp.nama_pekerjaan}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ── Catatan (opsional) ── */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700 ml-1">
                                    Catatan <span className="text-gray-400 font-normal">(opsional)</span>
                                </label>
                                <textarea
                                    name="catatan"
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all text-sm resize-none"
                                    placeholder="Tambahkan catatan jika ada..."
                                    value={formData.catatan}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* ── Upload Foto — 2 kolom ── */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* foto sebelum */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Foto Sebelum</label>
                                    <label className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all
                                        ${fotoSebelum ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50 hover:border-green-300'}`}>
                                        <Upload size={24} className={fotoSebelum ? 'text-green-600' : 'text-gray-400'} />
                                        <span className="text-xs font-medium text-center text-gray-500">
                                            {fotoSebelum ? fotoSebelum.name : 'Klik untuk upload foto sebelum piket'}
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => setFotoSebelum(e.target.files[0])}
                                        />
                                    </label>
                                </div>

                                {/* foto sesudah */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Foto Sesudah</label>
                                    <label className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all
                                        ${fotoSesudah ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50 hover:border-green-300'}`}>
                                        <Upload size={24} className={fotoSesudah ? 'text-green-600' : 'text-gray-400'} />
                                        <span className="text-xs font-medium text-center text-gray-500">
                                            {fotoSesudah ? fotoSesudah.name : 'Klik untuk upload foto sesudah piket'}
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => setFotoSesudah(e.target.files[0])}
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* ── Tombol Submit ── */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
                            >
                                {loading
                                    ? <><Loader2 size={18} className="animate-spin" /> Mengirim...</>
                                    : <><ClipboardCheck size={18} /> Kirim Absen</>
                                }
                            </button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}
