import { useState, useEffect } from 'react';
import { X, Save, User, Mail, Lock, Landmark, Loader2, ChevronDown } from 'lucide-react';

/**
 * UserFormModal Component
 * Reusable modal for Creating and Updating users.
 * Supports different roles through 'role' prop.
 */
const UserFormModal = ({ isOpen, onClose, onSubmit, user, role }) => {
    const isEdit = !!user;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        rayon_id: ''
    });

    //* state list rayon dari backend buat dropdown
    const [rayonList, setRayonList] = useState([]);
    const [rayonLoading, setRayonLoading] = useState(false);

    // Sync state when user changes (mode edit)
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                password: '', // Password dikosongkan saat edit untuk keamanan
                rayon_id: user.rayon_id || ''
            });
        } else {
            setFormData({ name: '', email: '', password: '', rayon_id: '' });
        }
    }, [user, isOpen]);

    //! fetch list rayon pas modal dibuka — buat isi dropdown pilihan rayon
    // endpoint: GET /rayons — ambil semua rayon tanpa pagination ketat (limit besar)
    useEffect(() => {
        if (!isOpen) return;

        const fetchRayons = async () => {
            setRayonLoading(true);
            try {
                const token = localStorage.getItem("token");
                //* token tanpa "Bearer " — sesuai checkToken di auth.js
                const res = await fetch('http://localhost:3000/rayons?page=1&limit=100', {
                    headers: { Authorization: token }
                });
                const result = await res.json();
                if (result.status === 200) {
                    setRayonList(result.data.data);
                }
            } catch (err) {
                console.error("Gagal fetch rayon:", err);
            } finally {
                setRayonLoading(false);
            }
        };

        fetchRayons();
    }, [isOpen]); //* jalan ulang tiap modal dibuka supaya data selalu fresh

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onSubmit(formData);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-6">
            {/* Overlay Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-fadeIn"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scaleIn border border-gray-100">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900">
                        {isEdit ? 'Edit Akun' : 'Tambah Akun'} {role === 'psrayon' ? 'PS Rayon' : role}
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body / Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Name Field */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700 ml-1">Nama Lengkap</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-green-600 transition-colors">
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                name="name"
                                required
                                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all text-sm"
                                placeholder="Masukkan nama lengkap"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Email Field */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700 ml-1">Alamat Email</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-green-600 transition-colors">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                name="email"
                                required
                                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all text-sm"
                                placeholder="example@piketin.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Password Field (Only for Create) */}
                    {!isEdit && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-green-600 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    required={!isEdit}
                                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all text-sm"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    )}

                    {/* Rayon Field — hanya tampil kalau role psrayon, kokurikuler gak butuh rayon */}
                    {role === 'psrayon' && (
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-gray-700 ml-1">Rayon</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-green-600 transition-colors pointer-events-none">
                                {rayonLoading ? <Loader2 size={18} className="animate-spin" /> : <Landmark size={18} />}
                            </div>
                            <select
                                name="rayon_id"
                                required
                                className="w-full pl-11 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none transition-all text-sm appearance-none"
                                value={formData.rayon_id}
                                onChange={handleChange}
                                disabled={rayonLoading}
                            >
                                {/* opsi default — wajib dipilih */}
                                <option value="">-- Pilih Rayon --</option>
                                {rayonList.map((rayon) => (
                                    <option key={rayon.id} value={rayon.id}>
                                        {rayon.nama_rayon}
                                    </option>
                                ))}
                            </select>
                            {/* icon chevron di kanan select */}
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
                                <ChevronDown size={16} />
                            </div>
                        </div>
                    </div>
                    )}

                    {/* Modal Footer / Buttons */}
                    <div className="flex items-center gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
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
};

export default UserFormModal;
