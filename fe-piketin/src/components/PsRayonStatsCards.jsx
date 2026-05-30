import { GraduationCap, ClipboardList } from 'lucide-react';

// StatCard — sama persis kayak di UserStatsCards, dipake ulang di sini
// dipisah supaya PsRayonStatsCards bisa berdiri sendiri tanpa import UserStatsCards
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
        {/* ikon dekoratif latar belakang */}
        <Icon className="absolute -right-4 -bottom-4 text-gray-900 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity" size={120} />
    </div>
);

// PsRayonStatsCards — 2 kartu statistik untuk dashboard psrayon
// Props:
//   - stats: { murid, pending } dari API /users/stats
export default function PsRayonStatsCards({ stats }) {
    return (
        //* 2 kolom — beda dari admin yang 3 kolom
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <StatCard
                title="Total Murid Rayon Kamu"
                value={stats?.murid ?? "—"}
                icon={GraduationCap}
            />
            <StatCard
                title="Submission Pending Hari Ini"
                value={stats?.pending ?? "—"}
                icon={ClipboardList}
            />
        </div>
    );
}
