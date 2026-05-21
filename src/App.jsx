import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Shops from './pages/Shops'
import Map from './pages/Map'
import News from './pages/News'
import Admin from './pages/Admin'
import Login from './pages/Login'
import RequireAdmin from './components/RequireAdmin'

// ページ遷移ごとにスクロール位置を先頭へ
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function App() {
  return (
    <div className="shell">
      <Header />
      <ScrollToTop />
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shops" element={<Shops />} />
          <Route path="/map" element={<Map />} />
          <Route path="/news" element={<News />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <Admin />
              </RequireAdmin>
            }
          />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}

export default App
