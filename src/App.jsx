import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import DetalleLugar from './pages/DetalleLugar'
import Login from './pages/Login'

export default function App() {
  return (
    <BrowserRouter>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lugar/:id" element={<DetalleLugar />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}
