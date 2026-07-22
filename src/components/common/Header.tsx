import React, { useState, useEffect } from 'react';
import { PawPrint, Sun, Moon, LogIn, LogOut, User as UserIcon, Download, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onOpenAuth: () => void;
  onSeedDemo?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth, onSeedDemo }) => {
  const { theme, toggleTheme } = useTheme();
  const { activeUser, isGuest, logout } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-[#E8E6DF] dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#7D9B76] flex items-center justify-center text-white shadow-md shadow-[#7d9b7633]">
            <PawPrint className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-[#2D2B26] dark:text-white">
              Pet Care
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F0F4EF] dark:bg-slate-800 text-[#7D9B76] dark:text-sage-300 border border-[#DCE6DA] dark:border-slate-700">
              PWA
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* PWA Install Button */}
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#F0F4EF] text-[#7D9B76] dark:bg-slate-800 dark:text-sage-300 hover:bg-[#E2EBE0] transition-all border border-[#DCE6DA] dark:border-slate-700"
              title="Instalar aplicativo"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Instalar App</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-[#7A776D] dark:text-slate-300 hover:bg-[#F3F1ED] dark:hover:bg-slate-800 transition-colors"
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-[#D4A373]" /> : <Moon className="w-5 h-5 text-[#3D3B36]" />}
          </button>

          {/* User Auth Info or Login Button */}
          {activeUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[#E8E6DF] dark:border-slate-800">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-[#2D2B26] dark:text-slate-200 max-w-[120px] truncate">
                  {activeUser.displayName || activeUser.email.split('@')[0] || 'Tutor'}
                </span>
                <span className="text-[10px] text-[#7A776D] dark:text-slate-400">
                  {activeUser.email}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#D4A373] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {(activeUser.displayName || activeUser.email || 'U')[0].toUpperCase()}
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl text-[#7A776D] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Sair da conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : isGuest ? (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline-block text-xs font-medium px-3 py-1 rounded-full bg-[#F3F1ED] dark:bg-slate-800 text-[#7A776D] dark:text-slate-300 border border-[#E8E6DF] dark:border-slate-700">
                Modo Visitante
              </span>
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-2xl bg-[#7D9B76] hover:bg-[#6b8664] text-white shadow-md shadow-[#7d9b7633] transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar / Cadastrar</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-2xl bg-[#7D9B76] hover:bg-[#6b8664] text-white shadow-md shadow-[#7d9b7633] transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
