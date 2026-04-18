import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import DetalleLugar from './pages/DetalleLugar'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Perfil from './pages/Perfil'
import SugerirLugar from './pages/SugerirLugar'
import NotFound from './pages/NotFound'
import AdminPage from './pages/AdminPage'
import MisFavoritos from './pages/MisFavoritos'

function AnimatedRoutes() {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState('fadeIn')

  useEffect(() => {
    if (
      location.pathname !== displayLocation.pathname ||
      location.search !== displayLocation.search ||
      location.hash !== displayLocation.hash
    ) {
      setTransitionStage('fadeOut')
    }
  }, [location, displayLocation])

  return (
    <>
      <style>{`
        @keyframes fadeInUpToast {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-8px); }
        }
        .page-fadeIn {
          animation: fadeIn 0.3s ease forwards;
        }
        .page-fadeOut {
          animation: fadeOut 0.2s ease forwards;
        }
      `}</style>
      <div
        className={`page-${transitionStage}`}
        onAnimationEnd={() => {
          if (transitionStage === 'fadeOut') {
            setTransitionStage('fadeIn')
            setDisplayLocation(location)
          }
        }}
      >
        <Routes location={displayLocation}>
          <Route path="/" element={<Home />} />
          <Route path="/lugar/:id" element={<DetalleLugar />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/sugerir-lugar" element={<SugerirLugar />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/favoritos" element={<MisFavoritos />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
