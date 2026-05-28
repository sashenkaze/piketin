import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

function App() {
    // state simpen data user yg login, awallnya null blm cek
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    //! ambil token dr localstorage 
    useEffect(() => {
        //* ambil token sm userData dr localstorage  
        const token = localStorage.getItem("token");
        const storedUserDataString = localStorage.getItem("userData")

        //! kl token gk ada atau userData nya g ada balik ke login
        if (!token || !storedUserDataString) {
            console.log("Token atau UserData tidak ditemukan, silakan login lagi.");
            navigate("/login");
            return;
        }

        try {
            const parsedUserData = JSON.parse(storedUserDataString); // parse ke obj JS dr str JSON
            setUser(parsedUserData);
            console.log("UserData dari storage:", parsedUserData);
        } catch (parseError) {
            console.error("Gagal parse userData dari localStorage:", parseError);
            //* hapus data yg masalah kl error
            localStorage.removeItem("token");
            localStorage.removeItem("userData");
            navigate("/login");
            return;
        }
        setLoading(false);
    }, [navigate]) //* proses login cmn sekali pas halaman di load

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <span className="text-lg">Memuat aplikasi...</span>
            </div>
        )
    }

    //! kl login valid, arahkan ke dashboard sesuai role
    if (user) {
        let dashboardContent;
        // Gunakan switch statement untuk menentukan konten berdasarkan role user
        switch (user.role) {
            case 'murid':
                dashboardContent = (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Dashboard Murid</h2>
                        <p className="text-gray-600 dark:text-gray-300">Halo, {user.name}!</p>
                        <p className="text-gray-600 dark:text-gray-300">Anda dapat mengajukan absen piket harian atau piket WC di sini.</p>
                        {/* Tambahkan komponen/submenu khusus murid di sini nanti */}
                    </div>
                );
                break;
            case 'psrayon':
                dashboardContent = (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Dashboard Ps. Rayon</h2>
                        <p className="text-gray-600 dark:text-gray-300">Halo, {user.name}!</p>
                        <p className="text-gray-600 dark:text-gray-300">Anda dapat mengelola data murid di rayon Anda ({user.rayon_id}).</p>
                        {/* Tambahkan komponen/submenu khusus psrayon di sini nanti */}
                    </div>
                );
                break;
            case 'kokurikuler':
                dashboardContent = (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Dashboard Kokurikuler</h2>
                        <p className="text-gray-600 dark:text-gray-300">Halo, {user.name}!</p>
                        <p className="text-gray-600 dark:text-gray-300">Anda dapat menyetujui atau menolak absen piket WC di sini.</p>
                        {/* Tambahkan komponen/submenu khusus kokurikuler di sini nanti */}
                    </div>
                );
                break;
            case 'administrator':
                dashboardContent = (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Dashboard Administrator</h2>
                        <p className="text-gray-600 dark:text-gray-300">Halo, {user.name}!</p>
                        <p className="text-gray-600 dark:text-gray-300">Anda dapat mengelola akun pengguna dan rayon di sini.</p>
                        {/* Tambahkan komponen/submenu khusus admin di sini nanti */}
                    </div>
                );
                break;
            default:
                dashboardContent = <p className="text-red-500">Role tidak dikenali: {user.role}</p>;
        }

        return (
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Dashboard BE-PIKETIN</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Selamat datang, {user.name}!</p>
                {dashboardContent}
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <span className="text-lg text-red-500">Terjadi kesalahan saat memuat dashboard. Silakan login kembali.</span>
        </div>
    );
}

export default App;