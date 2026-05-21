import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { FestivalProvider } from './context/FestivalProvider.jsx'
import { AuthProvider } from './context/AuthProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FestivalProvider>
          <App />
        </FestivalProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
