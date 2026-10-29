import React from 'react';
import { DataProvider } from './providers/DataProvider';
import { GlobalModalProvider } from './providers/GlobalModalProvider';
import { AppRouter } from './routes/AppRouter';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { useDeviceAutomation } from './hooks/useDeviceAutomation';

/**
 * Main Application Root Entry Point
 * Smart Investment Luwu (Gov-Ecosystem-Luwu)
 *
 * Architecture: Clean Provider Wrapper & Enterprise Routing Hierarchy
 */
export default function App() {
  useDeviceAutomation();

  return (
    <I18nextProvider i18n={i18n}>
      <DataProvider>
        <GlobalModalProvider>
          <AppRouter />
        </GlobalModalProvider>
      </DataProvider>
    </I18nextProvider>
  );
}

