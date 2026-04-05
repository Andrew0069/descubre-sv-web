import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import DetalleLugar from './pages/DetalleLugar'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lugar/:id" element={<DetalleLugar />} />
      </Routes>
    </BrowserRouter>
  )
}
