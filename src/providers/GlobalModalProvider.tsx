import React, { createContext, useContext, useState, ReactNode, Suspense, lazy } from 'react';
import { Investment } from '../types';
import { useData } from '../contexts/DataContext';

// Lazy load modals for optimal bundle size
const CommandPalette = lazy(() => import('../components/CommandPalette'));
const SupabaseDiagnosticModal = lazy(() => import('../components/SupabaseDiagnosticModal').then(m => ({ default: m.SupabaseDiagnosticModal })));
const ImageLightbox = lazy(() => import('../components/ImageLightbox'));
const CreateOperatorModal = lazy(() => import('../components/CreateOperatorModal'));
const ManageOperatorsModal = lazy(() => import('../components/ManageOperatorsModal'));
const HeroSettings = lazy(() => import('../components/HeroSettings'));
const StaffImageSettings = lazy(() => import('../components/StaffImageSettings'));
const AuditLogDashboard = lazy(() => import('../components/AuditLogDashboard').then(m => ({ default: m.AuditLogDashboard })));
const SystemLogsWidget = lazy(() => import('../components/SystemLogsWidget').then(m => ({ default: m.SystemLogsWidget })));

export interface ModalContextType {
  // Command Palette
  isCommandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;

  // Supabase Diagnostic
  isDiagnosticModalOpen: boolean;
  openDiagnosticModal: () => void;
  closeDiagnosticModal: () => void;

  // Image Lightbox
  lightboxState: { isOpen: boolean; images: string[]; initialIndex: number };
  openLightbox: (images: string[], initialIndex?: number) => void;
  closeLightbox: () => void;

  // Operator Management Modals
  isCreateOperatorOpen: boolean;
  openCreateOperator: () => void;
  closeCreateOperator: () => void;

  isManageOperatorsOpen: boolean;
  openManageOperators: () => void;
  closeManageOperators: () => void;

  // System Settings Modals
  isHeroSettingsOpen: boolean;
  openHeroSettings: () => void;
  closeHeroSettings: () => void;

  isStaffSettingsOpen: boolean;
  openStaffSettings: () => void;
  closeStaffSettings: () => void;

  // Log Modals
  isAuditLogOpen: boolean;
  openAuditLog: () => void;
  closeAuditLog: () => void;

  isSystemLogsOpen: boolean;
  openSystemLogs: () => void;
  closeSystemLogs: () => void;

  // Generic modal state trigger
  openModal: (modalName: string, payload?: any) => void;
  closeModal: (modalName: string) => void;
}

const GlobalModalContext = createContext<ModalContextType | undefined>(undefined);

export const useGlobalModal = () => {
  const context = useContext(GlobalModalContext);
  if (!context) {
    throw new Error('useGlobalModal must be used within a GlobalModalProvider');
  }
  return context;
};

interface GlobalModalProviderProps {
  children: ReactNode;
  isDarkMode?: boolean;
}

