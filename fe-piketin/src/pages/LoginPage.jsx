import React from "react";
import { useState } from "react";
import { Button, TextInput, Label } from "flowbite-react";
import { useNavigate } from "react-router-dom";
import CardComp from "../components/CardComp";
import { BrushCleaning, MoveRight, Mail, Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
    const [formData, setFormData] = useState({ email: "", password: "" }); //! simpan data login dan tambah obj kosong untuk fieldny
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleChange = (e) => {
        // name: ambil nama field
        // value: ya isinya lol
        const { name, value } = e.target; //* destructure obj dari e.target  
        //! ...: bongkar isi prev dr obj ke folder baru
        setFormData((prev) => ({ ...prev, [name]: value })); // update state setFormData
        //* nama pakai [] karna itu nama variable yg isinya td email & password
        // value: value dari input field dan isinya masuk ke [name]
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); //! egah refresh halaman saat event submit
        setError(""); // refresh pesan error sebelumnya
        setLoading(true);

        //! kirim data login ke be
        try {
            const res = await fetch("http://localhost:3000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json", //* kirim data dlm format json
                },
                body: JSON.stringify(formData), // konver obj formdata jd string json
            });

            // kl login aman
            if (res.ok) {
                const responseData = await res.json(); //* ganti body str json td jd obj JS  
                // responseData.data: obj dalam 'data' di output postman
                //! data: userData: alias destructuring untuk ganti nama data jadi userData
                const { token, data: userData } = responseData.data;
                localStorage.setItem("token", token) // simpan ke localstorage data token hasil login
                localStorage.setItem("userData", JSON.stringify(userData)) //* ubah jd string dr obj JS

                console.log("Login berhasil:", userData)
                navigate("/")
            } else {
                const errorData = await res.json().catch(() => ({ message: "Login gagal. Periksa email & password Anda." }));
                // simpen error msg ke state 
                setError(errorData.message || "Terjadi kesalahan saat login.");
            }
        } catch (err) { // kl error lain
            console.error("Error login:", err);
            setError(
                "Gagal terhubung ke server. Periksa koneksi internet atau backend.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen overflow-hidden">

        <div className="min-h-screen flex items-center justify-center bg-white p-0 lg:p-0 animate-fadeIn">

            {/* KOLOM KIRI */}
            <div className="hidden lg:flex lg:w-1/2 relative min-h-screen overflow-hidden bg-gray-50 items-center justify-center p-12">
                <div className="absolute inset-0 bg-linear-to-br from-green-50 via-white to-purple-50 z-0"></div>
                <div
                    className="absolute inset-0 opacity-20 z-0"
                    style={{
                        backgroundImage: `radial-gradient(#c1c6d4 1px, transparent 1px)`,
                        backgroundSize: '24px 24px',
                    }}
                    ></div>

                <div className="relative z-10 w-full max-w-lg aspect-square rounded-3xl overflow-hidden shadow-2xl border border-white/60 bg-white/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full h-full rounded-2xl overflow-hidden relative group">
                        <img
                            alt="Modern educational environment"
                            className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                            src="https://smkwikrama.sch.id/storage/1701159048-berita$berita.JPG"
                            />
                        <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent"></div>
                    </div>
                </div>

                <div className="absolute bottom-16 left-0 right-0 text-center z-10 px-8">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <BrushCleaning className="w-8 h-8 text-green-600" />
                        <span className="text-green-600 text-3xl font-bold tracking-tight">PiketIn</span>
                    </div>
                    <p className="text-lg text-gray-600 max-w-sm mx-auto font-medium">
                        Atur semua perputaran jadwal piket dan absensi sekolah tanpa ribet.
                    </p>
                </div>
            </div>

            {/* KOLOM KANAN */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10 bg-white lg:bg-transparent">
                <CardComp className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-xl p-8 sm:p-12 transition-all duration-300">

                    <div className="mb-10 text-left">
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Welcome Back</h1>
                        <p className="text-gray-500 font-medium text-base">Please enter your details to sign in.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="space-y-2">
                            <p className="text-xs font-bold uppercase tracking-wider text-green-700 ml-1">
                                Email Address
                            </p>
                            <Label htmlFor="email" value="Email Address" className="block text-sm font-semibold text-gray-700 ml-1" />
                            <div className="relative group">
                                <TextInput
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="email@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    icon={Mail}
                                    theme={{
                                        field: {
                                            input: {
                                                colors: {
                                                    gray: "bg-white border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-xl"
                                                }, base: "block w-full pl-11 p-3.5 text-gray-900 text-sm shadow-sm transition-all"
                                            }
                                        }
                                    }}
                                    />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-xs font-bold uppercase tracking-wider text-green-700 ml-1">
                                    Password
                                </p>
                                <a href="#" className="text-sm font-bold text-green-600 hover:text-green-700 transition-colors">
                                    Forgot password?
                                </a>
                            </div>
                            <div className="relative group">
                                <TextInput
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    icon={Lock}
                                    theme={{
                                        field: {
                                            input: {
                                                colors: {
                                                    gray: "bg-white border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-xl"
                                                },
                                                base: "block w-full pl-11 p-3.5 text-gray-900 text-sm shadow-sm transition-all"
                                            }
                                        }
                                    }
                                }
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 px-1">
                            <input
                                id="remember"
                                name="remember"
                                type="checkbox"
                                className="w-4.5 h-4.5 border border-gray-300 rounded-md bg-white text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                                />
                            <label htmlFor="remember" className="text-sm font-medium text-gray-600 cursor-pointer select-none">
                                Remember me
                            </label>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            isProcessing={loading}
                            className="w-full bg-green-600 hover:bg-green-700 enabled:hover:bg-green-700 text-white font-bold rounded-xl text-sm py-2.5 transition-all active:scale-[0.98] shadow-lg shadow-green-200 flex items-center justify-center gap-2 border-none"
                            >
                            {!loading && (
                                <div className="flex items-center justify-center gap-2">
                                    <span>Sign In</span>
                                    <MoveRight className="h-5 w-5" />
                                </div>
                            )}
                            {loading && "Signing In..."}
                        </Button>
                    </form>

                    <div className="mt-12 text-center border-t border-gray-100 pt-8">
                        <p className="text-sm text-gray-500 font-medium">
                            Don't have an account?{" "}
                            <text className="font-bold text-green-600 hover:text-green-800 underline underline-offset-4 decoration-2 decoration-green-100 hover:decoration-green-300 transition-all">
                                Ur chopped
                            </text>
                        </p>
                    </div>
                </CardComp>
            </div>
        </div>
                            </div>
    );

}
