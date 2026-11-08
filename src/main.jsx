import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from 'sonner';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster  position="top-right"
  richColors
  toastOptions={{
    style: { borderRadius: '12px', border: '1px solid rgb(226 232 240)' },
  }}/>
    </QueryClientProvider>
  </React.StrictMode>
);