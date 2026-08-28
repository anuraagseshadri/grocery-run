import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'  // ✅ Correct - App.tsx is in src/ folder
import { Toaster } from 'sonner'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Toaster 
      position="top-center" 
      richColors 
      closeButton 
      duration={4000} 
    />
    <App />
  </React.StrictMode>,
)