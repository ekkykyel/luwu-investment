import { useEffect, useRef } from 'react';
import { isAndroidDevice } from './useDeviceAutomation';
import { ensureFullscreen } from '../utils/fullscreen';

/**
 * Global hook to handle modal lifecycle on Android & mobile browsers:
 * 1. Pushes dummy history state so Android hardware back button closes the active modal rather than navigating away.
 * 2. Catches ESC key on desktop/keyboard.
 * 3. Restores fullscreen or scroll state upon closing modals.
 */
export function useGlobalFullscreenBackHandler(
  isModalOpen: boolean,
  onClose: () => void
) {
  const isModalOpenRef = useRef(isModalOpen);
  const onCloseRef = useRef(onClose);

  isModalOpenRef.current = isModalOpen;
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isModalOpen) return;

    // Push state to history for back-button interception
    const stateObj = { modalOpen: true, timestamp: Date.now() };
    window.history.pushState(stateObj, '');

    const handlePopState = (event: PopStateEvent) => {
      if (isModalOpenRef.current) {
        onCloseRef.current();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isModalOpenRef.current) {
        onCloseRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);
}

/**
 * Dedicated hook for individual modal components to ensure full immersion and lifecycle cleanup.
 */
export function useModalFullscreenLifecycle(
  isOpen: boolean,
  onClose: () => void
) {
  useGlobalFullscreenBackHandler(isOpen, onClose);

  useEffect(() => {
    if (isOpen && isAndroidDevice()) {
      ensureFullscreen();
    }
  }, [isOpen]);
}
