import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import { Toaster } from 'sonner'
import './styles/index.css'

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