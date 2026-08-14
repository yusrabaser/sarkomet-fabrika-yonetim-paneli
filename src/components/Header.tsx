import React from 'react';
import { AuthUser } from '../types';
import { Database, PlusCircle, Users, RefreshCw, Factory, LogOut, User, ShieldCheck, Menu } from 'lucide-react';

interface HeaderProps {
  currentUser: AuthUser;
  onLogout: () => void;
  onOpenAddModal: () => void;
  onResetData?: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onOpenAddModal,
  onToggleMobileSidebar,
}) => {
  return (
    <header className="bg-slate-900 border-b border-amber-900/40 text-slate-100 shadow-xl sticky top-0 z-30">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex flex-row items-center justify-between gap-3">
        {/* Brand identity & Mobile Toggle */}
        <div className="flex items-center space-x-3">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors cursor-pointer"
              title="Sol Menüyü Aç/Kapat"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 via-orange-600 to-amber-800 shadow-lg shadow-orange-900/30 border border-amber-400/30 shrink-0">
            <Factory className="w-5 h-5 text-amber-100" />
            <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-sans">
                SARKOMET <span className="text-amber-400 font-extrabold">A.Ş.</span>
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Bakır Fabrikası
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {currentUser.role === 'ADMIN'
                ? 'İnsan Kaynakları & Kalite Yönetim Portalı (Admin)'
                : 'Personel Eğitim Portalı & Kişisel Takip Sistemi'}
            </p>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Admin Tools */}
          {currentUser.role === 'ADMIN' && (
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-900/20 transition-colors border border-amber-400/30 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
              Veri Ekle
            </button>
          )}

          {/* User Profile Badge */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
            <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-500/30">
                {currentUser.role === 'ADMIN' ? 'A' : currentUser.fullName.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <span className="block text-xs font-bold text-slate-100 leading-tight">
                  {currentUser.fullName}
                </span>
                <span className="block text-[10px] text-amber-400/90 font-medium leading-tight">
                  {currentUser.role === 'ADMIN' ? 'Yönetici' : currentUser.departmentName || 'Personel'}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              title="Oturumu Kapat"
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 transition-all active:scale-95 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Çıkış Yap</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
