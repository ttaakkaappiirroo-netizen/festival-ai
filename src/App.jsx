import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Shops from './pages/Shops'
import Map from './pages/Map'
import Timetable from './pages/Timetable'

// ページ遷移のたびにスクロール位置を先頭へ戻す
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shops" element={<Shops />} />
        <Route path="/map" element={<Map />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  )
}

export default App
