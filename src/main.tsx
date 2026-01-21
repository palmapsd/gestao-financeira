/* 
 * Entry Point - Sistema Palma.PSD
 * @author Starmannweb (https://starmannweb.com.br)
 * @date 2026-01-21 19:30
 * @version 1.0.0
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
