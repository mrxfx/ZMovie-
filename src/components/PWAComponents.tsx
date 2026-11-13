import React, { useState } from 'react';
import { ChevronRight, Download, Smartphone, WifiOff, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const PWAInstallButton: React.FC<{
  variant?: 'header' | 'sheet' | 'card';
  onAction?: () => void;
}> = ({ variant = 'header', onAction }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="rounded-2xl bg-white/[0.06] border border-white/15 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#E50914]/20 border border-[#E50914]/40 text-[#E50914] flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">ZyvoMovie App Installed</p>
              <p className="text-xs text-white/65">Running in standalone app mode.</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
      onAction?.();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  if (!isInstallable && !isIOS) {
    if (variant === 'card') {
      return (
        <div className="rounded-2xl bg-white/[0.06] border border-white/15 p-4 flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 text-white flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Install ZyvoMovie App</p>
            <p className="text-xs text-white/65 mt-0.5 leading-relaxed">
              Use your browser&rsquo;s menu (&ldquo;Add to Home screen&rdquo; or &ldquo;Install
              app&rdquo;) on Android Chrome to launch ZyvoMovie in standalone mode.
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {variant === 'header' && (
        <button
          type="button"
          onClick={() => void handleInstallClick()}
          aria-label="Install ZyvoMovie App"
          className="inline-flex items-center justify-center gap-1.5 px-3 min-h-[44px] md:min-h-[36px] rounded-full bg-white/12 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#E50914]" />
          <span className="hidden xs:inline sm:inline">Install</span>
        </button>
      )}

      {variant === 'sheet' && (
        <button
          type="button"
          onClick={() => void handleInstallClick()}
          className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 min-h-[48px] rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-white font-medium transition-all cursor-pointer"
        >
          <span className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-[#E50914]/25 border border-[#E50914]/45 text-[#E50914] flex items-center justify-center shrink-0">
              <Download className="w-[18px] h-[18px]" />
            </span>
            <span className="text-sm truncate">
              {isIOS ? 'Add to Home Screen' : 'Install ZyvoMovie App'}
            </span>
          </span>
          <ChevronRight className="w-4 h-4 text-white/55 shrink-0" />
        </button>
      )}

      {variant === 'card' && (
        <div className="rounded-2xl bg-white/[0.07] border border-white/18 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-[#E50914] text-white flex items-center justify-center shrink-0 shadow-[0_8px_20px_-4px_rgba(229,9,20,0.55)]">
              <Download className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Install ZyvoMovie App</p>
              <p className="text-xs text-white/70">
                Launch fullscreen from your home screen with offline shell support.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleInstallClick()}
            className="px-4 py-2.5 min-h-[44px] rounded-full bg-[#E50914] hover:bg-[#B20710] text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            {isIOS ? 'How to Install' : 'Install App'}
          </button>
        </div>
      )}

      {showIOSGuide && (
        <div
          className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Install ZyvoMovie on iPhone or iPad"
        >
          <div className="w-full max-w-sm glass-bottom-dock glass-specular rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-base font-bold text-white">
                Add ZyvoMovie to Home Screen
              </h3>
              <button
                type="button"
                aria-label="Close installation instructions"
                onClick={() => setShowIOSGuide(false)}
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ol className="space-y-2 text-sm text-white/80 leading-relaxed list-decimal list-inside">
              <li>
                Tap the <strong className="text-white">Share</strong> button in your browser
                toolbar.
              </li>
              <li>
                Scroll down and select <strong className="text-white">Add to Home Screen</strong>.
              </li>
              <li>
                Tap <strong className="text-white">Add</strong> to launch ZyvoMovie as an app.
              </li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full min-h-[44px] rounded-full bg-[#E50914] text-white text-sm font-semibold cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0 z-[950] px-4 py-2 rounded-full bg-[#151922]/90 backdrop-blur-xl border border-amber-400/40 text-xs font-medium text-amber-100 shadow-xl flex items-center gap-2 whitespace-nowrap max-w-[calc(100vw-24px)]"
      style={{
        bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span className="truncate">Offline mode · Live catalog &amp; streams paused</span>
    </div>
  );
};