export const GlobalModalProvider: React.FC<GlobalModalProviderProps> = ({ children, isDarkMode = true }) => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);
  const [lightboxState, setLightboxState] = useState<{ isOpen: boolean; images: string[]; initialIndex: number }>({
    isOpen: false,
    images: [],
    initialIndex: 0,
  });

  const [isCreateOperatorOpen, setIsCreateOperatorOpen] = useState(false);
  const [isManageOperatorsOpen, setIsManageOperatorsOpen] = useState(false);
  const [isHeroSettingsOpen, setIsHeroSettingsOpen] = useState(false);
  const [isStaffSettingsOpen, setIsStaffSettingsOpen] = useState(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [isSystemLogsOpen, setIsSystemLogsOpen] = useState(false);

  const openLightbox = (images: string[], initialIndex = 0) => {
    setLightboxState({ isOpen: true, images, initialIndex });
  };

  const closeLightbox = () => {
    setLightboxState(prev => ({ ...prev, isOpen: false }));
  };

  const openModal = (modalName: string) => {
    switch (modalName) {
      case 'commandPalette': setIsCommandPaletteOpen(true); break;
      case 'diagnostic': setIsDiagnosticModalOpen(true); break;
      case 'createOperator': setIsCreateOperatorOpen(true); break;
      case 'manageOperators': setIsManageOperatorsOpen(true); break;
      case 'heroSettings': setIsHeroSettingsOpen(true); break;
      case 'staffSettings': setIsStaffSettingsOpen(true); break;
      case 'auditLog': setIsAuditLogOpen(true); break;
      case 'systemLogs': setIsSystemLogsOpen(true); break;
      default: console.warn(`Modal ${modalName} not recognized.`);
    }
  };

  const closeModal = (modalName: string) => {
    switch (modalName) {
      case 'commandPalette': setIsCommandPaletteOpen(false); break;
      case 'diagnostic': setIsDiagnosticModalOpen(false); break;
      case 'createOperator': setIsCreateOperatorOpen(false); break;
      case 'manageOperators': setIsManageOperatorsOpen(false); break;
      case 'heroSettings': setIsHeroSettingsOpen(false); break;
      case 'staffSettings': setIsStaffSettingsOpen(false); break;
      case 'auditLog': setIsAuditLogOpen(false); break;
      case 'systemLogs': setIsSystemLogsOpen(false); break;
    }
  };

  const value: ModalContextType = {
    isCommandPaletteOpen,
    openCommandPalette: () => setIsCommandPaletteOpen(true),
    closeCommandPalette: () => setIsCommandPaletteOpen(false),

    isDiagnosticModalOpen,
    openDiagnosticModal: () => setIsDiagnosticModalOpen(true),
    closeDiagnosticModal: () => setIsDiagnosticModalOpen(false),

    lightboxState,
    openLightbox,
    closeLightbox,

    isCreateOperatorOpen,
    openCreateOperator: () => setIsCreateOperatorOpen(true),
    closeCreateOperator: () => setIsCreateOperatorOpen(false),

    isManageOperatorsOpen,
    openManageOperators: () => setIsManageOperatorsOpen(true),
    closeManageOperators: () => setIsManageOperatorsOpen(false),

    isHeroSettingsOpen,
    openHeroSettings: () => setIsHeroSettingsOpen(true),
    closeHeroSettings: () => setIsHeroSettingsOpen(false),

    isStaffSettingsOpen,
    openStaffSettings: () => setIsStaffSettingsOpen(true),
    closeStaffSettings: () => setIsStaffSettingsOpen(false),

    isAuditLogOpen,
    openAuditLog: () => setIsAuditLogOpen(true),
    closeAuditLog: () => setIsAuditLogOpen(false),

    isSystemLogsOpen,
    openSystemLogs: () => setIsSystemLogsOpen(true),
    closeSystemLogs: () => setIsSystemLogsOpen(false),

    openModal,
    closeModal,
  };

  return (
    <GlobalModalContext.Provider value={value}>
      {children}

      {/* Global Lazy-loaded Modals */}
      <Suspense fallback={null}>
        {isDiagnosticModalOpen && (
          <SupabaseDiagnosticModal
            isOpen={isDiagnosticModalOpen}
            onClose={() => setIsDiagnosticModalOpen(false)}
          />
        )}

        {lightboxState.isOpen && (
          <ImageLightbox
            isOpen={lightboxState.isOpen}
            onClose={closeLightbox}
            images={lightboxState.images}
            initialIndex={lightboxState.initialIndex}
          />
        )}

        {isCreateOperatorOpen && (
          <CreateOperatorModal
            onClose={() => setIsCreateOperatorOpen(false)}
          />
        )}

        {isManageOperatorsOpen && (
          <ManageOperatorsModal
            onClose={() => setIsManageOperatorsOpen(false)}
          />
        )}

        {isHeroSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setIsHeroSettingsOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
              <HeroSettings />
            </div>
          </div>
        )}

        {isStaffSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setIsStaffSettingsOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
              <StaffImageSettings />
            </div>
          </div>
        )}

        {isAuditLogOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setIsAuditLogOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
              <AuditLogDashboard />
            </div>
          </div>
        )}

        {isSystemLogsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setIsSystemLogsOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
              <SystemLogsWidget />
            </div>
          </div>
        )}
      </Suspense>
    </GlobalModalContext.Provider>
  );
};
