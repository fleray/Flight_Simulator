import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Map } from 'react-map-gl';
import './index.css'
import App from './App.tsx'

const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}
