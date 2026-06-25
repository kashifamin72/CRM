import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { BrandingProvider } from './contexts/BrandingContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToasterProvider } from './components/Toaster';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <ToasterProvider>
          <BrandingProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrandingProvider>
        </ToasterProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)
