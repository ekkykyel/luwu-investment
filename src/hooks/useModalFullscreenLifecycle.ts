import { useEffect, useRef } from 'react';
import { ensureFullscreen } from '../utils/fullscreen';

interface UseModalFullscreenLifecycleOptions {
  isOpen: boolean;
  onClose: () => void;
  enableFullscreenRecovery?: boolean;
}

/**
 * Hook to manage persistent fullscreen, Android hardware back button interception,
 * and History API state synchronization when modals open/close.
 */
export function useModalFullscreenLifecycle({
  isOpen,
  onClose,
  enableFullscreenRecovery = true,
}: UseModalFullscreenLifecycleOptions) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const hasPushedStateRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isOpen) {
      // 1. Push dummy state to window.history to capture Android hardware Back button
      if (!hasPushedStateRef.current) {
        window.history.pushState({ modalOpen: true, timestamp: Date.now() }, '', window.location.href);
        hasPushedStateRef.current = true;
      }

      // 2. Popstate listener for this modal
      const handlePopState = (event: PopStateEvent) => {
        hasPushedStateRef.current = false;
        onCloseRef.current();

        if (enableFullscreenRecovery) {
          setTimeout(() => {
            ensureFullscreen();
          }, 150);
        }
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    } else {
      // When modal is closed via UI button or backdrop click
      if (hasPushedStateRef.current) {
        hasPushedStateRef.current = false;
        // If history state is still ours, pop it safely
        if (window.history.state?.modalOpen) {
          window.history.back();
        }
      }

      if (enableFullscreenRecovery) {
        setTimeout(() => {
          ensureFullscreen();
        }, 150);
      }
    }
  }, [isOpen, enableFullscreenRecovery]);
}

/**
 * Global Popstate & Fullscreen keeper for application-wide modal trees
 */
export function useGlobalFullscreenBackHandler(isAnyModalOpen: boolean, closeActiveModal: () => void) {
  const isAnyModalOpenRef = useRef(isAnyModalOpen);
  isAnyModalOpenRef.current = isAnyModalOpen;

  const closeActiveModalRef = useRef(closeActiveModal);
  closeActiveModalRef.current = closeActiveModal;

  const hasPushedStateRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isAnyModalOpen) {
      if (!hasPushedStateRef.current) {
        window.history.pushState({ modalOpen: true, globalModal: true }, '', window.location.href);
        hasPushedStateRef.current = true;
      }
    } else {
      if (hasPushedStateRef.current) {
        hasPushedStateRef.current = false;
        if (window.history.state?.modalOpen) {
          window.history.back();
        }
      }
    }
  }, [isAnyModalOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      if (isAnyModalOpenRef.current) {
        hasPushedStateRef.current = false;
        closeActiveModalRef.current();
        setTimeout(() => {
          ensureFullscreen();
        }, 150);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
}
