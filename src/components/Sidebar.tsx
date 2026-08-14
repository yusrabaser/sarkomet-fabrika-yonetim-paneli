import React, { useRef } from 'react';
import { QueryTabKey, AuthUser } from '../types';
import { QUERY_TAB_OPTIONS } from '../data/mockData';
import {
  Factory,
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  Clock,
  Building2,
  Award,
  BarChart3,
  PlusCircle,
  RefreshCw,
  LogOut,
  ChevronRight,
  ShieldCheck,
  X,
  Database,
  Download,
  Upload,
  Save,
  HardHat,
  Trash2,
  Cpu,
  FlaskConical,
} from 'lucide-react';

interface SidebarProps {
  activeTab: QueryTabKey;
  onSelectTab: (tabKey: QueryTabKey) => void;
  currentUser: AuthUser;
  onLogout: () => void;
  onOpenAddModal: () => void;
  onResetData?: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  trashCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onLogout,
  onOpenAddModal,
  onExportBackup,
  onImportBackup,
  isOpenMobile,
  onCloseMobile,
  trashCount = 0,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportBackup(file);
      e.target.value = ''; // reset input
    }
  };
  const getIcon = (key: QueryTabKey) => {
    switch (key) {
      case 'DASHBOARD':
        return <LayoutDashboard className="w-4 h-4" />;
      case 'ALL_EMPLOYEES':
        return <Users className="w-4 h-4" />;
      case 'ALL_TRAININGS':
        return <BookOpen className="w-4 h-4" />;
      case 'LONGEST_TRAINING':
        return <Award className="w-4 h-4" />;
      case 'CONTRACTOR_TRACKING':
        return <HardHat className="w-4 h-4" />;
      case 'SKILL_MATRIX':
        return <Factory className="w-4 h-4 text-amber-400" />;
      case 'ISO_AUDIT':
        return <Award className="w-4 h-4 text-emerald-400" />;
      case 'MACHINES':
        return <Cpu className="w-4 h-4 text-cyan-400" />;
      case 'QUALITY_CONTROL':
        return <FlaskConical className="w-4 h-4 text-purple-400" />;
      case 'RECYCLE_BIN':
        return <Trash2 className="w-4 h-4 text-rose-400" />;
      default:
        return <Database className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* Mobile Overlay Background */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header / Logo */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 via-orange-600 to-amber-800 shadow-md shadow-orange-950/40 border border-amber-400/30 shrink-0">
              <Factory className="w-5 h-5 text-amber-100" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white leading-tight">
                SARKOMET <span className="text-amber-400">A.Ş.</span>
              </h1>
              <p className="text-[11px] font-medium text-amber-300/90 tracking-wide">
                Yönetim Paneli
              </p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons for Admin */}
        {currentUser.role === 'ADMIN' && (
          <div className="p-3 border-b border-slate-800/80 bg-slate-900/50 space-y-2">
            <button
              onClick={() => {
                onOpenAddModal();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-950/30 border border-amber-400/30 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              Yeni Veri / Eğitim Ekle
            </button>
          </div>
        )}

        {/* Navigation Menu Links */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {currentUser.role === 'CONTRACTOR'
              ? 'Taşeron Portalı Menüsü'
              : 'Modüler Ekran Menüsü'}
          </div>

          {(currentUser.role === 'CONTRACTOR'
            ? QUERY_TAB_OPTIONS.filter((opt) => opt.key === 'CONTRACTOR_TRACKING')
            : QUERY_TAB_OPTIONS
          ).map((opt) => {
            const isActive = opt.key === activeTab;
            return (
              <button
                key={opt.key}
                onClick={() => {
                  onSelectTab(opt.key);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-300 font-bold border border-amber-500/60 shadow-lg shadow-amber-950/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                        : 'bg-slate-800 text-slate-400 group-hover:text-amber-400 group-hover:bg-slate-750'
                    }`}
                  >
                    {getIcon(opt.key)}
                  </div>
                  <span className="text-xs sm:text-sm font-medium truncate">
                    {currentUser.role === 'CONTRACTOR'
                      ? 'Taşeron Çalışanlarım ve Evrak Yükleme'
                      : opt.label}
                  </span>
                  {opt.key === 'RECYCLE_BIN' && trashCount !== undefined && trashCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-black rounded-full bg-rose-500 text-white shrink-0 shadow-sm shadow-rose-950/50">
                      {trashCount}
                    </span>
                  )}
                </div>

                {isActive ? (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                )}
              </button>
            );
          })}

          {/* Backup & Restore Dedicated Card */}
          {currentUser.role === 'ADMIN' && (
            <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-amber-400">
                <Save className="w-4 h-4" />
                <span className="text-xs font-bold text-white">Sistem Veri Yedeği</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Verileriniz otomatik hafızaya kaydedilir. JSON yedeği indirip istediğiniz an geri yükleyebilirsiniz.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={onExportBackup}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold bg-amber-600/90 hover:bg-amber-500 text-white shadow transition-all cursor-pointer"
                  title="Tüm Sistem Verilerini JSON Olarak İndir"
                >
                  <Download className="w-3.5 h-3.5" />
                  Yedek İndir
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                  title="Önceden İndirilmiş JSON Yedeğini Geri Yükle"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  Geri Yükle
                </button>
              </div>

              {/* Hidden File Input for JSON Restore */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>

        {/* Sidebar Footer / Current User Info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-500/30 shrink-0">
                {currentUser.role === 'ADMIN' ? (
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                ) : (
                  currentUser.fullName.charAt(0)
                )}
              </div>
              <div className="truncate">
                <span className="block text-xs font-bold text-white truncate">
                  {currentUser.fullName}
                </span>
                <span className="block text-[10px] text-amber-400/90 font-medium truncate">
                  {currentUser.role === 'ADMIN'
                    ? 'Yönetici (Admin)'
                    : currentUser.role === 'CONTRACTOR'
                    ? `${currentUser.contractorCompany || 'Taşeron Firma Portalı'}`
                    : currentUser.departmentName || 'Personel'}
                </span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors cursor-pointer shrink-0"
              title="Oturumu Kapat"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
