import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

export default function App() {
  // state simpen data user yg login, awallnya null blm cek
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  async function checkAuth() {
    // ambil token yg disimpam browser pas login
    const token = localStorage.getItem("token")

    // kl g ada token
    if (!token) {
      navigate("/login") // redirect ke login
      setLoading(false)
      return
    }

    try {
      const res = await fetch("https://localhost:3000/login", {
        headers: {
          "Authorization": `Bearer ${token}` // token dikirim di header kek postman
        }
      })
      // kl login berhasil di be (200 OK)
      if (res.ok) {
        const data = await res.json()
        setUser(data)                 // simpen data user ke state
      } else {
        // kl token expired/invalid (401/403), hapus token lama
        localStorage.removeItem("token")
        navigate("/login")            
      }
    } catch (error) {
      console.error(error)
      navigate("/login")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
    // dependency array [navigate]: efek ini akan jalan ulang klo fungsi navigate berubah
  }, [navigate])

  // nongolin teks pas lg loading
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <span className="text-lg">Memuat aplikasi...</span>
      </div>
    )
  }
  return (
    <Outlet />
  )
}

