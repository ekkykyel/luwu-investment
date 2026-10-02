import React from 'react';
import { DataProvider } from './providers/DataProvider';
import { GlobalModalProvider } from './providers/GlobalModalProvider';
import { AppRouter } from './routes/AppRouter';

/**
 * Main Application Root Entry Point
 * InvestLuwuHub (Gov-Ecosystem-Luwu)
 *
 * Architecture: Clean Provider Wrapper & Enterprise Routing Hierarchy
 */
export default function App() {
  return (
    <DataProvider>
      <GlobalModalProvider>
        <AppRouter />
      </GlobalModalProvider>
    </DataProvider>
  );
}
