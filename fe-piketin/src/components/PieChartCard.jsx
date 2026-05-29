import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';
import CardComp from './CardComp';

// CustomTooltip : komponen custom untuk tooltip recharts
// gunanya nampilin angka + satuan (misal "75%") saat hover di atas segment chart
// diletakkan di luar PieChartCard supaya tidak dibuat ulang tiap render
// active : boolean, true kalau user lagi hover di atas chart
// payload : array data dari segment yang di-hover, [0] karena pie cuma 1 segment aktif sekaligus
const CustomTooltip = ({ active, payload, unit }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '10px 14px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                fontSize: '13px',
                fontWeight: 600,
                color: '#111827',
            }}>
                {/* payload[0].name : nama segment (misal "Selesai") */}
                {/* payload[0].value : angka asli dari data */}
                {payload[0].name}: {payload[0].value}{unit}
            </div>
        );
    }
    return null;
};

// PieChartCard : komponen wrapper kartu berisi pie/donut chart
// props:
//   title       : judul kartu
//   icon        : komponen ikon dari lucide-react, ditampilkan di pojok kanan judul
//   data        : array of { name, value, color } — format wajib recharts
//   innerRadius : radius dalam donut. 0 = pie biasa, >0 = donut berlubang di tengah
//   unit        : satuan di tooltip, misal "%" atau "" (kosong = tidak ada satuan)
// kenapa pakai CardComp? supaya styling konsisten dengan komponen lain yang pakai CardComp
export default function PieChartCard({ title, icon: Icon, data, innerRadius = 0, unit = '' }) {
    return (
        <CardComp className="bg-white">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-900">{title}</h3>
                    <Icon size={18} className="text-gray-400" />
                </div>
                {/* h-64 : tinggi eksplisit wajib ada — ResponsiveContainer tidak bisa hitung tinggi sendiri kalau parent tidak punya ukuran */}
                <div className="h-64 w-full">
                    {/* ResponsiveContainer : wrapper dari recharts supaya chart ikut lebar parent */}
                    <ResponsiveContainer width="100%" height="100%">
                        {/* PieChart : komponen utama recharts untuk pie/donut chart */}
                        <PieChart>
                            {/* Pie : definisi lingkaran chart. dataKey="value" artinya recharts baca field "value" dari tiap objek di array data */}
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={innerRadius}
                                outerRadius={90}
                                paddingAngle={data.length > 1 ? 4 : 0}
                                dataKey="value"
                            >
                                {/* Cell : pewarna tiap segment. tanpa ini semua segment warnanya sama */}
                                {/* map karena jumlah segment dinamis sesuai panjang array data */}
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            {/* Tooltip : kotak info yang muncul saat hover. content= untuk pakai komponen custom */}
                            <Tooltip content={<CustomTooltip unit={unit} />} />
                            {/* Legend : label nama segment di bawah chart */}
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </CardComp>
    );
}
