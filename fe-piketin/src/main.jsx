import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes/index.jsx'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* RouterProvider : pembungkus element untuk memunculka elemn sesuai path yang diminta, router= : memberikan daftar routing yg ada di routes/index.jsx*/}
    <RouterProvider router={router} />
  </StrictMode>,
)
