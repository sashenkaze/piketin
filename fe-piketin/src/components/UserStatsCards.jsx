import { Users, Shield, GraduationCap } from 'lucide-react';

/**
 * StatCard — komponen untuk menampilkan 1 kartu statistik.
 * 
 * Props:
 *   - title: judul kartu (misal "Total PS Rayon")
 *   - value: angka yang ditampilkan (dari API atau "—" kalau loading)
 *   - icon: komponen ikon dari lucide-react
 */
const StatCard = ({ title, value, icon: Icon }) => (
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
        {/* Ikon Latar Belakang Dekoratif */}
        <Icon className="absolute -right-4 -bottom-4 text-gray-900 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity" size={120} />
    </div>
);

/**
 * UserStatsCards — komponen untuk menampilkan 3 kartu statistik user.
 * 
 * Props:
 *   - userStats: objek { psrayon, kokurikuler, murid } dari API
 * 
 * Flow:
 *   1. Terima data userStats dari parent (App.jsx)
 *   2. Render 3 StatCard dengan data masing-masing role
 *   3. Kalau userStats null (belum fetch), tampilkan "—" sebagai placeholder
 * 
 * Asal: dipecah dari App.jsx untuk memisahkan concern.
 * Gunanya: komponen khusus untuk grid 3 kartu statistik user.
 */
export default function UserStatsCards({ userStats }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard title="Total PS Rayon" value={userStats?.psrayon ?? "—"} icon={Users} />
            <StatCard title="Total Kokurikuler" value={userStats?.kokurikuler ?? "—"} icon={Shield} />
            <StatCard title="Total Murid" value={userStats?.murid ?? "—"} icon={GraduationCap} />
        </div>
    );
}
