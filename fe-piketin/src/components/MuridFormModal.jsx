import { useState, useEffect } from 'react';
import { X, Save, User, Hash, Mail, Lock, Calendar, CalendarDays, Loader2 } from 'lucide-react';

// ─── MuridFormModal ────────────────────────────────────────────────────────────
// modal form create/edit murid
// field: name, nis, email, password (create only), jadwal_piket, minggu_ke, hari_wc, tugas_wc
// rayon_id TIDAK dikirim — backend otomatis ambil dari token psrayon
//
// Props:
//   - isOpen   : boolean buka/tutup modal
//   - onClose  : fungsi tutup modal
//   - onSubmit : fungsi submit form, terima formData object
//   - murid    : null = mode create, object = mode edit
export default function MuridFormModal({ isOpen, onClose, onSubmit, murid }) {
    //! isEdit: kalau murid ada berarti mode edit, kalau null berarti mode create
    const isEdit = !!murid;
    const [loading, setLoading] = useState(false);

    // state form — semua field sesuai backend
    const [formData, setFormData] = useState({
        name: '',
        nis: '',
        email: '',
        password: '',
        jadwal_piket: '',
        minggu_ke: '',
        hari_wc: '',
        tugas_wc: '',
    });

    //* sync form ke data murid yang dipilih pas modal dibuka (mode edit)
    useEffect(() => {
        if (murid) {
            setFormData({
                name: murid.name || '',
                nis: murid.nis || '',
                email: murid.email || '',
                password: '', //* password dikosongkan saat edit — tidak dikirim ke backend
                jadwal_piket: murid.jadwal_piket || '',
                minggu_ke: murid.minggu_ke || '',
                hari_wc: murid.hari_wc || '',
                tugas_wc: murid.tugas_wc || '',
            });
        } else {
            //* reset form kalau mode create
            setFormData({ name: '', nis: '', email: '', password: '', jadwal_piket: '', minggu_ke: '', hari_wc: '', tugas_wc: '' });
        }
    }, [murid, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        //! kalau mode edit, jangan kirim password (field kosong)
        // backend updateUser tidak punya field password di schema-nya
        const payload = { ...formData };
        if (isEdit) delete payload.password;

        await onSubmit(payload);
        setLoading(false);
    };

    // opsi enum sesuai backend
    const hariOptions = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    const tugasWcOptions = ['A', 'B'];
    const mingguOptions = [1, 2, 3, 4];

    return (
        // overlay gelap di belakang modal
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Container — scroll kalau konten panjang */}
            <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                    <h3 className="text-lg font-bold text-gray-900">
                        {isEdit ? 'Edit Akun Murid' : 'Tambah Akun Murid'}
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form — scrollable */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">

                    {/* ── Nama ── */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700 ml-1">Nama Lengkap</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-green-600 transition-colors pointer-events-none">
                                <User size={18} />
                            </div>
                            <input type="text" name="name" required
                                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all text-sm"
                                placeholder="Nama lengkap murid"
                                value={formData.name} onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* ── NIS ── */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700 ml-1">NIS</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-green-600 transition-colors pointer-events-none">
                                <Hash size={18} />
                            </div>
                            <input type="text" name="nis" required
                                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all text-sm"
                                placeholder="Nomor Induk Siswa"
                                value={formData.nis} onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* ── Email ── */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700 ml-1">Email</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-green-600 transition-colors pointer-events-none">
                                <Mail size={18} />
                            </div>
                            <input type="email" name="email" required
                                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all text-sm"
                                placeholder="email@piketin.com"
                                value={formData.email} onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* ── Password — hanya saat create ── */}
                    {!isEdit && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-green-600 transition-colors pointer-events-none">
                                    <Lock size={18} />
                                </div>
                                <input type="password" name="password" required
                                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all text-sm"
                                    placeholder="••••••••"
                                    value={formData.password} onChange={handleChange}
                                />
                            </div>
                        </div>
                    )}

                    {/* ── Jadwal Piket + Minggu Ke — 2 kolom ── */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 ml-1">Jadwal Piket</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-green-600 transition-colors pointer-events-none">
                                    <Calendar size={18} />
                                </div>
                                <select name="jadwal_piket" required
                                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all text-sm appearance-none"
                                    value={formData.jadwal_piket} onChange={handleChange}
                                >
                                    <option value="">-- Pilih --</option>
                                    {hariOptions.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 ml-1">Minggu Ke</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-green-600 transition-colors pointer-events-none">
                                    <CalendarDays size={18} />
                                </div>
                                <select name="minggu_ke" required
                                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all text-sm appearance-none"
                                    value={formData.minggu_ke} onChange={handleChange}
                                >
                                    <option value="">-- Pilih --</option>
                                    {mingguOptions.map(m => <option key={m} value={m}>Minggu {m}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ── Hari WC + Tugas WC — 2 kolom ── */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 ml-1">Hari WC</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-green-600 transition-colors pointer-events-none">
                                    <Calendar size={18} />
                                </div>
                                <select name="hari_wc" required
                                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all text-sm appearance-none"
                                    value={formData.hari_wc} onChange={handleChange}
                                >
                                    <option value="">-- Pilih --</option>
                                    {hariOptions.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 ml-1">Tugas WC</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-green-600 transition-colors pointer-events-none">
                                    <Hash size={18} />
                                </div>
                                <select name="tugas_wc" required
                                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all text-sm appearance-none"
                                    value={formData.tugas_wc} onChange={handleChange}
                                >
                                    <option value="">-- Pilih --</option>
                                    {tugasWcOptions.map(t => <option key={t} value={t}>Tugas {t}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ── Tombol Aksi ── */}
                    <div className="flex items-center gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                            Batal
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            Simpan Data
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
