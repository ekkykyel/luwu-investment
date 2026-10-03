import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './providers/DataProvider';
import { GlobalModalProvider } from './providers/GlobalModalProvider';
import { AppRouter } from './routes/AppRouter';

/**
 * Main Application Root Entry Point
 * Smart Investment Luwu (Gov-Ecosystem-Luwu)
 *
 * Architecture: Clean Provider Wrapper & Enterprise Routing Hierarchy
 */
export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <GlobalModalProvider>
          <AppRouter />
        </GlobalModalProvider>
      </DataProvider>
    </AuthProvider>
  );
}
