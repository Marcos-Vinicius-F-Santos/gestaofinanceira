import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AdminClientProvider } from './contexts/AdminClientContext';
import { AuthProvider } from './contexts/AuthContext';
import { router } from './routes';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <AdminClientProvider>
        <RouterProvider router={router} />
      </AdminClientProvider>
    </AuthProvider>
  </React.StrictMode>,
);
