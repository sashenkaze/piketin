import React from "react";
import { useState } from "react";
import { Button, TextInput, Label } from "flowbite-react";
import { useNavigate } from "react-router-dom";
import CardComp from "../components/CardComp";

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
                const data = await res.json(); //* ganti body str json td jd obj JS  
                localStorage.setItem("token", data.token); // simpen token ke localstorage
                console.log("Login berhasil:", data);
                navigate("/");
            } else {
                const errorData = await res.json().catch(() => ({ message: "Login gagal. Periksa email & password Anda." }));
                // simpen error msg ke state 
                setError(errorData.message || "Terjadi kesalahan saat login.");
            }
        } catch (err) { //* kl error lain
            console.error("Error login:", err);
            setError(
                "Gagal terhubung ke server. Periksa koneksi internet atau backend.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <CardComp>
                <h2 className="text-xl font-bold text-center mb-4 text-gray-800 dark:text-white">
                    Login BE-PIKETIN
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label
                            htmlFor="email"
                            value="Email"
                            className="text-gray-700 dark:text-gray-300"
                        />
                        <TextInput
                            id="email"
                            name="email"
                            type="email"
                            placeholder="nama@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={loading} // Non-aktifkan input saat loading
                        />
                    </div>

                    <div>
                        <Label
                            htmlFor="password"
                            value="Password"
                            className="text-gray-700 dark:text-gray-300"
                        />
                        <TextInput
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={loading} // Non-aktifkan input saat loading
                        />
                    </div>

                    {/* Tampilkan error jika ada */}
                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={loading} // Non-aktifkan tombol saat loading
                        isProcessing={loading} // Tampilkan spinner di tombol saat loading
                    >
                        {loading ? "Memproses..." : "Login"}
                    </Button>
                </form>
            </CardComp>
        </div>
    );
}
