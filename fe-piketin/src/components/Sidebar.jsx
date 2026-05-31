import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Shield,
    GraduationCap,
    LogOut,
    X,
    School,
    ClipboardList,
    Droplets,
    Briefcase
} from 'lucide-react';

/**
 * Sidebar Component
 * Navigasi sidebar modular dengan link berbasis role dan profil user.
 */
export default function Sidebar({ user, isOpen, setIsOpen }) {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        // Hapus data auth dari local storage
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        // Redirect ke halaman login
        navigate("/login");
    };

    // Item menu navigasi — disesuaikan per role
    // admin: manage users & rayon
    // psrayon: manage murid & submission rayon
    const adminMenuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { name: 'Manage PS Rayon', icon: Users, path: '/manage-psrayon' },
        { name: 'Manage Kokurikuler', icon: Shield, path: '/manage-kokurikuler' },
        { name: 'Manage Rayon', icon: GraduationCap, path: '/manage-rayon' },
    ];

    const psRayonMenuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { name: 'Manage Murid', icon: GraduationCap, path: '/manage-murid' },
        { name: 'Jenis Pekerjaan', icon: Briefcase, path: '/jenis-pekerjaan' },
        { name: 'Submission Piket', icon: Shield, path: '/submission-piket' },
    ];

    //* menu murid — absen piket rayon dan absen piket wc
    const muridMenuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { name: 'Absen Piket Rayon', icon: ClipboardList, path: '/absen-rayon' },
        { name: 'Absen Piket WC', icon: Droplets, path: '/absen-wc' },
    ];

    //! pilih menu sesuai role
    const menuItems = user?.role === 'psrayon' ? psRayonMenuItems
        : user?.role === 'murid' ? muridMenuItems
        : adminMenuItems;

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
        fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 z-50
        transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>

                {/* Sidebar Header: Logo & Brand */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-600 p-2 rounded-xl text-white shadow-lg shadow-green-100">
                            <School size={24} strokeWidth={2.5} />
                        </div>
                        <span className="text-2xl font-extrabold text-gray-900 tracking-tight">Piketin</span>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600 p-1">
                        <X size={20} />
                    </button>
                </div>

                {/* Menu Navigasi */}
                <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path || (item.name === 'Dashboard' && (location.pathname === '/' || location.pathname === '/dashboard'));
                        return (
                            <button
                                key={item.name}
                                onClick={() => {
                                    navigate(item.path);
                                    if (setIsOpen) setIsOpen(false);
                                }}
                                className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200
                    ${isActive
                                        ? 'bg-green-600 text-white shadow-md shadow-green-100'
                                        : 'text-gray-500 hover:bg-green-50 hover:text-green-600'
                                    }
                `}
                            >
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                {item.name}
                            </button>
                        );
                    })}
                </nav>

                {/* User Profile Section & Logout */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3 px-2 mb-4">
                        <div className="w-10 h-10 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-green-700 font-bold">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'Administrator'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@piketin.com'}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={20} strokeWidth={2.5} />
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}
